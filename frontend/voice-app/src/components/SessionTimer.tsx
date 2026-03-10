import { useState, useEffect, useRef } from 'react'

const MAX_SECONDS = 600 // 10 minutes
const WARNING_SECONDS = 540 // 9 minutes

interface SessionTimerProps {
  isActive: boolean
  onTimeout: () => void
}

export default function SessionTimer({ isActive, onTimeout }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onTimeoutRef = useRef(onTimeout)
  onTimeoutRef.current = onTimeout

  useEffect(() => {
    if (isActive) {
      setElapsed(0)
      intervalRef.current = setInterval(() => {
        setElapsed((s) => {
          const next = s + 1
          if (next >= MAX_SECONDS) {
            clearInterval(intervalRef.current!)
            onTimeoutRef.current()
          }
          return next
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current!)
      setElapsed(0)
    }

    return () => clearInterval(intervalRef.current!)
  }, [isActive])

  if (!isActive) return null

  const remaining = MAX_SECONDS - elapsed
  const isWarning = elapsed >= WARNING_SECONDS

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded border text-xs font-mono transition-colors duration-300 ${
      isWarning
        ? 'border-red-300 bg-red-50 text-red-600'
        : 'border-notion-border bg-notion-surface text-notion-textLight'
    }`}>
      <span>{fmt(elapsed)}</span>
      {isWarning && (
        <span className="animate-pulse">
          {remaining}s remaining
        </span>
      )}
    </div>
  )
}
