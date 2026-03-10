import { useState, useEffect } from 'react'
import VoiceControls from './components/VoiceControls'
import TranscriptDisplay from './components/TranscriptDisplay'
import SessionStatus from './components/SessionStatus'
import { useLiveKit } from './hooks/useLiveKit'
import { useWebSocket } from './hooks/useWebSocket'

export type Language = 'en' | 'pl'
export type SessionState = 'idle' | 'connecting' | 'active' | 'escalated' | 'completed' | 'error'

function App() {
  const [language, setLanguage] = useState<Language>('en')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'assistant', text: string, timestamp: Date }>>([])

  const {
    isConnected,
    isConnecting,
    error: liveKitError,
    connect,
    disconnect,
    audioEnabled,
    toggleAudio,
  } = useLiveKit()

  const {
    isConnected: wsConnected,
    messages: wsMessages,
    sendMessage,
  } = useWebSocket(sessionId)

  // Update session state based on LiveKit connection
  useEffect(() => {
    if (isConnecting) {
      setSessionState('connecting')
    } else if (isConnected && sessionState === 'connecting') {
      setSessionState('active')
    } else if (liveKitError) {
      setSessionState('error')
    }
  }, [isConnected, isConnecting, liveKitError, sessionState])

  // Process WebSocket messages
  useEffect(() => {
    wsMessages.forEach((message) => {
      if (message.type === 'transcript') {
        setTranscript((prev) => [
          ...prev,
          {
            role: message.role,
            text: message.text,
            timestamp: new Date(message.timestamp),
          },
        ])
      } else if (message.type === 'session_status') {
        if (message.status === 'escalated') {
          setSessionState('escalated')
        } else if (message.status === 'completed') {
          setSessionState('completed')
        }
      }
    })
  }, [wsMessages])

  const handleStartSession = async () => {
    try {
      setSessionState('connecting')
      const newSessionId = await connect(language)
      setSessionId(newSessionId)
      setTranscript([])
    } catch (error) {
      console.error('Failed to start session:', error)
      setSessionState('error')
    }
  }

  const handleStopSession = async () => {
    try {
      await disconnect()
      setSessionState('completed')
      setSessionId(null)
    } catch (error) {
      console.error('Failed to stop session:', error)
    }
  }

  const handleEscalate = async () => {
    if (sessionId) {
      try {
        sendMessage({
          type: 'escalate',
          sessionId,
        })
        setSessionState('escalated')
      } catch (error) {
        console.error('Failed to escalate:', error)
      }
    }
  }

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'pl' : 'en'))
  }

  const isSessionActive = sessionState === 'active' || sessionState === 'escalated'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
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
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Voice Banking Assistant</h1>
                <p className="text-sm text-gray-500">AI-powered voice support</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <SessionStatus state={sessionState} />
              <button
                onClick={toggleLanguage}
                className="btn-secondary text-sm py-2 px-4"
                disabled={isSessionActive}
                title={isSessionActive ? 'Cannot change language during active session' : ''}
              >
                {language === 'en' ? '🇬🇧 English' : '🇵🇱 Polski'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="lg:col-span-1">
            <VoiceControls
              sessionState={sessionState}
              isConnected={isConnected}
              audioEnabled={audioEnabled}
              onStart={handleStartSession}
              onStop={handleStopSession}
              onEscalate={handleEscalate}
              onToggleAudio={toggleAudio}
              language={language}
            />

            {/* Info Card */}
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How it works</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 font-bold">1.</span>
                  <span>Click "Start Session" to begin talking with the AI assistant</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 font-bold">2.</span>
                  <span>Speak naturally - the assistant understands {language === 'en' ? 'English' : 'Polish'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 font-bold">3.</span>
                  <span>If needed, click "Connect to Consultant" for human help</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-600 font-bold">4.</span>
                  <span>End the session when your questions are answered</span>
                </li>
              </ul>
            </div>

            {liveKitError && (
              <div className="card mt-6 bg-red-50 border border-red-200">
                <h3 className="text-lg font-semibold text-red-900 mb-2">Connection Error</h3>
                <p className="text-sm text-red-700">{liveKitError}</p>
              </div>
            )}
          </div>

          {/* Right Column - Transcript */}
          <div className="lg:col-span-2">
            <TranscriptDisplay
              transcript={transcript}
              isActive={isSessionActive}
              language={language}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Powered by LiveKit & OpenAI | Voice Banking Assistant 2026
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
