import { Language, SessionState } from '../App'
import AudioVisualizer from './AudioVisualizer'
import SessionTimer from './SessionTimer'
import { useAudioAnalyser } from '../hooks/useAudioAnalyser'

interface VoiceControlsProps {
  sessionState: SessionState
  isConnected: boolean
  audioEnabled: boolean
  audioStream: MediaStream | null
  onStart: () => void
  onStop: () => void
  onEscalate: () => void
  onRetry: () => void
  onToggleAudio: () => void
  onTimeout: () => void
  warningCount: number
  language: Language
}

export default function VoiceControls({
  sessionState,
  isConnected,
  audioEnabled,
  audioStream,
  onStart,
  onStop,
  onEscalate,
  onRetry,
  onToggleAudio,
  onTimeout,
  warningCount,
  language,
}: VoiceControlsProps) {
  const levels = useAudioAnalyser(audioStream)
  const isActive = sessionState === 'active' || sessionState === 'escalated'
  const isEscalated = sessionState === 'escalated'
  const isConnecting = sessionState === 'connecting'
  const isError = sessionState === 'error'

  const statusText: Record<SessionState, string> = {
    idle:      language === 'en' ? 'Ready' : 'Gotowy',
    connecting: language === 'en' ? 'Connecting…' : 'Łączenie…',
    active:    language === 'en' ? 'Active' : 'Aktywna',
    escalated: language === 'en' ? 'Escalated' : 'Eskalowana',
    completed: language === 'en' ? 'Completed' : 'Zakończona',
    error:     language === 'en' ? 'Error' : 'Błąd',
  }

  return (
    <div className="card">
      <h2 className="text-base font-semibold mb-4" style={{ color: '#1a1a1a' }}>Voice Controls</h2>

      {/* Status row */}
      <div className="flex items-center justify-between mb-6">
        <span className="font-mono text-xs text-notion-textLight uppercase tracking-widest">Status</span>
        <span className="font-mono text-xs text-notion-text">{statusText[sessionState]}</span>
      </div>

      {/* Timer */}
      <div className="mb-3">
        <SessionTimer isActive={isActive} onTimeout={onTimeout} />
      </div>

      {/* Visualizer */}
      <div className="mb-5 py-3 flex items-center justify-center border rounded" style={{ borderColor: '#e9e9e7' }}>
        <AudioVisualizer levels={levels} isActive={isActive} audioEnabled={audioEnabled} />
      </div>

      {/* Abuse warning */}
      {isActive && warningCount > 0 && (
        <div className="mb-3 px-3 py-2 rounded border border-amber-300 bg-amber-50 flex items-center justify-between animate-fadeIn">
          <span className="text-xs text-amber-700">
            {language === 'en' ? 'Please stay on topic' : 'Proszę trzymać się tematu'}
          </span>
          <span className="font-mono text-xs font-semibold text-amber-700">
            {warningCount}/3
          </span>
        </div>
      )}

      {/* Controls */}
      <div className="space-y-3">
        {/* Idle / completed / error → Start */}
        {!isActive && !isConnecting && (
          <button
            onClick={isError ? onRetry : onStart}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {isError ? (
              <>
                <span className="font-mono text-xs">↺</span>
                {language === 'en' ? 'Try Again' : 'Spróbuj Ponownie'}
              </>
            ) : (
              <>
                <span className="font-mono text-xs">▶</span>
                {language === 'en' ? 'Start Session' : 'Rozpocznij Sesję'}
              </>
            )}
          </button>
        )}

        {/* Connecting spinner */}
        {isConnecting && (
          <button disabled className="w-full btn-primary flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {language === 'en' ? 'Connecting…' : 'Łączenie…'}
          </button>
        )}

        {/* Active controls */}
        {isActive && (
          <>
            {/* Mic toggle */}
            <button
              onClick={onToggleAudio}
              className={`w-full flex items-center justify-center gap-2 ${audioEnabled ? 'btn-secondary' : 'btn-warning'}`}
            >
              <span className="font-mono text-xs">{audioEnabled ? '◉' : '○'}</span>
              {audioEnabled
                ? (language === 'en' ? 'Mic On' : 'Mikrofon Włączony')
                : (language === 'en' ? 'Mic Off' : 'Mikrofon Wyłączony')}
            </button>

            {/* Escalate */}
            {!isEscalated && (
              <button
                onClick={onEscalate}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <span className="font-mono text-xs">→</span>
                {language === 'en' ? 'Connect to Consultant' : 'Połącz z Konsultantem'}
              </button>
            )}

            {isEscalated && (
              <div className="w-full text-center py-2 font-mono text-xs text-amber-600 border border-amber-300 rounded bg-amber-50">
                {language === 'en' ? '✓ Consultant connected' : '✓ Konsultant połączony'}
              </div>
            )}

            {/* End session */}
            <button
              onClick={onStop}
              className="w-full btn-danger flex items-center justify-center gap-2"
            >
              <span className="font-mono text-xs">■</span>
              {language === 'en' ? 'End Session' : 'Zakończ Sesję'}
            </button>
          </>
        )}
      </div>

      {/* Connection dot */}
      {isActive && (
        <div className="mt-6 pt-4 border-t border-notion-border">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="font-mono text-xs text-notion-textLight">
              {isConnected
                ? (language === 'en' ? 'connected' : 'połączono')
                : (language === 'en' ? 'disconnected' : 'rozłączono')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
