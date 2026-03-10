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

from pipecat.frames.frames import EndFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask
from pipecat.processors.aggregators.llm_response import (
    LLMAssistantResponseAggregator,
    LLMUserResponseAggregator,
)
from pipecat.services.azure.stt import AzureSTTService
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
            "azure_stt": bool(os.getenv("AZURE_OPENAI_API_KEY")),
            "gemini": bool(os.getenv("GEMINI_API_KEY")),
            "elevenlabs": bool(os.getenv("ELEVENLABS_API_KEY")),
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
        # Use region from environment variable
        region = os.getenv("AZURE_OPENAI_REGION", "swedencentral")

        logger.info(f"Using Azure region: {region}")

        stt = AzureSTTService(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            region=region,
            language=language,
        )

        llm = GoogleLLMService(
            api_key=os.getenv("GEMINI_API_KEY"),
            model="gemini-2.0-flash-exp",
            system_instruction=system_prompt,
        )

        tts = ElevenLabsTTSService(
            api_key=os.getenv("ELEVENLABS_API_KEY"),
            voice_id=os.getenv("ELEVENLABS_VOICE_ID", "a3t1chm1dQkLxOQK6Jp7"),
            model="eleven_multilingual_v2",
        )

        # Build pipeline
        user_response = LLMUserResponseAggregator()
        assistant_response = LLMAssistantResponseAggregator()

        pipeline = Pipeline([
            transport.input(),
            stt,
            user_response,
            llm,
            tts,
            transport.output(),
            assistant_response,
        ])

        # Create and run task
        task = PipelineTask(pipeline)

        # Store session
        runner = PipelineRunner()
        active_sessions[session_id] = runner

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
