#!/usr/bin/env python3
"""
Voice Recognition Service
Uses Azure Cognitive Services Speaker Recognition for voice biometrics
"""

import os
import io
import asyncio
import logging
from typing import Optional, Dict, List
from dataclasses import dataclass
import httpx
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class VoiceProfile:
    """Voice profile data"""
    profile_id: str
    customer_id: str
    customer_name: str
    enrollment_status: str
    enrolled_at: Optional[datetime] = None


@dataclass
class RecognitionResult:
    """Voice recognition result"""
    recognized: bool
    customer_id: Optional[str] = None
    confidence: float = 0.0
    profile_id: Optional[str] = None
    recognition_time_ms: int = 0
    error: Optional[str] = None


class VoiceRecognitionService:
    """
    Azure Cognitive Services Speaker Recognition
    Handles voice enrollment and identification
    """

    def __init__(
        self,
        subscription_key: Optional[str] = None,
        region: Optional[str] = None,
        confidence_threshold: float = 0.75
    ):
        self.subscription_key = subscription_key or os.getenv("AZURE_SPEAKER_RECOGNITION_KEY")
        self.region = region or os.getenv("AZURE_SPEAKER_RECOGNITION_REGION", "eastus")
        self.confidence_threshold = confidence_threshold

        if not self.subscription_key:
            logger.warning("Azure Speaker Recognition key not configured - voice recognition disabled")
            self.enabled = False
        else:
            self.enabled = True

        self.base_url = f"https://{self.region}.api.cognitive.microsoft.com/speaker"
        self.headers = {
            "Ocp-Apim-Subscription-Key": self.subscription_key,
            "Content-Type": "application/json"
        }

    async def create_profile(self, customer_id: str, customer_name: str) -> Optional[str]:
        """
        Create a new voice profile for a customer
        Returns Azure profile ID
        """
        if not self.enabled:
            logger.info(f"Voice recognition disabled - mock profile for {customer_id}")
            return f"mock-profile-{customer_id}"

        try:
            async with httpx.AsyncClient() as client:
                # Create independent profile (for speaker identification)
                response = await client.post(
                    f"{self.base_url}/identification/v2.0/text-independent/profiles",
                    headers=self.headers,
                    json={"locale": "en-US"}
                )

                if response.status_code == 201:
                    data = response.json()
                    profile_id = data.get("profileId")
                    logger.info(f"Created voice profile {profile_id} for customer {customer_id}")
                    return profile_id
                else:
                    logger.error(f"Failed to create profile: {response.status_code} - {response.text}")
                    return None

        except Exception as e:
            logger.error(f"Error creating voice profile: {e}")
            return None

    async def enroll_profile(
        self,
        profile_id: str,
        audio_data: bytes,
        customer_id: str
    ) -> bool:
        """
        Enroll voice profile with audio sample
        Audio should be: WAV format, 16kHz, mono, 16-bit PCM
        Minimum 4 seconds, recommended 30+ seconds
        """
        if not self.enabled:
            logger.info(f"Voice recognition disabled - mock enrollment for {customer_id}")
            return True

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Azure expects raw audio in request body
                headers = {
                    **self.headers,
                    "Content-Type": "audio/wav"
                }

                response = await client.post(
                    f"{self.base_url}/identification/v2.0/text-independent/profiles/{profile_id}/enrollments",
                    headers=headers,
                    content=audio_data
                )

                if response.status_code == 200:
                    data = response.json()
                    enrollment_status = data.get("enrollmentStatus")
                    logger.info(f"Enrollment for {profile_id}: {enrollment_status}")

                    # enrollmentStatus: "Enrolling" or "Enrolled"
                    return enrollment_status == "Enrolled"
                else:
                    logger.error(f"Enrollment failed: {response.status_code} - {response.text}")
                    return False

        except Exception as e:
            logger.error(f"Error enrolling voice profile: {e}")
            return False

    async def identify_speaker(
        self,
        audio_data: bytes,
        candidate_profile_ids: List[str]
    ) -> RecognitionResult:
        """
        Identify speaker from audio sample
        Returns recognition result with matched profile and confidence
        """
        start_time = datetime.now()

        if not self.enabled:
            logger.info("Voice recognition disabled - returning mock result")
            # For demo purposes, randomly recognize as first candidate
            if candidate_profile_ids:
                return RecognitionResult(
                    recognized=True,
                    profile_id=candidate_profile_ids[0],
                    confidence=0.94,
                    recognition_time_ms=150
                )
            return RecognitionResult(recognized=False)

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Azure expects profile IDs as query params
                profile_ids_param = ",".join(candidate_profile_ids)

                headers = {
                    **self.headers,
                    "Content-Type": "audio/wav"
                }

                response = await client.post(
                    f"{self.base_url}/identification/v2.0/text-independent/profiles/identifySingleSpeaker?"
                    f"profileIds={profile_ids_param}",
                    headers=headers,
                    content=audio_data
                )

                end_time = datetime.now()
                recognition_time_ms = int((end_time - start_time).total_seconds() * 1000)

                if response.status_code == 200:
                    data = response.json()
                    identified_profile_id = data.get("identifiedProfile", {}).get("profileId")
                    confidence = data.get("identifiedProfile", {}).get("score", 0.0)

                    if identified_profile_id and confidence >= self.confidence_threshold:
                        logger.info(f"Speaker identified: {identified_profile_id} (confidence: {confidence})")
                        return RecognitionResult(
                            recognized=True,
                            profile_id=identified_profile_id,
                            confidence=confidence,
                            recognition_time_ms=recognition_time_ms
                        )
                    else:
                        logger.info(f"Speaker not recognized (confidence too low: {confidence})")
                        return RecognitionResult(
                            recognized=False,
                            confidence=confidence,
                            recognition_time_ms=recognition_time_ms
                        )
                else:
                    error_msg = f"Identification failed: {response.status_code}"
                    logger.error(error_msg)
                    return RecognitionResult(
                        recognized=False,
                        error=error_msg,
                        recognition_time_ms=recognition_time_ms
                    )

        except Exception as e:
            error_msg = f"Error identifying speaker: {e}"
            logger.error(error_msg)
            return RecognitionResult(
                recognized=False,
                error=error_msg
            )

    async def delete_profile(self, profile_id: str) -> bool:
        """Delete a voice profile (GDPR compliance)"""
        if not self.enabled:
            return True

        try:
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/identification/v2.0/text-independent/profiles/{profile_id}",
                    headers=self.headers
                )

                if response.status_code == 204:
                    logger.info(f"Deleted voice profile: {profile_id}")
                    return True
                else:
                    logger.error(f"Failed to delete profile: {response.status_code}")
                    return False

        except Exception as e:
            logger.error(f"Error deleting voice profile: {e}")
            return False

    async def get_profile_status(self, profile_id: str) -> Optional[Dict]:
        """Get current status of a voice profile"""
        if not self.enabled:
            return {"enrollmentStatus": "Enrolled"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/identification/v2.0/text-independent/profiles/{profile_id}",
                    headers=self.headers
                )

                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to get profile status: {response.status_code}")
                    return None

        except Exception as e:
            logger.error(f"Error getting profile status: {e}")
            return None


# Global service instance
_voice_recognition_service: Optional[VoiceRecognitionService] = None


def get_voice_recognition_service(
    subscription_key: Optional[str] = None,
    region: Optional[str] = None,
    confidence_threshold: float = 0.75
) -> VoiceRecognitionService:
    """Get or create voice recognition service singleton"""
    global _voice_recognition_service

    if _voice_recognition_service is None:
        _voice_recognition_service = VoiceRecognitionService(
            subscription_key=subscription_key,
            region=region,
            confidence_threshold=confidence_threshold
        )

    return _voice_recognition_service
