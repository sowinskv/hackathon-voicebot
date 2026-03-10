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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'en' ? 'en-US' : 'pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getEmptyStateText = () => {
    if (isActive) {
      return language === 'en'
        ? 'Listening... Start speaking to see the transcript.'
        : 'Słucham... Zacznij mówić, aby zobaczyć transkrypcję.'
    }
    return language === 'en'
      ? 'Start a session to see the conversation transcript here.'
      : 'Rozpocznij sesję, aby zobaczyć transkrypcję rozmowy.'
  }

  return (
    <div className="card h-full flex flex-col" style={{ minHeight: '600px' }}>
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">
          {language === 'en' ? 'Conversation Transcript' : 'Transkrypcja Rozmowy'}
        </h2>
        {isActive && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {language === 'en' ? 'Live' : 'Na żywo'}
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2"
        style={{ maxHeight: 'calc(600px - 80px)' }}
      >
        {transcript.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <p className="text-sm">{getEmptyStateText()}</p>
            </div>
          </div>
        ) : (
          transcript.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold opacity-75">
                    {message.role === 'user'
                      ? language === 'en'
                        ? 'You'
                        : 'Ty'
                      : language === 'en'
                      ? 'Assistant'
                      : 'Asystent'}
                  </span>
                  <span className="text-xs opacity-50">
                    {formatTime(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Transcript Actions */}
      {transcript.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {transcript.length} {language === 'en' ? 'messages' : 'wiadomości'}
          </span>
          <button
            onClick={() => {
              const text = transcript
                .map(
                  (m) =>
                    `[${formatTime(m.timestamp)}] ${
                      m.role === 'user' ? 'User' : 'Assistant'
                    }: ${m.text}`
                )
                .join('\n\n')
              navigator.clipboard.writeText(text)
            }}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {language === 'en' ? 'Copy transcript' : 'Kopiuj transkrypcję'}
          </button>
        </div>
      )}
    </div>
  )
}
