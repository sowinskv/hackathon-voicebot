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

  useEffect(() => {
    if (isConnecting) {
      setSessionState('connecting')
    } else if (isConnected && sessionState === 'connecting') {
      setSessionState('active')
    } else if (liveKitError) {
      setSessionState('error')
    }
  }, [isConnected, isConnecting, liveKitError, sessionState])

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
        sendMessage({ type: 'escalate', sessionId })
        setSessionState('escalated')
      } catch (error) {
        console.error('Failed to escalate:', error)
      }
    }
  }

  const handleRetry = () => {
    setSessionState('idle')
  }

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'pl' : 'en'))
  }

  const isSessionActive = sessionState === 'active' || sessionState === 'escalated'

  return (
    <div className="min-h-screen flex flex-col bg-notion-bg">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold" style={{ color: '#1a1a1a' }}>Voice Banking Assistant</h1>
              <p className="text-xs" style={{ color: '#6b6869' }}>AI-powered voice support</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SessionStatus state={sessionState} />
            <button
              onClick={toggleLanguage}
              disabled={isSessionActive}
              className="btn-secondary text-xs py-1.5 px-3 disabled:opacity-30"
            >
              {language === 'en' ? '🇬🇧 English' : '🇵🇱 Polski'}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Controls */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <VoiceControls
              sessionState={sessionState}
              isConnected={isConnected}
              audioEnabled={audioEnabled}
              onStart={handleStartSession}
              onStop={handleStopSession}
              onEscalate={handleEscalate}
              onRetry={handleRetry}
              onToggleAudio={toggleAudio}
              language={language}
            />

            {/* How it works */}
            <div className="card animate-fadeIn">
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#1a1a1a' }}>How it works</h3>
              <ol className="space-y-3">
                {[
                  language === 'en' ? 'Click Start Session to connect' : 'Kliknij Rozpocznij, aby się połączyć',
                  language === 'en' ? `Speak naturally in ${language === 'en' ? 'English' : 'Polish'}` : 'Mów naturalnie po polsku',
                  language === 'en' ? 'Say "connect me to a consultant" to escalate' : 'Powiedz „połącz z konsultantem" aby eskalować',
                  language === 'en' ? 'End the session when finished' : 'Zakończ sesję po rozmowie',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-notion-textLight">
                    <span className="font-mono text-coral-500 font-semibold text-xs mt-0.5 flex-shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {liveKitError && (
              <div className="card border-red-300 bg-red-50 animate-fadeIn">
                <div className="panel-label text-red-400">Error</div>
                <p className="text-sm text-red-700">{liveKitError}</p>
              </div>
            )}
          </div>

          {/* Right — Transcript */}
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
      <footer className="border-t border-notion-border">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="font-mono text-xs text-notion-textLight">
            LiveKit · ElevenLabs · Gemini 2.5
          </span>
          <span className="font-mono text-xs text-notion-textLight">
            {wsConnected ? '● ws connected' : '○ ws disconnected'}
          </span>
        </div>
      </footer>
    </div>
  )
}

export default App
