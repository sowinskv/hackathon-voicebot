#!/usr/bin/env python3
"""
Pipecat Voice Server
WebSocket-based voice agent server (no WebRTC complexity!)
"""

import os
import asyncio
import logging
from typing import Dict, Optional
from dotenv import load_dotenv

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import httpx
import aiohttp

from pipecat.frames.frames import (
    EndFrame,
    Frame,
    TextFrame,
    TranscriptionFrame,
    LLMMessagesFrame,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask
from pipecat.processors.aggregators.llm_response import (
    LLMAssistantResponseAggregator,
    LLMUserResponseAggregator,
)
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.services.elevenlabs.stt import ElevenLabsSTTService
from pipecat.services.google.llm import GoogleLLMService
from pipecat.services.elevenlabs.tts import ElevenLabsTTSService
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketTransport,
    FastAPIWebsocketParams,
)

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Pipecat Voice Agent Server")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active sessions
active_sessions: Dict[str, PipelineRunner] = {}


class AudioDebugger(FrameProcessor):
    """Debug processor to see what frames are flowing"""

    def __init__(self, label="Debugger"):
        super().__init__()
        self.label = label
        self.frame_count = 0

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        self.frame_count += 1
        frame_type = type(frame).__name__

        if self.frame_count <= 20:  # Log first 20 frames
            logger.info(f"[{self.label}] Frame #{self.frame_count}: {frame_type} (direction: {direction})")
        elif self.frame_count % 100 == 0:
            logger.info(f"[{self.label}] Frame #{self.frame_count}: {frame_type}")

        await self.push_frame(frame, direction)


class TranscriptLogger(FrameProcessor):
    """Captures and sends transcripts to the WebSocket client"""

    def __init__(self, websocket):
        super().__init__()
        self.websocket = websocket
        self.frame_count = 0
        self.audio_frame_count = 0

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        self.frame_count += 1

        # Log all frame types for debugging
        frame_type = type(frame).__name__

        # Log audio frames separately
        if 'Audio' in frame_type or 'audio' in frame_type.lower():
            self.audio_frame_count += 1
            if self.audio_frame_count % 50 == 0:
                logger.info(f"[TranscriptLogger] Received {self.audio_frame_count} audio frames")

        # Log every frame type for first 10 frames, then every 100th
        if self.frame_count <= 10 or self.frame_count % 100 == 0:
            logger.info(f"[TranscriptLogger] Frame #{self.frame_count}: {frame_type} (direction: {direction})")

        # Capture user speech (from STT)
        if isinstance(frame, TranscriptionFrame):
            logger.info(f"[TranscriptLogger] ✅ User transcript: {frame.text}")
            try:
                await self.websocket.send_json({
                    "type": "transcript",
                    "speaker": "user",
                    "text": frame.text,
                    "timestamp": frame.timestamp if hasattr(frame, 'timestamp') else None,
                })
            except Exception as e:
                logger.error(f"Failed to send user transcript: {e}")

        # Capture assistant response (from LLM)
        elif isinstance(frame, TextFrame):
            # Only log substantial text responses
            if frame.text and len(frame.text.strip()) > 0:
                logger.info(f"[TranscriptLogger] Bot transcript: {frame.text}")
                try:
                    await self.websocket.send_json({
                        "type": "transcript",
                        "speaker": "bot",
                        "text": frame.text,
                        "timestamp": None,
                    })
                except Exception as e:
                    logger.error(f"Failed to send bot transcript: {e}")

        await self.push_frame(frame, direction)


