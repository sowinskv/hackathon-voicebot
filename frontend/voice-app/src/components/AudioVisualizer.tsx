interface AudioVisualizerProps {
  levels: number[]
  isActive: boolean
  audioEnabled: boolean
}

export default function AudioVisualizer({ levels, isActive, audioEnabled }: AudioVisualizerProps) {
  const MIN_HEIGHT = 2
  const MAX_HEIGHT = 32

  return (
    <div className="flex items-end justify-center gap-[3px]" style={{ height: `${MAX_HEIGHT}px` }}>
      {levels.map((level, i) => {
        const height = isActive && audioEnabled
          ? Math.max(MIN_HEIGHT, Math.round(level * MAX_HEIGHT))
          : MIN_HEIGHT

        return (
          <div
            key={i}
            className="w-[3px] rounded-sm"
            style={{
              height: `${height}px`,
              backgroundColor: isActive && audioEnabled ? '#1a1a1a' : '#d1d1d1',
              transition: 'height 80ms ease-out, background-color 200ms ease',
            }}
          />
        )
      })}
    </div>
  )
}
