import { useEffect, useRef } from 'react'
import { Language } from '../App'

interface TranscriptMessage {
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
}

interface TranscriptDisplayProps {
  transcript: TranscriptMessage[]
  isActive: boolean
  language: Language
}

export default function TranscriptDisplay({
  transcript,
  isActive,
  language,
}: TranscriptDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(language === 'en' ? 'en-US' : 'pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

  const emptyText = isActive
    ? (language === 'en' ? 'Listening… start speaking.' : 'Słucham… zacznij mówić.')
    : (language === 'en' ? 'Start a session to see the transcript.' : 'Rozpocznij sesję, aby zobaczyć transkrypcję.')

  return (
    <div className="card flex flex-col" style={{ minHeight: '600px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: '1px solid #d4cfc8' }}>
        <h2 className="text-base font-semibold" style={{ color: '#1a1a1a' }}>Conversation Transcript</h2>
        {isActive && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="font-mono text-xs" style={{ color: '#6b6869' }}>live</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 pr-1"
        style={{ maxHeight: 'calc(600px - 100px)' }}
      >
        {transcript.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="font-mono text-xs text-notion-textLight text-center">{emptyText}</p>
          </div>
        ) : (
          transcript.map((message, index) => (
            <div
              key={index}
              className={`flex flex-col gap-1 animate-fadeIn ${message.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {/* Role + time */}
              <div className="flex items-center gap-2 px-1">
                <span className="font-mono text-xs text-notion-textLight">
                  {message.role === 'user'
                    ? (language === 'en' ? 'you' : 'ty')
                    : (language === 'en' ? 'bot' : 'bot')}
                </span>
                <span className="font-mono text-xs text-notion-textLight opacity-60">
                  {formatTime(message.timestamp)}
                </span>
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] rounded px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'bg-[#1a1a1a] text-white'
                    : 'bg-notion-bg border border-notion-border text-notion-text'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {transcript.length > 0 && (
        <div className="mt-4 pt-4 border-t border-notion-border flex items-center justify-between">
          <span className="font-mono text-xs text-notion-textLight">
            {transcript.length} {language === 'en' ? 'messages' : 'wiadomości'}
          </span>
          <button
            onClick={() => {
              const text = transcript
                .map((m) => `[${formatTime(m.timestamp)}] ${m.role === 'user' ? 'User' : 'Bot'}: ${m.text}`)
                .join('\n\n')
              navigator.clipboard.writeText(text)
            }}
            className="font-mono text-xs text-notion-textLight hover:text-notion-text transition-colors"
          >
            copy transcript ↗
          </button>
        </div>
      )}
    </div>
  )
}
