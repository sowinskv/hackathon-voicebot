#!/usr/bin/env python3
"""
Complete VoiceBot Agent Implementation
Handles: Azure Whisper STT → Gemini AI → ElevenLabs TTS
"""

import asyncio
import os
import logging
import io
import wave
from typing import Optional
from collections import deque

from livekit import rtc
from livekit.agents import JobContext, WorkerOptions, cli, tokenize, tts
from openai import AsyncAzureOpenAI
from elevenlabs.client import AsyncElevenLabs
import httpx

logger = logging.getLogger(__name__)

# Initialize API clients
azure_client = AsyncAzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2025-03-01-preview"),
    azure_endpoint=os.getenv("AZURE_OPENAI_API_ENDPOINT"),
    http_client=httpx.AsyncClient(timeout=30.0)
)

elevenlabs_client = AsyncElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY")
)


class VoiceBotAgent:
    """Handles voice conversation in a LiveKit room"""

    def __init__(self, ctx: JobContext):
        self.ctx = ctx
        self.room = ctx.room

        # Get config from room metadata
        metadata = {}
        if hasattr(ctx.room, 'metadata') and ctx.room.metadata:
            import json
            try:
                metadata = json.loads(ctx.room.metadata)
            except:
                pass

        self.system_prompt = metadata.get('systemPrompt', self._get_default_prompt())
        self.language = metadata.get('language', 'pl')
        self.conversation_history = []

        # Audio buffering
        self.audio_buffer = deque(maxlen=100)  # Keep last 100 frames
        self.is_processing = False
        self.is_speaking = False

        logger.info(f"VoiceBot initialized - Language: {self.language}")

    def _get_default_prompt(self) -> str:
        """Default system prompt"""
        return """Jesteś pomocnym asystentem głosowym.
Odpowiadaj krótko i rzeczowo. Zadawaj jedno pytanie na raz.
Nie używaj cyfr - zapisuj je słownie."""

    async def start(self):
        """Start the agent"""
        logger.info(f"Starting VoiceBot in room: {self.room.name}")

        # Welcome message
        await self._speak("Dzień dobry! Słucham Cię. Jak mogę pomóc?")

        # Subscribe to participant audio
        @self.room.on("track_subscribed")
        def on_track_subscribed(
            track: rtc.Track,
            publication: rtc.RemoteTrackPublication,
            participant: rtc.RemoteParticipant
        ):
            if track.kind == rtc.TrackKind.KIND_AUDIO:
                logger.info(f"Subscribed to audio from: {participant.identity}")
                asyncio.create_task(self._process_audio_track(track))

        # Handle existing tracks
        for participant in self.room.remote_participants.values():
            for publication in participant.track_publications.values():
                if publication.track and publication.track.kind == rtc.TrackKind.KIND_AUDIO:
                    asyncio.create_task(self._process_audio_track(publication.track))

    async def _process_audio_track(self, track: rtc.RemoteAudioTrack):
        """Process incoming audio from user"""
        logger.info("Processing audio track...")

        audio_stream = rtc.AudioStream(track)
        frames_buffer = []
        silence_count = 0
        SILENCE_THRESHOLD = 50  # Frames of silence before processing

        async for frame in audio_stream:
            if self.is_speaking:
                # Don't process user audio while bot is speaking
                continue

            frames_buffer.append(frame)

            # Check for silence (simple heuristic based on frame data)
            is_silent = self._is_silent_frame(frame)

            if is_silent:
                silence_count += 1
            else:
                silence_count = 0

            # Process after significant silence (user finished speaking)
            if silence_count >= SILENCE_THRESHOLD and len(frames_buffer) > 100:
                if not self.is_processing:
                    self.is_processing = True
                    asyncio.create_task(self._process_user_speech(frames_buffer.copy()))
                    frames_buffer = []
                    silence_count = 0

    def _is_silent_frame(self, frame: rtc.AudioFrame) -> bool:
        """Simple silence detection"""
        try:
            data = frame.data
            if not data or len(data) == 0:
                return True
            # Check if audio amplitude is low
            avg = sum(abs(b) for b in data[:min(100, len(data))]) / min(100, len(data))
            return avg < 10  # Threshold for silence
        except:
            return True

    async def _process_user_speech(self, frames: list):
        """Transcribe and respond to user speech"""
        try:
            logger.info(f"Processing {len(frames)} audio frames...")

            # Convert frames to WAV audio
            audio_data = await self._frames_to_wav(frames)

            if not audio_data or len(audio_data) < 1000:
                logger.warning("Audio data too short, skipping")
                self.is_processing = False
                return

            # Transcribe with Azure Whisper
            transcription = await self._transcribe(audio_data)

            if not transcription or len(transcription.strip()) < 2:
                logger.info("No speech detected")
                self.is_processing = False
                return

            logger.info(f"User said: {transcription}")

            # Send transcript to room
            await self._send_data({
                'type': 'transcript',
                'speaker': 'user',
                'text': transcription
            })

            # Generate response
            response = await self._generate_response(transcription)
            logger.info(f"Bot response: {response}")

            # Speak response
            await self._speak(response)

        except Exception as e:
            logger.error(f"Error processing speech: {e}", exc_info=True)
        finally:
            self.is_processing = False

    async def _frames_to_wav(self, frames: list) -> bytes:
        """Convert audio frames to WAV format"""
        try:
            if not frames:
                return b''

            # Get audio format from first frame
            first_frame = frames[0]
            sample_rate = first_frame.sample_rate
            num_channels = first_frame.num_channels

            # Collect all audio data
            audio_data = b''
            for frame in frames:
                audio_data += bytes(frame.data)

            # Create WAV file in memory
            wav_buffer = io.BytesIO()
            with wave.open(wav_buffer, 'wb') as wav_file:
                wav_file.setnchannels(num_channels)
                wav_file.setsampwidth(2)  # 16-bit audio
                wav_file.setframerate(sample_rate)
                wav_file.writeframes(audio_data)

            wav_buffer.seek(0)
            return wav_buffer.read()

        except Exception as e:
            logger.error(f"Error converting frames to WAV: {e}")
            return b''

    async def _transcribe(self, audio_data: bytes) -> str:
        """Transcribe audio using Azure Whisper"""
        try:
            logger.info(f"Transcribing {len(audio_data)} bytes...")

            # Create file-like object
            audio_file = io.BytesIO(audio_data)
            audio_file.name = "audio.wav"

            response = await azure_client.audio.transcriptions.create(
                model=os.getenv("AZURE_OPENAI_MODEL", "gpt-4o-transcribe-diarize"),
                file=audio_file,
                language=self.language
            )

            return response.text.strip()

        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return ""

    async def _generate_response(self, user_text: str) -> str:
        """Generate response using Gemini"""
        try:
            # Add to conversation history
            self.conversation_history.append({
                "role": "user",
                "content": user_text
            })

            # Build prompt
            prompt = f"{self.system_prompt}\n\nRozmowa:\n"
            for msg in self.conversation_history[-10:]:
                prompt += f"{msg['role']}: {msg['content']}\n"
            prompt += "assistant: "

            # Call Gemini API directly
            import httpx
            gemini_api_key = os.getenv("GEMINI_API_KEY")

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={gemini_api_key}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.7,
                            "maxOutputTokens": 200
                        }
                    }
                )

                data = response.json()
                bot_response = data['candidates'][0]['content']['parts'][0]['text'].strip()

            # Add to history
            self.conversation_history.append({
                "role": "assistant",
                "content": bot_response
            })

            return bot_response

        except Exception as e:
            logger.error(f"Response generation error: {e}")
            return "Przepraszam, miałem problem z wygenerowaniem odpowiedzi."

    async def _speak(self, text: str):
        """Convert text to speech and play in room"""
        try:
            self.is_speaking = True
            logger.info(f"Speaking: {text[:50]}...")

            # Send transcript
            await self._send_data({
                'type': 'transcript',
                'speaker': 'bot',
                'text': text
            })

            # Generate audio with ElevenLabs
            voice_id = os.getenv("ELEVENLABS_VOICE_ID", "a3t1chm1dQkLxOQK6Jp7")

            audio_generator = elevenlabs_client.text_to_speech.convert(
                voice_id=voice_id,
                text=text,
                model_id="eleven_multilingual_v2",
                output_format="pcm_24000"
            )

            # Publish audio track
            audio_source = rtc.AudioSource(24000, 1)
            track = rtc.LocalAudioTrack.create_audio_track("bot-voice", audio_source)
            options = rtc.TrackPublishOptions(source=rtc.TrackSource.SOURCE_MICROPHONE)

            publication = await self.room.local_participant.publish_track(track, options)
            logger.info("Audio track published")

            # Stream audio chunks
            async for chunk in audio_generator:
                if chunk:
                    # Convert bytes to audio frame
                    frame = rtc.AudioFrame(
                        data=chunk,
                        sample_rate=24000,
                        num_channels=1,
                        samples_per_channel=len(chunk) // 2
                    )
                    await audio_source.capture_frame(frame)

            # Small delay before unpublishing
            await asyncio.sleep(0.5)

            # Unpublish track
            await self.room.local_participant.unpublish_track(track.sid)
            logger.info("Audio playback complete")

        except Exception as e:
            logger.error(f"Speaking error: {e}", exc_info=True)
        finally:
            self.is_speaking = False

    async def _send_data(self, data: dict):
        """Send data message to room participants"""
        try:
            import json
            message = json.dumps(data).encode('utf-8')
            await self.room.local_participant.publish_data(message)
        except Exception as e:
            logger.error(f"Error sending data: {e}")


async def entrypoint(ctx: JobContext):
    """Agent entrypoint - called for each room"""
    logger.info(f"=" * 70)
    logger.info(f"VoiceBot Agent connecting to room: {ctx.room.name}")
    logger.info(f"=" * 70)

    # Connect to room
    await ctx.connect()
    logger.info("Connected to LiveKit room")

    # Initialize and start bot
    bot = VoiceBotAgent(ctx)
    await bot.start()

    logger.info("VoiceBot agent is now active and listening...")


if __name__ == "__main__":
    import sys
    from dotenv import load_dotenv
    load_dotenv()

    logging.basicConfig(
        level=logging.INFO,
        format='[%(asctime)s] [%(levelname)s] %(name)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    logger.info("=" * 70)
    logger.info("Starting VoiceBot Agent Worker...")
    logger.info(f"LiveKit URL: {os.getenv('LIVEKIT_URL')}")
    logger.info("=" * 70)

    # Add 'start' command for CLI
    if 'start' not in sys.argv:
        sys.argv.append('start')

    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            api_key=os.getenv("LIVEKIT_API_KEY"),
            api_secret=os.getenv("LIVEKIT_API_SECRET"),
            ws_url=os.getenv("LIVEKIT_URL"),
        )
    )
