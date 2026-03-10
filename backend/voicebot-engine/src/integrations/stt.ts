import axios from 'axios';
import FormData from 'form-data';

/**
 * Transcribe audio using Azure Whisper STT
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const endpoint = process.env.AZURE_WHISPER_ENDPOINT!;
    const apiKey = process.env.AZURE_WHISPER_KEY!;

    // Convert audio buffer to WAV format if needed
    // For now, assuming audio is already in compatible format
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.wav',
      contentType: 'audio/wav',
    });
    formData.append('model', 'whisper-1');
    formData.append('language', 'en'); // Can be made configurable

    const response = await axios.post(
      `${endpoint}/openai/deployments/whisper/audio/transcriptions?api-version=2024-02-01`,
      formData,
      {
        headers: {
          'api-key': apiKey,
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 second timeout
      }
    );

    if (response.data && response.data.text) {
      return response.data.text.trim();
    }

    throw new Error('No transcription returned from Azure Whisper');
  } catch (error) {
    console.error('Azure Whisper transcription error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Check if audio buffer contains speech (VAD - Voice Activity Detection)
 * Simplified implementation - in production use proper VAD library
 */
export function detectSpeech(audioBuffer: Buffer): boolean {
  // Simple energy-based detection
  // In production, use a proper VAD library like webrtcvad or silero-vad

  const samples = new Int16Array(
    audioBuffer.buffer,
    audioBuffer.byteOffset,
    audioBuffer.length / 2
  );

  let energy = 0;
  for (let i = 0; i < samples.length; i++) {
    energy += Math.abs(samples[i]);
  }

  const avgEnergy = energy / samples.length;
  const threshold = 500; // Adjust based on testing

  return avgEnergy > threshold;
}

/**
 * Convert audio buffer to specific format if needed
 */
export function convertAudioFormat(
  audioBuffer: Buffer,
  targetFormat: 'wav' | 'mp3' | 'opus'
): Buffer {
  // Placeholder - in production use ffmpeg or similar
  // For now, return as-is assuming correct format
  return audioBuffer;
}

/**
 * Split audio buffer into chunks for streaming
 */
export function* chunkAudioBuffer(
  audioBuffer: Buffer,
  chunkSize: number = 1024 * 64 // 64KB chunks
): Generator<Buffer> {
  for (let i = 0; i < audioBuffer.length; i += chunkSize) {
    yield audioBuffer.subarray(i, Math.min(i + chunkSize, audioBuffer.length));
  }
}