async def get_flow_config(flow_id: str) -> Dict:
    """Fetch flow configuration from API Gateway"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{os.getenv('API_GATEWAY_URL', 'http://api-gateway:3000')}/api/flows/{flow_id}"
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"Failed to fetch flow config: {e}")
        return {}


@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "active_sessions": len(active_sessions),
        "services": {
            "elevenlabs_stt": bool(os.getenv("ELEVENLABS_API_KEY")),
            "gemini": bool(os.getenv("GEMINI_API_KEY")),
            "elevenlabs_tts": bool(os.getenv("ELEVENLABS_API_KEY")),
        }
    }


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str,
    flowId: str = None,
    language: str = "en"
):
    """
    WebSocket endpoint for voice conversations

    Query params:
    - flowId: Flow configuration ID (required)
    - language: Language code (default: en)

    Client sends:
    - Audio chunks (binary)

    Client receives:
    - Audio chunks (binary)
    - Transcript messages (JSON): {"type": "transcript", "speaker": "bot", "text": "..."}
    """

    if not flowId:
        await websocket.close(code=1008, reason="flowId query parameter required")
        return

    await websocket.accept()
    logger.info(f"WebSocket connected: {session_id}, flowId: {flowId}, language: {language}")

    # Get flow configuration
    flow_config = await get_flow_config(flowId)
    system_prompt = flow_config.get("data", {}).get("system_prompt", "You are a helpful AI assistant.")

    logger.info(f"Starting agent for session {session_id}, flow {flowId}, language {language}")

    # Track WebSocket messages for debugging
    original_receive = websocket.receive
    message_count = {"text": 0, "bytes": 0}

    async def logged_receive():
        data = await original_receive()
        if "text" in data:
            message_count["text"] += 1
            if message_count["text"] <= 5:
                logger.info(f"[WS] Received TEXT message #{message_count['text']}: {data['text'][:100]}")
        elif "bytes" in data:
            message_count["bytes"] += 1
            if message_count["bytes"] <= 10 or message_count["bytes"] % 100 == 0:
                logger.info(f"[WS] Received BYTES message #{message_count['bytes']}, size: {len(data['bytes'])} bytes")
        return data

    websocket.receive = logged_receive

    try:
        # Initialize transport
        logger.info(f"Creating FastAPIWebsocketTransport for session {session_id}")
        transport = FastAPIWebsocketTransport(
            websocket=websocket,
            params=FastAPIWebsocketParams(
                audio_out_enabled=True,
                add_wav_header=True,
                audio_in_enabled=True,
            )
        )
        logger.info(f"Transport created successfully")

        # Initialize services
        logger.info(f"Initializing ElevenLabs STT for language: {language}")

        # Create aiohttp session for ElevenLabs services
        aiohttp_session = aiohttp.ClientSession()

        # Map language codes for ElevenLabs (supports: en, es, fr, de, it, pt, pl, ja, zh, hi, ko, nl, tr, sv, id, fil, uk, el, cs, fi, ro, ru, da, bg, ms, sk, hr, ar, ta)
        elevenlabs_language = language if language in ['en', 'pl'] else 'en'

        stt = ElevenLabsSTTService(
            aiohttp_session=aiohttp_session,
            api_key=os.getenv("ELEVENLABS_API_KEY"),
            language=elevenlabs_language,
        )

        llm = GoogleLLMService(
            api_key=os.getenv("GEMINI_API_KEY"),
            model="gemini-2.0-flash-exp",
            system_instruction=system_prompt,
        )

        tts = ElevenLabsTTSService(
            aiohttp_session=aiohttp_session,
            api_key=os.getenv("ELEVENLABS_API_KEY"),
            voice_id=os.getenv("ELEVENLABS_VOICE_ID", "a3t1chm1dQkLxOQK6Jp7"),
            model="eleven_multilingual_v2",
        )

        # Build pipeline: STT -> User Aggregator -> LLM -> Assistant Aggregator -> TTS
        audio_debugger = AudioDebugger("AfterTransportInput")
        transcript_logger = TranscriptLogger(websocket)

        # Aggregators to collect user input and assistant responses
        user_aggregator = LLMUserResponseAggregator()
        assistant_aggregator = LLMAssistantResponseAggregator()

        pipeline = Pipeline([
            transport.input(),          # Receive audio from client
            audio_debugger,             # Debug frames
            stt,                        # Convert speech to text (TranscriptionFrame)
            user_aggregator,            # Collect user messages for LLM
            llm,                        # Generate response (TextFrame)
            assistant_aggregator,       # Collect assistant responses
            transcript_logger,          # Log transcripts to WebSocket
            tts,                        # Convert text to speech
            transport.output(),         # Send audio to client
        ])

        logger.info(f"Pipeline created with {len(pipeline.processors)} processors")

        # Create and run task
        task = PipelineTask(pipeline)

        # Store session
        runner = PipelineRunner()
        active_sessions[session_id] = runner

        # Send initial greeting as a text frame
        async def send_initial_greeting():
            """Send initial greeting through TTS"""
            await asyncio.sleep(1)  # Wait for pipeline to be ready
            if session_id in active_sessions:
                try:
                    greeting_text = "Hello! I'm your insurance assistant. How can I help you today?"
                    text_frame = TextFrame(greeting_text)
                    await task.queue_frame(text_frame)
                    logger.info("[Greeting] Queued initial greeting")

                    # Also send transcript to frontend
                    try:
                        await websocket.send_json({
                            "type": "transcript",
                            "speaker": "bot",
                            "text": greeting_text,
                        })
                    except:
                        pass
                except Exception as e:
                    logger.error(f"[Greeting] Error: {e}", exc_info=True)

        asyncio.create_task(send_initial_greeting())

        # Run pipeline
        await runner.run(task)

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {session_id}")
    except Exception as e:
        logger.error(f"Error in voice session {session_id}: {e}", exc_info=True)
    finally:
        # Cleanup
        if session_id in active_sessions:
            del active_sessions[session_id]

        # Close aiohttp session if it exists
        if 'aiohttp_session' in locals() and aiohttp_session and not aiohttp_session.closed:
            await aiohttp_session.close()

        logger.info(f"Session ended: {session_id}")


@app.post("/sessions/{session_id}/stop")
async def stop_session(session_id: str):
    """Stop an active session"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    runner = active_sessions[session_id]
    await runner.stop()

    return {"status": "stopped", "session_id": session_id}


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info",
    )
