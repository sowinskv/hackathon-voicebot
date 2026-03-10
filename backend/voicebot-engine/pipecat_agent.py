#!/usr/bin/env python3
"""
Pipecat Voice Agent
Handles: Azure Whisper STT → Gemini AI → ElevenLabs TTS
"""

import os
import asyncio
import logging
from typing import Optional
from dotenv import load_dotenv

from pipecat.frames.frames import (
    Frame,
    EndFrame,
    TextFrame,
    TranscriptionFrame,
    UserStartedSpeakingFrame,
    UserStoppedSpeakingFrame,
)
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_response import (
    LLMAssistantResponseAggregator,
    LLMUserResponseAggregator,
)
from pipecat.services.azure import AzureSTTService, AzureTTSService
from pipecat.services.google import GoogleLLMService
from pipecat.services.elevenlabs import ElevenLabsTTSService
from pipecat.transports.services.daily import DailyTransport, DailyParams

# Use Daily's WebRTC transport (similar to LiveKit but better integrated)
from pipecat.vad.silero import SileroVADAnalyzer

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class VoiceBotAgent:
    """Pipecat-based voice bot agent"""

    def __init__(
        self,
        room_url: str,
        token: str,
        system_prompt: str = None,
        language: str = "en",
    ):
        self.room_url = room_url
        self.token = token
        self.system_prompt = system_prompt or self._get_default_prompt()
        self.language = language
        self.transport = None

    def _get_default_prompt(self) -> str:
        """Default system prompt"""
        return """You are a helpful voice assistant.
Respond briefly and conversationally. Ask one question at a time.
Do not use numbers - spell them out as words."""

    async def run(self):
        """Start the voice bot"""

        logger.info(f"Starting VoiceBot with language: {self.language}")

        # Initialize transport (Daily for WebRTC)
        transport = DailyTransport(
            self.room_url,
            self.token,
            "VoiceBot",
            DailyParams(
                audio_out_enabled=True,
                audio_in_enabled=True,
                vad_enabled=True,
                vad_analyzer=SileroVADAnalyzer(),
                transcription_enabled=False,  # We'll handle it ourselves
            )
        )

        # Initialize services

        # STT: Azure Whisper
        stt = AzureSTTService(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            endpoint=os.getenv("AZURE_OPENAI_API_ENDPOINT"),
            model=os.getenv("AZURE_OPENAI_MODEL", "whisper"),
            language=self.language,
        )

        # LLM: Google Gemini
        llm = GoogleLLMService(
            api_key=os.getenv("GEMINI_API_KEY"),
            model="gemini-2.0-flash-exp",
        )

        # TTS: ElevenLabs
        tts = ElevenLabsTTSService(
            api_key=os.getenv("ELEVENLABS_API_KEY"),
            voice_id=os.getenv("ELEVENLABS_VOICE_ID", "a3t1chm1dQkLxOQK6Jp7"),
            model="eleven_multilingual_v2",
        )

        # Build pipeline
        user_response = LLMUserResponseAggregator()
        assistant_response = LLMAssistantResponseAggregator()

        pipeline = Pipeline([
            transport.input(),           # Audio input from user
            stt,                          # Speech to text
            user_response,                # Aggregate user messages
            llm,                          # Generate response
            tts,                          # Text to speech
            transport.output(),           # Audio output to user
            assistant_response,           # Aggregate bot messages
        ])

        # Set LLM context
        messages = [
            {"role": "system", "content": self.system_prompt},
        ]

        # Create task
        task = PipelineTask(
            pipeline,
            PipelineParams(
                allow_interruptions=True,
                enable_metrics=True,
                enable_usage_metrics=True,
            )
        )

        # Run the pipeline
        async with PipelineRunner() as runner:
            await runner.run(task)

        logger.info("VoiceBot session ended")


async def main():
    """Test runner"""

    # For testing purposes
    room_url = os.getenv("DAILY_ROOM_URL", "https://your-domain.daily.co/test-room")
    token = os.getenv("DAILY_TOKEN", "")

    agent = VoiceBotAgent(
        room_url=room_url,
        token=token,
        system_prompt="You are a friendly AI assistant.",
        language="en",
    )

    await agent.run()


if __name__ == "__main__":
    asyncio.run(main())
