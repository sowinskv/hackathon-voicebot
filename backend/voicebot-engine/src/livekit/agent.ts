import { EventEmitter } from 'events';
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteTrack,
  Track,
  LocalAudioTrack,
  createLocalAudioTrack,
  AudioFrame,
} from 'livekit-client';
import { AccessToken } from 'livekit-server-sdk';
import { ConversationEngine } from '../conversation/engine';
import { loadFlow } from '../db';

export class LiveKitAgent extends EventEmitter {
  private room: Room;
  private roomName: string;
  private sessionId: string;
  private flowId: string;
  private conversationEngine: ConversationEngine | null = null;
  private audioTrack: LocalAudioTrack | null = null;
  private isProcessing: boolean = false;

  constructor(roomName: string, sessionId: string, flowId: string) {
    super();
    this.roomName = roomName;
    this.sessionId = sessionId;
    this.flowId = flowId;
    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
  }

  async start(): Promise<void> {
    try {
      // Load flow definition
      const flow = await loadFlow(this.flowId);
      if (!flow) {
        throw new Error(`Flow not found: ${this.flowId}`);
      }

      console.log(`Loaded flow: ${flow.name}`);

      // Initialize conversation engine
      this.conversationEngine = new ConversationEngine(
        this.sessionId,
        flow,
        this.handleBotResponse.bind(this)
      );

      // Generate access token for bot
      const token = this.generateBotToken();

      // Connect to room
      await this.room.connect(process.env.LIVEKIT_URL!, token);
      console.log(`Bot connected to room: ${this.roomName}`);

      // Set up event handlers
      this.setupEventHandlers();

      // Create local audio track for bot speech
      this.audioTrack = await createLocalAudioTrack({
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      });

      await this.room.localParticipant.publishTrack(this.audioTrack);
      console.log('Bot audio track published');

      this.emit('ready');

      // Start conversation with greeting
      await this.conversationEngine.start();
    } catch (error) {
      console.error('Failed to start agent:', error);
      this.emit('error', error);
      throw error;
    }
  }

  private generateBotToken(): string {
    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: `bot-${this.sessionId}`,
        name: 'AI Assistant',
      }
    );

    at.addGrant({
      roomJoin: true,
      room: this.roomName,
      canPublish: true,
      canSubscribe: true,
    });

    return at.toJwt();
  }

  private setupEventHandlers(): void {
    // Handle participant connections
    this.room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log(`Participant connected: ${participant.identity}`);
    });

    this.room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
      console.log(`Participant disconnected: ${participant.identity}`);
    });

    // Handle incoming audio tracks
    this.room.on(RoomEvent.TrackSubscribed, (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      if (track.kind === Track.Kind.Audio) {
        console.log(`Subscribed to audio track from ${participant.identity}`);
        this.handleIncomingAudio(track);
      }
    });

    // Handle disconnection
    this.room.on(RoomEvent.Disconnected, () => {
      console.log('Bot disconnected from room');
      this.emit('disconnected');
    });

    // Handle errors
    this.room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      console.log(`Connection quality changed: ${quality} for ${participant?.identity}`);
    });
  }

  private async handleIncomingAudio(track: RemoteTrack): Promise<void> {
    // Process audio stream through STT and conversation engine
    if (!this.conversationEngine) return;

    try {
      // Collect audio chunks
      const audioChunks: Buffer[] = [];
      let silenceTimeout: NodeJS.Timeout | null = null;
      const SILENCE_DURATION = 1500; // 1.5 seconds of silence to trigger processing

      const mediaStream = new MediaStream([track.mediaStreamTrack]);
      const audioContext = new (global as any).AudioContext || (global as any).webkitAudioContext;
      const source = audioContext.createMediaStreamSource(mediaStream);

      // Create audio processor (simplified - in production use proper VAD)
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = async (e: any) => {
        if (this.isProcessing) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const buffer = Buffer.from(inputData.buffer);
        audioChunks.push(buffer);

        // Detect silence (simplified)
        const rms = Math.sqrt(inputData.reduce((sum: number, val: number) => sum + val * val, 0) / inputData.length);

        if (rms < 0.01) { // Silence threshold
          if (!silenceTimeout) {
            silenceTimeout = setTimeout(async () => {
              if (audioChunks.length > 0) {
                this.isProcessing = true;
                await this.processAudioChunks([...audioChunks]);
                audioChunks.length = 0;
                this.isProcessing = false;
              }
              silenceTimeout = null;
            }, SILENCE_DURATION);
          }
        } else {
          if (silenceTimeout) {
            clearTimeout(silenceTimeout);
            silenceTimeout = null;
          }
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (error) {
      console.error('Error handling incoming audio:', error);
    }
  }

  private async processAudioChunks(chunks: Buffer[]): Promise<void> {
    if (!this.conversationEngine) return;

    try {
      // Combine chunks into single audio buffer
      const audioBuffer = Buffer.concat(chunks);

      // Process through conversation engine (which will handle STT internally)
      await this.conversationEngine.processUserAudio(audioBuffer);
    } catch (error) {
      console.error('Error processing audio chunks:', error);
    }
  }

  private async handleBotResponse(audioData: Buffer): Promise<void> {
    try {
      if (!this.audioTrack) {
        console.error('Audio track not available');
        return;
      }

      // Publish audio data to LiveKit
      // Note: This is simplified - in production, you'd need proper audio frame handling
      console.log(`Publishing bot audio response (${audioData.length} bytes)`);

      // The actual implementation would require converting the audio buffer
      // into audio frames and publishing them through the LocalAudioTrack
      // This is a placeholder for the concept
    } catch (error) {
      console.error('Error handling bot response:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.conversationEngine) {
      await this.conversationEngine.end();
    }
    await this.room.disconnect();
    console.log('Agent disconnected');
  }
}
