import { useState, useEffect, useRef } from 'react'

const BAR_COUNT = 16

export function useAudioAnalyser(stream: MediaStream | null) {
  const [levels, setLevels] = useState<number[]>(new Array(BAR_COUNT).fill(0))
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!stream) {
      setLevels(new Array(BAR_COUNT).fill(0))
      return
    }

    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.75

    const source = ctx.createMediaStreamSource(stream)
    source.connect(analyser)

    const data = new Uint8Array(analyser.frequencyBinCount)
    const step = Math.floor(analyser.frequencyBinCount / BAR_COUNT)

    const tick = () => {
      analyser.getByteFrequencyData(data)
      const next = Array.from({ length: BAR_COUNT }, (_, i) => (data[i * step] ?? 0) / 255)
      setLevels(next)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      source.disconnect()
      analyser.disconnect()
      ctx.close()
    }
  }, [stream])

  return levels
}
