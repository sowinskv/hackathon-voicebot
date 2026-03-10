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


class TranscriptLogger(FrameProcessor):
    """Captures and sends transcripts to the WebSocket client"""

    def __init__(self, websocket):
        super().__init__()
        self.websocket = websocket

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)

        # Capture user speech (from STT)
        if isinstance(frame, TranscriptionFrame):
            logger.info(f"User transcript: {frame.text}")
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
                logger.info(f"Bot transcript: {frame.text}")
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
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for voice conversations

    Client sends:
    - Audio chunks (binary)
    - Control messages (JSON): {"type": "config", "flowId": "...", "language": "..."}

    Client receives:
    - Audio chunks (binary)
    - Transcript messages (JSON): {"type": "transcript", "speaker": "bot", "text": "..."}
    """

    await websocket.accept()
    logger.info(f"WebSocket connected: {session_id}")

    # Wait for config message
    config_data = await websocket.receive_json()
    flow_id = config_data.get("flowId")
    language = config_data.get("language", "en")

    if not flow_id:
        await websocket.close(code=1008, reason="flowId required")
        return

    # Get flow configuration
    flow_config = await get_flow_config(flow_id)
    system_prompt = flow_config.get("data", {}).get("system_prompt", "You are a helpful AI assistant.")

    logger.info(f"Starting agent for session {session_id}, flow {flow_id}, language {language}")

    try:
        # Initialize transport
        transport = FastAPIWebsocketTransport(
            websocket=websocket,
            params=FastAPIWebsocketParams(
                audio_out_enabled=True,
                add_wav_header=True,
                audio_in_enabled=True,
            )
        )

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

        # Build simplified pipeline - just TTS output for now
        transcript_logger = TranscriptLogger(websocket)

        pipeline = Pipeline([
            transport.input(),
            transcript_logger,
            tts,
            transport.output(),
        ])

        # Create and run task
        task = PipelineTask(pipeline)

        # Store session
        runner = PipelineRunner()
        active_sessions[session_id] = runner

        # Start periodic bot messages
        async def periodic_messages():
            """Send periodic messages from the bot"""
            messages = [
                "Hello! I am your insurance assistant. How can I help you today?",
                "You can always report damage through our mobile app.",
                "Do you have any questions about your policy?",
                "I'm here to help you with all insurance matters.",
            ]
            index = 0

            # Send initial greeting immediately
            await asyncio.sleep(2)
            if session_id in active_sessions:
                try:
                    text = messages[0]
                    logger.info(f"[Periodic] Sending: {text}")

                    # Send to frontend as transcript
                    await websocket.send_json({
                        "type": "transcript",
                        "speaker": "bot",
                        "text": text,
                    })

                    # Generate audio with ElevenLabs directly and send to frontend
                    async with aiohttp_session.post(
                        f"https://api.elevenlabs.io/v1/text-to-speech/{os.getenv('ELEVENLABS_VOICE_ID', 'a3t1chm1dQkLxOQK6Jp7')}",
                        json={
                            "text": text,
                            "model_id": "eleven_multilingual_v2",
                        },
                        headers={
                            "xi-api-key": os.getenv("ELEVENLABS_API_KEY"),
                            "Content-Type": "application/json",
                        }
                    ) as resp:
                        if resp.status == 200:
                            audio_data = await resp.read()
                            logger.info(f"[Periodic] Got audio, size: {len(audio_data)} bytes")
                            # Send audio as binary to frontend
                            await websocket.send_bytes(audio_data)
                            logger.info(f"[Periodic] Sent audio to frontend")
                        else:
                            logger.error(f"[Periodic] ElevenLabs error: {resp.status}")

                except Exception as e:
                    logger.error(f"[Periodic] Error sending greeting: {e}", exc_info=True)

            index = 1

            # Send periodic messages
            while session_id in active_sessions:
                await asyncio.sleep(15)  # Wait 15 seconds

                if session_id not in active_sessions:
                    break

                try:
                    text = messages[index % len(messages)]
                    index += 1

                    logger.info(f"[Periodic] Sending: {text}")

                    # Send to frontend as transcript
                    await websocket.send_json({
                        "type": "transcript",
                        "speaker": "bot",
                        "text": text,
                    })

                    # Generate audio with ElevenLabs directly and send to frontend
                    async with aiohttp_session.post(
                        f"https://api.elevenlabs.io/v1/text-to-speech/{os.getenv('ELEVENLABS_VOICE_ID', 'a3t1chm1dQkLxOQK6Jp7')}",
                        json={
                            "text": text,
                            "model_id": "eleven_multilingual_v2",
                        },
                        headers={
                            "xi-api-key": os.getenv("ELEVENLABS_API_KEY"),
                            "Content-Type": "application/json",
                        }
                    ) as resp:
                        if resp.status == 200:
                            audio_data = await resp.read()
                            logger.info(f"[Periodic] Got audio, size: {len(audio_data)} bytes")
                            await websocket.send_bytes(audio_data)
                            logger.info(f"[Periodic] Sent audio to frontend")
                        else:
                            logger.error(f"[Periodic] ElevenLabs error: {resp.status}")

                except Exception as e:
                    logger.error(f"[Periodic] Error generating message: {e}", exc_info=True)

        # Start periodic messages in background
        asyncio.create_task(periodic_messages())

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
