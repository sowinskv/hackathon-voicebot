import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react';

interface PipecatVoiceCallProps {
  flowId: string;
  onEnd: () => void;
}

interface Transcript {
  id: string;
  speaker: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export const PipecatVoiceCall: React.FC<PipecatVoiceCallProps> = ({ flowId, onEnd }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [error, setError] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const transcriptsEndRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    startCall();
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const startCall = async () => {
    try {
      setIsConnecting(true);
      setError('');

      // Get microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      mediaStreamRef.current = stream;

      // Close old audio context if exists and still open
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }

      // Setup audio context BEFORE WebSocket
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaStreamSource(stream);

      // Create session ID
      const sessionId = `session-${Date.now()}`;

      // Connect WebSocket
      const wsUrl = `ws://localhost:8080/ws/${sessionId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('[Voice] WebSocket connected');

        // Send config
        ws.send(JSON.stringify({
          flowId: flowId,
          language: 'en',
        }));

        // Create audio processor
        try {
          await audioContext.audioWorklet.addModule('/audio-processor.js');

          // AudioWorklet loaded successfully
          const worklet = new AudioWorkletNode(audioContext, 'audio-processor');
          audioWorkletRef.current = worklet;

          worklet.port.onmessage = (event) => {
            if (!isMuted && ws && ws.readyState === WebSocket.OPEN) {
              ws.send(event.data);
            }
          };

          source.connect(worklet);
          worklet.connect(audioContext.destination);
        } catch (error) {
          // Fallback: use ScriptProcessorNode if AudioWorklet not available
          console.log('[Voice] Using ScriptProcessorNode fallback');
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (!isMuted && ws && ws.readyState === WebSocket.OPEN) {
              const audioData = e.inputBuffer.getChannelData(0);
              // Convert Float32Array to Int16Array
              const int16Data = new Int16Array(audioData.length);
              for (let i = 0; i < audioData.length; i++) {
                int16Data[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
              }
              ws.send(int16Data.buffer);
            }
          };
          source.connect(processor);
          processor.connect(audioContext.destination);
        }

        setIsConnected(true);
        setIsConnecting(false);
      };

      ws.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          // Audio from bot
          const arrayBuffer = await event.data.arrayBuffer();
          playAudio(arrayBuffer);
        } else {
          // Text message (transcript)
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'transcript') {
              addTranscript(data.speaker, data.text);
            }
          } catch (e) {
            console.error('[Voice] Failed to parse message:', e);
          }
        }
      };

      ws.onerror = (err) => {
        console.error('[Voice] WebSocket error:', err);
        setError('Connection error');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        console.log('[Voice] WebSocket closed');
        setIsConnected(false);
      };

    } catch (err: any) {
      console.error('[Voice] Error starting call:', err);
      setError(err.message || 'Failed to start call');
      setIsConnecting(false);
    }
  };

  const playAudio = async (arrayBuffer: ArrayBuffer) => {
    if (!audioContextRef.current) return;

    try {
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (err) {
      console.error('[Voice] Error playing audio:', err);
    }
  };

  const addTranscript = (speaker: 'user' | 'bot', text: string) => {
    setTranscripts(prev => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        speaker,
        text,
        timestamp: new Date(),
      }
    ]);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Will be !isMuted after state update
      });
    }
  };

  const endCall = () => {
    cleanup();
    onEnd();
  };

  const cleanup = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioWorkletRef.current) {
      try {
        audioWorkletRef.current.disconnect();
      } catch (e) {
        // Already disconnected
      }
      audioWorkletRef.current = null;
    }
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
      } catch (e) {
        // Already disconnected
      }
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <h2 className="text-xl font-semibold text-gray-800">
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
          </h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleMute}
            disabled={!isConnected}
            className={`p-3 rounded-full transition-all ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>

      {/* Transcripts */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {isConnecting && (
          <div className="flex items-center justify-center gap-3 text-gray-600">
            <Loader2 className="animate-spin" size={24} />
            <p>Connecting to voice bot...</p>
          </div>
        )}

        {transcripts.map(transcript => (
          <div
            key={transcript.id}
            className={`flex ${transcript.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-3 ${
                transcript.speaker === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-800 shadow-md'
              }`}
            >
              <p className="text-sm font-semibold mb-1">
                {transcript.speaker === 'user' ? 'You' : 'Bot'}
              </p>
              <p className="text-base">{transcript.text}</p>
              <p className="text-xs mt-1 opacity-70">
                {transcript.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={transcriptsEndRef} />
      </div>
    </div>
  );
};

export default PipecatVoiceCall;
