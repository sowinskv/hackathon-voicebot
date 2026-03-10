import axios from 'axios';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const DEFAULT_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah voice - can be configured

/**
 * Synthesize speech using ElevenLabs TTS
 */
export async function synthesizeSpeech(
  text: string,
  voiceId?: string
): Promise<Buffer> {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY!;
    const voice = voiceId || DEFAULT_VOICE_ID;

    const response = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voice}`,
      {
        text,
        model_id: 'eleven_turbo_v2', // Fast, low-latency model
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
    }
    throw new Error('Failed to synthesize speech');
  }
}

/**
 * Synthesize speech with streaming (for lower latency)
 */
export async function* synthesizeSpeechStream(
  text: string,
  voiceId?: string
): AsyncGenerator<Buffer> {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY!;
    const voice = voiceId || DEFAULT_VOICE_ID;

    const response = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voice}/stream`,
      {
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
        timeout: 30000,
      }
    );

    for await (const chunk of response.data) {
      yield Buffer.from(chunk);
    }
  } catch (error) {
    console.error('ElevenLabs TTS streaming error:', error);
    throw new Error('Failed to stream synthesized speech');
  }
}

/**
 * Get available voices from ElevenLabs
 */
export async function getAvailableVoices(): Promise<
  Array<{ voice_id: string; name: string; labels: Record<string, string> }>
> {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY!;

    const response = await axios.get(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': apiKey,
      },
    });

    return response.data.voices || [];
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    return [];
  }
}

/**
 * Estimate audio duration in milliseconds based on text length
 * Useful for timing and synchronization
 */
export function estimateAudioDuration(text: string): number {
  // Average speaking rate: ~150 words per minute
  // Average word length: ~5 characters
  const words = text.split(/\s+/).length;
  const minutes = words / 150;
  const milliseconds = minutes * 60 * 1000;

  return Math.round(milliseconds);
}

/**
 * Split long text into chunks for better TTS processing
 */
export function splitTextForTTS(
  text: string,
  maxChunkLength: number = 500
): string[] {
  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxChunkLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
