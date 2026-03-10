import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react';

interface PipecatVoiceCallProps {
  flowId: string;
  language: string;
  onEnd: () => void;
}

interface Transcript {
  id: string;
  speaker: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface RequiredField {
  name: string;
  type: string;
  label: { pl?: string; en?: string };
  required: boolean;
}

export const PipecatVoiceCall: React.FC<PipecatVoiceCallProps> = ({ flowId, language, onEnd }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Start unmuted - mic active
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [error, setError] = useState('');
  const [callEnded, setCallEnded] = useState(false);
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [collectedData, setCollectedData] = useState<Record<string, string>>({});
  const [requiredFields, setRequiredFields] = useState<RequiredField[]>([]);
  const [extractingData, setExtractingData] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const transcriptsEndRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    fetchFlowConfig();
    startCall();
    return () => {
      cleanup();
    };
  }, []);

  const fetchFlowConfig = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/flows/${flowId}`);
      if (response.ok) {
        const data = await response.json();
        const fields = data.data.required_fields || [];
        setRequiredFields(fields);
        console.log('[Voice] Required fields:', fields);
      }
    } catch (err) {
      console.error('[Voice] Error fetching flow config:', err);
    }
  };

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

      // Connect WebSocket with query parameters
      const wsUrl = `ws://localhost:8080/ws/${sessionId}?flowId=${encodeURIComponent(flowId)}&language=${encodeURIComponent(language)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('[Voice] WebSocket connected');

        // Create audio processor
        try {
          await audioContext.audioWorklet.addModule('/audio-processor.js');

          // AudioWorklet loaded successfully
          const worklet = new AudioWorkletNode(audioContext, 'audio-processor');
          audioWorkletRef.current = worklet;

          let audioChunkCount = 0;
          worklet.port.onmessage = (event) => {
            if (isRecordingRef.current && !isMuted && ws && ws.readyState === WebSocket.OPEN) {
              ws.send(event.data);
              audioChunkCount++;
              if (audioChunkCount % 50 === 0) {
                console.log(`[Voice] Sent ${audioChunkCount} audio chunks`);
              }
            }
          };

          source.connect(worklet);
          worklet.connect(audioContext.destination);
        } catch (error) {
          // Fallback: use ScriptProcessorNode if AudioWorklet not available
          console.log('[Voice] Using ScriptProcessorNode fallback');
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          let audioChunkCount = 0;
          processor.onaudioprocess = (e) => {
            if (isRecordingRef.current && !isMuted && ws && ws.readyState === WebSocket.OPEN) {
              const audioData = e.inputBuffer.getChannelData(0);
              // Convert Float32Array to Int16Array
              const int16Data = new Int16Array(audioData.length);
              for (let i = 0; i < audioData.length; i++) {
                int16Data[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
              }
              ws.send(int16Data.buffer);
              audioChunkCount++;
              if (audioChunkCount % 50 === 0) {
                console.log(`[Voice] Sent ${audioChunkCount} audio chunks (ScriptProcessor)`);
              }
            }
          };
          source.connect(processor);
          processor.connect(audioContext.destination);
        }

        setIsConnected(true);
        setIsConnecting(false);
      };

      ws.onmessage = async (event) => {
        console.log('[Voice] Received message, type:', typeof event.data, 'is Blob:', event.data instanceof Blob);

        if (event.data instanceof Blob) {
          // Audio from bot
          console.log('[Voice] Received audio blob, size:', event.data.size);
          const arrayBuffer = await event.data.arrayBuffer();
          console.log('[Voice] ArrayBuffer size:', arrayBuffer.byteLength);
          playAudio(arrayBuffer);
        } else {
          // Text message (transcript)
          try {
            const data = JSON.parse(event.data);
            console.log('[Voice] Received JSON:', data);
            if (data.type === 'transcript') {
              addTranscript(data.speaker, data.text);

              // Check if bot wants to end the call
              if (data.shouldEndCall) {
                console.log('[Voice] Bot signaled to end call');
                setTimeout(async () => {
                  await extractCollectedData();
                  setCallEnded(true);
                }, 2000);
              }
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
    console.log('[Voice] playAudio called, audioContext exists:', !!audioContextRef.current);

    if (!audioContextRef.current) {
      console.error('[Voice] No audio context!');
      return;
    }

    // Resume audio context if suspended (browser autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      console.log('[Voice] Resuming suspended audio context');
      await audioContextRef.current.resume();
    }

    try {
      console.log('[Voice] Decoding audio data...');
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      console.log('[Voice] Audio decoded, duration:', audioBuffer.duration, 'seconds');

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      console.log('[Voice] Starting audio playback');
      source.start();
      console.log('[Voice] Audio playback started');
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

  const extractCollectedData = async () => {
    console.log('[Voice] Extracting data from conversation...');
    setExtractingData(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/extract-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flowId,
          messages: transcripts.map(t => ({
            role: t.speaker === 'user' ? 'user' : 'assistant',
            content: t.text,
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const extractedData: Record<string, string> = {};

        for (const [key, value] of Object.entries(result.data)) {
          if (value !== null && value !== 'null') {
            extractedData[key] = value as string;
          }
        }

        setCollectedData(extractedData);
        console.log('[Voice] Extracted data:', extractedData);
      } else {
        console.error('[Voice] Failed to extract data');
        setCollectedData({});
      }
    } catch (err) {
      console.error('[Voice] Error extracting data:', err);
      setCollectedData({});
    } finally {
      setExtractingData(false);
    }
  };

  const submitSatisfaction = async () => {
    console.log('[Voice] Satisfaction rating:', satisfaction);

    try {
      const startTime = transcripts[0]?.timestamp?.getTime() || Date.now();
      const endTime = transcripts[transcripts.length - 1]?.timestamp?.getTime() || Date.now();
      const duration = Math.floor((endTime - startTime) / 1000);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sessions/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flowId,
          language,
          messages: transcripts.map(t => ({
            role: t.speaker === 'user' ? 'user' : 'assistant',
            content: t.text,
            timestamp: t.timestamp
          })),
          collectedData,
          satisfactionScore: satisfaction,
          duration
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[Voice] Session saved:', data.sessionId);
      } else {
        console.error('[Voice] Failed to save session');
      }
    } catch (err) {
      console.error('[Voice] Error saving session:', err);
    }

    onEnd();
  };

  const startRecording = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    console.log('[Voice] Starting 10s recording');
    setIsRecording(true);
    isRecordingRef.current = true;
    setRecordingTimer(10);

    // Countdown timer
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTimer(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-stop after 10 seconds
    recordingTimeoutRef.current = setTimeout(() => {
      stopRecording();
    }, 10000);
  };

  const stopRecording = () => {
    console.log('[Voice] Stopping recording');
    setIsRecording(false);
    isRecordingRef.current = false;
    setRecordingTimer(0);

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    // Send audio_end signal
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'audio_end' }));
      console.log('[Voice] Sent audio_end signal');
    }
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
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
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

  // Show summary screen after call ends
  if (callEnded) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-indigo-100 items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Call Summary</h2>

          {/* Collected Data */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Collected Information</h3>

            {extractingData ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                <span className="text-gray-600">Analyzing conversation and extracting data...</span>
              </div>
            ) : requiredFields.length > 0 ? (
              <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
                <tbody>
                  {requiredFields.map((field) => {
                    const value = collectedData[field.name];
                    const label = field.label.en || field.label.pl || field.name;
                    const isRequired = field.required;

                    return (
                      <tr key={field.name} className="border-b border-gray-200">
                        <td className="px-4 py-3 bg-gray-50 font-semibold text-gray-700 w-1/3">
                          {label}
                          {isRequired && <span className="text-red-500 ml-1">*</span>}
                        </td>
                        <td className={`px-4 py-3 ${value ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                          {value || '(None)'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-4">No required fields configured</p>
            )}
          </div>

          {/* Satisfaction Survey */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              How satisfied are you with this call?
            </h3>
            <div className="flex justify-center gap-4 mb-6">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setSatisfaction(rating)}
                  className={`w-16 h-16 rounded-full text-2xl font-bold transition-all ${
                    satisfaction === rating
                      ? 'bg-blue-600 text-white scale-110 shadow-lg'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600 px-8">
              <span>Very Dissatisfied</span>
              <span>Very Satisfied</span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={submitSatisfaction}
            disabled={satisfaction === null}
            className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {satisfaction === null ? 'Please rate your experience' : 'Submit & Close'}
          </button>
        </div>
      </div>
    );
  }

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
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!isConnected || isMuted}
            className={`p-4 rounded-full transition-all font-semibold ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? (
              <div className="flex items-center gap-2">
                <Mic size={24} />
                <span>{recordingTimer}s</span>
              </div>
            ) : (
              <Mic size={24} />
            )}
          </button>

          <button
            onClick={toggleMute}
            disabled={!isConnected}
            className={`p-3 rounded-full transition-all ${
              isMuted
                ? 'bg-gray-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
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
