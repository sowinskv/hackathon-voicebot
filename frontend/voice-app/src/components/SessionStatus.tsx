import { SessionState } from '../App'

interface SessionStatusProps {
  state: SessionState
}

const config: Record<SessionState, { dot: string; label: string }> = {
  idle:       { dot: 'bg-[#4a4a4a]',    label: 'idle' },
  connecting: { dot: 'bg-yellow-400 animate-pulse', label: 'connecting' },
  active:     { dot: 'bg-green-500 animate-pulse',  label: 'active' },
  escalated:  { dot: 'bg-amber-400 animate-pulse',  label: 'escalated' },
  completed:  { dot: 'bg-primary-500',  label: 'completed' },
  error:      { dot: 'bg-red-500',      label: 'error' },
}

export default function SessionStatus({ state }: SessionStatusProps) {
  const { dot, label } = config[state]

  return (
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      <span className="font-mono text-xs text-[#888]">{label}</span>
    </div>
  )
}
