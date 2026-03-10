import { Language, SessionState } from '../App'

interface VoiceControlsProps {
  sessionState: SessionState
  isConnected: boolean
  audioEnabled: boolean
  onStart: () => void
  onStop: () => void
  onEscalate: () => void
  onToggleAudio: () => void
  language: Language
}

export default function VoiceControls({
  sessionState,
  isConnected,
  audioEnabled,
  onStart,
  onStop,
  onEscalate,
  onToggleAudio,
  language,
}: VoiceControlsProps) {
  const isActive = sessionState === 'active' || sessionState === 'escalated'
  const isEscalated = sessionState === 'escalated'
  const isConnecting = sessionState === 'connecting'

  const getStatusText = () => {
    switch (sessionState) {
      case 'idle':
        return language === 'en' ? 'Ready to start' : 'Gotowy do rozpoczęcia'
      case 'connecting':
        return language === 'en' ? 'Connecting...' : 'Łączenie...'
      case 'active':
        return language === 'en' ? 'Session active' : 'Sesja aktywna'
      case 'escalated':
        return language === 'en' ? 'Connected to consultant' : 'Połączono z konsultantem'
      case 'completed':
        return language === 'en' ? 'Session completed' : 'Sesja zakończona'
      case 'error':
        return language === 'en' ? 'Connection error' : 'Błąd połączenia'
      default:
        return ''
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {language === 'en' ? 'Voice Controls' : 'Sterowanie Głosem'}
      </h2>

      {/* Status Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">
            {language === 'en' ? 'Status' : 'Status'}
          </span>
          <span className="text-sm font-semibold text-gray-900">{getStatusText()}</span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="space-y-3">
        {!isActive && sessionState !== 'connecting' && (
          <button
            onClick={onStart}
            disabled={isConnecting}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {language === 'en' ? 'Start Session' : 'Rozpocznij Sesję'}
          </button>
        )}

        {isConnecting && (
          <button disabled className="w-full btn-primary flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {language === 'en' ? 'Connecting...' : 'Łączenie...'}
          </button>
        )}

        {isActive && (
          <>
            {/* Microphone Toggle */}
            <button
              onClick={onToggleAudio}
              className={`w-full flex items-center justify-center gap-2 ${
                audioEnabled ? 'btn-secondary' : 'btn-warning'
              }`}
            >
              {audioEnabled ? (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  {language === 'en' ? 'Microphone On' : 'Mikrofon Włączony'}
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                  </svg>
                  {language === 'en' ? 'Microphone Off' : 'Mikrofon Wyłączony'}
                </>
              )}
            </button>

            {/* Escalate Button */}
            {!isEscalated && (
              <button
                onClick={onEscalate}
                className="w-full btn-warning flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {language === 'en' ? 'Connect to Consultant' : 'Połącz z Konsultantem'}
              </button>
            )}

            {/* Stop Button */}
            <button
              onClick={onStop}
              className="w-full btn-danger flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
              {language === 'en' ? 'End Session' : 'Zakończ Sesję'}
            </button>
          </>
        )}
      </div>

      {/* Connection Status Indicator */}
      {isActive && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`}
            />
            <span className="text-gray-600">
              {isConnected
                ? language === 'en'
                  ? 'Connected'
                  : 'Połączono'
                : language === 'en'
                ? 'Disconnected'
                : 'Rozłączono'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
