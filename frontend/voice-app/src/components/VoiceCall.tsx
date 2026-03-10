import React, { useState, useEffect, useRef } from 'react';
import { Room, Track, RoomEvent, RemoteTrack, RemoteParticipant } from 'livekit-client';
import { Mic, MicOff, Phone, PhoneOff, Volume2, Loader2 } from 'lucide-react';

interface VoiceCallProps {
  flowId: string;
  onEnd: () => void;
}

interface Transcript {
  id: string;
  speaker: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export const VoiceCall: React.FC<VoiceCallProps> = ({ flowId, onEnd }) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [error, setError] = useState('');

  const audioElementRef = useRef<HTMLAudioElement>(null);
  const transcriptsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startCall();
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new transcripts arrive
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  const startCall = async () => {
    try {
      console.log('[VOICE] Starting call with flow:', flowId);
      setIsConnecting(true);
      setError('');

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Just checking permission

      // Start session via API
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/voice/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowId,
          participantName: 'User',
          language: 'pl',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.status}`);
      }

      const data = await response.json();
      console.log('[VOICE] Session started:', data.data);

      // Connect to LiveKit room
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Set up event listeners
      newRoom.on(RoomEvent.Connected, () => {
        console.log('[VOICE] Connected to room');
        setIsConnected(true);
        setIsConnecting(false);
        addTranscript('bot', 'Połączono! Słucham Cię.');
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        console.log('[VOICE] Disconnected from room');
        setIsConnected(false);
      });

      newRoom.on(RoomEvent.TrackSubscribed, (
        track: RemoteTrack,
        publication: any,
        participant: RemoteParticipant
      ) => {
        console.log('[VOICE] Track subscribed:', track.kind);
        if (track.kind === Track.Kind.Audio && audioElementRef.current) {
          track.attach(audioElementRef.current);
        }
      });

      newRoom.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
        const decoder = new TextDecoder();
        const data = JSON.parse(decoder.decode(payload));
        console.log('[VOICE] Data received:', data);

        if (data.type === 'transcript') {
          addTranscript(data.speaker, data.text);
        }
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        console.log('[VOICE] Participant connected:', participant.identity);
        if (participant.identity.includes('bot')) {
          addTranscript('bot', 'Asystent dołączył do rozmowy.');
        }
      });

      // Connect to room
      const livekitUrl = data.data.url.replace('ws://', 'ws://');
      await newRoom.connect(livekitUrl, data.data.token);

      // Publish microphone
      await newRoom.localParticipant.enableMicrophone();

      setRoom(newRoom);

    } catch (err: any) {
      console.error('[VOICE] Error starting call:', err);
      setError(err.message || 'Nie udało się rozpocząć rozmowy');
      setIsConnecting(false);
    }
  };

  const addTranscript = (speaker: 'user' | 'bot', text: string) => {
    const newTranscript: Transcript = {
      id: `${Date.now()}-${Math.random()}`,
      speaker,
      text,
      timestamp: new Date(),
    };
    setTranscripts(prev => [...prev, newTranscript]);
  };

  const toggleMute = async () => {
    if (!room) return;

    try {
      if (isMuted) {
        await room.localParticipant.setMicrophoneEnabled(true);
      } else {
        await room.localParticipant.setMicrophoneEnabled(false);
      }
      setIsMuted(!isMuted);
    } catch (err) {
      console.error('[VOICE] Error toggling mute:', err);
    }
  };

  const endCall = () => {
    if (room) {
      room.disconnect();
    }
    onEnd();
  };

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Błąd połączenia</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={onEnd}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Wróć
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Hidden audio element for bot voice */}
      <audio ref={audioElementRef} autoPlay />

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              isConnecting ? 'bg-yellow-100' : isConnected ? 'bg-green-100 animate-pulse' : 'bg-gray-100'
            }`}>
              {isConnecting ? (
                <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
              ) : isConnected ? (
                <Volume2 className="w-8 h-8 text-green-600" />
              ) : (
                <PhoneOff className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isConnecting ? 'Łączenie...' : isConnected ? 'Połączono' : 'Rozłączono'}
              </h2>
              <p className="text-gray-600">
                {isConnecting ? 'Proszę czekać' : isConnected ? 'Rozmowa w toku' : 'Połączenie zakończone'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={toggleMute}
              disabled={!isConnected}
              className={`p-4 rounded-full transition ${
                isMuted
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button
              onClick={endCall}
              className="p-4 rounded-full bg-red-500 text-white hover:bg-red-600 transition"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transkrypcja rozmowy</h3>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {transcripts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {isConnecting ? 'Łączenie z botem...' : 'Zacznij mówić aby zobaczyć transkrypcję'}
            </p>
          ) : (
            transcripts.map((transcript) => (
              <div
                key={transcript.id}
                className={`flex ${transcript.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-4 ${
                    transcript.speaker === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {transcript.speaker === 'user' ? 'Ty' : 'Bot'}
                    </span>
                    <span className="text-xs opacity-70">
                      {transcript.timestamp.toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{transcript.text}</p>
                </div>
              </div>
            ))
          )}
          <div ref={transcriptsEndRef} />
        </div>
      </div>

      {/* Instructions */}
      {isConnected && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            💡 <strong>Wskazówka:</strong> Mów naturalnie, bot Cię słucha.
            Odpowiedzi pojawią się automatycznie.
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceCall;
