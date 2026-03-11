#!/usr/bin/env python3
"""
Simple Turn-Based Voice Server
No Pipecat - just direct API calls for simplicity
"""

import os
import asyncio
import logging
from typing import Dict
from dotenv import load_dotenv

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import httpx
import aiohttp
from google import genai

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Simple Voice Server")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini client
gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Store active sessions
active_sessions: Dict[str, dict] = {}


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


async def transcribe_audio(audio_data: bytes, language: str) -> str:
    """Transcribe audio using ElevenLabs STT"""
    try:
        # Convert raw PCM to WAV format
        import wave
        import io

        # Create WAV file in memory
        wav_buffer = io.BytesIO()
        with wave.open(wav_buffer, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(16000)  # 16kHz sample rate
            wav_file.writeframes(audio_data)

        wav_data = wav_buffer.getvalue()
        logger.info(f"[STT] Converted {len(audio_data)} bytes PCM to {len(wav_data)} bytes WAV")

        async with aiohttp.ClientSession() as session:
            url = "https://api.elevenlabs.io/v1/speech-to-text"

            # Create form data with proper WAV file
            data = aiohttp.FormData()
            data.add_field('file', wav_data, filename='audio.wav', content_type='audio/wav')
            data.add_field('model_id', 'scribe_v2')

            async with session.post(
                url,
                headers={
                    "xi-api-key": os.getenv("ELEVENLABS_API_KEY"),
                },
                data=data
            ) as resp:
                if resp.status == 200:
                    result = await resp.json()
                    transcript = result.get("text", "")
                    logger.info(f"[STT] Transcribed: {transcript}")
                    return transcript
                else:
                    error_text = await resp.text()
                    logger.error(f"[STT] Error {resp.status}: {error_text}")
                    return ""
    except Exception as e:
        logger.error(f"[STT] Exception: {e}", exc_info=True)
        return ""


async def generate_llm_response(client, model_name: str, system_prompt: str, history: list, user_message: str) -> tuple[str, bool]:
    """Generate response using Gemini. Returns (response_text, should_end_call)"""
    try:
        # Build messages with history
        messages = []
        for msg in history:
            messages.append(msg)
        messages.append({"role": "user", "parts": [{"text": user_message}]})

        response = await asyncio.to_thread(
            client.models.generate_content,
            model=model_name,
            contents=messages,
            config={
                "system_instruction": system_prompt,
            }
        )
        llm_text = response.text
        logger.info(f"[LLM] Response: {llm_text}")

        # Check if conversation should end (detect goodbye phrases)
        should_end = await check_conversation_end(llm_text, user_message)

        return llm_text, should_end
    except Exception as e:
        logger.error(f"[LLM] Error: {e}", exc_info=True)
        return "I'm sorry, I encountered an error. Could you repeat that?", False


async def check_conversation_end(bot_response: str, user_message: str) -> bool:
    """Check if conversation should end based on bot response or user message"""
    # Strong goodbye phrases that indicate conversation end
    strong_goodbye_phrases = [
        "goodbye", "bye", "end of call", "koniec rozmowy"
    ]

    # Phrases that only indicate goodbye when at the END of bot's message
    end_phrases = [
        "have a great day", "have a nice day", "take care",
        "thank you for calling", "thanks for calling",
        "do widzenia", "dziękuję za telefon", "miłego dnia", "trzymaj się",
        "dziękuję i do widzenia"
    ]

    bot_lower = bot_response.lower().strip()
    user_lower = user_message.lower().strip()

    # Check for strong goodbye phrases anywhere in bot response
    for phrase in strong_goodbye_phrases:
        if phrase in bot_lower:
            logger.info(f"[EndDetection] Found strong goodbye phrase in bot response: {phrase}")
            return True

    # Check for end phrases only at the END of bot response (last 100 chars)
    bot_end = bot_lower[-100:] if len(bot_lower) > 100 else bot_lower
    for phrase in end_phrases:
        if phrase in bot_end:
            logger.info(f"[EndDetection] Found end phrase in bot response ending: {phrase}")
            return True

    # Check if user is saying goodbye
    if any(phrase in user_lower for phrase in strong_goodbye_phrases + end_phrases):
        logger.info(f"[EndDetection] User said goodbye")
        return True

    return False


async def synthesize_speech(text: str) -> bytes:
    """Convert text to speech using ElevenLabs TTS"""
    try:
        async with aiohttp.ClientSession() as session:
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{os.getenv('ELEVENLABS_VOICE_ID', 'a3t1chm1dQkLxOQK6Jp7')}"

            async with session.post(
                url,
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
                    logger.info(f"[TTS] Generated audio: {len(audio_data)} bytes")
                    return audio_data
                else:
                    logger.error(f"[TTS] Error: {resp.status}")
                    return b""
    except Exception as e:
        logger.error(f"[TTS] Exception: {e}", exc_info=True)
        return b""


@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "active_sessions": len(active_sessions),
        "services": {
            "elevenlabs": bool(os.getenv("ELEVENLABS_API_KEY")),
            "gemini": bool(os.getenv("GEMINI_API_KEY")),
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
    WebSocket endpoint for turn-based voice conversations

    Protocol:
    1. Client sends audio chunks (binary) for ~10 seconds
    2. Client sends {"type": "audio_end"} when done recording
    3. Server transcribes, generates response, synthesizes speech
    4. Server sends {"type": "transcript", "speaker": "user", "text": "..."}
    5. Server sends {"type": "transcript", "speaker": "bot", "text": "..."}
    6. Server sends audio response (binary)
    7. Repeat
    """

    if not flowId:
        await websocket.close(code=1008, reason="flowId query parameter required")
        return

    await websocket.accept()
    logger.info(f"[Session {session_id}] Connected, flowId: {flowId}, language: {language}")

    # Get flow configuration
    flow_config = await get_flow_config(flowId)
    base_system_prompt = flow_config.get("data", {}).get("system_prompt", "You are a helpful AI assistant.")

    # Add language instruction based on language parameter
    language_instruction = ""
    if language == "pl":
        language_instruction = "\n\nIMPORTANT: You MUST speak ONLY in Polish language. Always respond in Polish, never in English."
    elif language == "en":
        language_instruction = "\n\nIMPORTANT: You MUST speak ONLY in English language. Always respond in English."

    system_prompt = base_system_prompt + language_instruction

    # Model name from environment variable
    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    # Store session with conversation history
    conversation_history = []
    active_sessions[session_id] = {
        "history": conversation_history,
        "language": language,
        "model": model_name,
        "system_prompt": system_prompt,
    }

    # Send initial greeting
    try:
        greeting = "Hello! I'm your insurance assistant. How can I help you today?"

        # Send transcript
        await websocket.send_json({
            "type": "transcript",
            "speaker": "bot",
            "text": greeting,
        })

        # Send audio
        audio = await synthesize_speech(greeting)
        if audio:
            await websocket.send_bytes(audio)

        logger.info(f"[Session {session_id}] Sent greeting")
    except Exception as e:
        logger.error(f"[Session {session_id}] Error sending greeting: {e}")

    # Audio buffer for collecting chunks
    audio_buffer = bytearray()

    try:
        while True:
            message = await websocket.receive()

            if "bytes" in message:
                # Accumulate audio data
                audio_buffer.extend(message["bytes"])

            elif "text" in message:
                import json
                data = json.loads(message["text"])

                if data.get("type") == "audio_end":
                    # Process the accumulated audio
                    if len(audio_buffer) > 0:
                        logger.info(f"[Session {session_id}] Processing {len(audio_buffer)} bytes of audio")

                        # 1. Transcribe
                        transcript = await transcribe_audio(bytes(audio_buffer), language)
                        audio_buffer.clear()

                        if transcript:
                            # Send user transcript to frontend
                            await websocket.send_json({
                                "type": "transcript",
                                "speaker": "user",
                                "text": transcript,
                            })

                            # 2. Generate LLM response
                            session_data = active_sessions[session_id]
                            bot_response, should_end_call = await generate_llm_response(
                                gemini_client,
                                session_data["model"],
                                session_data["system_prompt"],
                                session_data["history"],
                                transcript
                            )

                            # Update conversation history
                            session_data["history"].append({"role": "user", "parts": [{"text": transcript}]})
                            session_data["history"].append({"role": "model", "parts": [{"text": bot_response}]})

                            # Send bot transcript to frontend
                            await websocket.send_json({
                                "type": "transcript",
                                "speaker": "bot",
                                "text": bot_response,
                                "shouldEndCall": should_end_call
                            })

                            # 3. Synthesize and send audio
                            audio = await synthesize_speech(bot_response)
                            if audio:
                                await websocket.send_bytes(audio)

                            logger.info(f"[Session {session_id}] Turn completed")
                        else:
                            logger.warning(f"[Session {session_id}] No transcript from STT")
                            await websocket.send_json({
                                "type": "error",
                                "message": "Could not transcribe audio"
                            })
                    else:
                        logger.warning(f"[Session {session_id}] No audio data received")

                elif data.get("type") == "stop":
                    break

    except WebSocketDisconnect:
        logger.info(f"[Session {session_id}] Disconnected")
    except Exception as e:
        logger.error(f"[Session {session_id}] Error: {e}", exc_info=True)
    finally:
        # Cleanup
        if session_id in active_sessions:
            del active_sessions[session_id]
        logger.info(f"[Session {session_id}] Session ended")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info",
    )
