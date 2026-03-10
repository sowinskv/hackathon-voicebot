import { SessionState } from '../App'

interface SessionStatusProps {
  state: SessionState
}

export default function SessionStatus({ state }: SessionStatusProps) {
  const getStatusConfig = () => {
    switch (state) {
      case 'idle':
        return {
          label: 'Idle',
          color: 'bg-gray-400',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-100',
        }
      case 'connecting':
        return {
          label: 'Connecting',
          color: 'bg-yellow-400',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
        }
      case 'active':
        return {
          label: 'Active',
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
        }
      case 'escalated':
        return {
          label: 'Escalated',
          color: 'bg-amber-500',
          textColor: 'text-amber-700',
          bgColor: 'bg-amber-50',
        }
      case 'completed':
        return {
          label: 'Completed',
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
        }
      case 'error':
        return {
          label: 'Error',
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
        }
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-400',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-100',
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div
      className={`status-indicator ${config.textColor} ${config.bgColor} px-3 py-1.5 rounded-full`}
    >
      <span className={`status-dot ${config.color}`} />
      <span className="font-semibold">{config.label}</span>
    </div>
  )
}
