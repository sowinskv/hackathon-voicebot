import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Room,
  RoomEvent,
  RemoteTrackPublication,
  RemoteTrack,
  LocalAudioTrack,
  createLocalAudioTrack,
} from 'livekit-client'
import { createSession } from '../services/api'

export function useLiveKit() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)

  const roomRef = useRef<Room | null>(null)
  const audioTrackRef = useRef<LocalAudioTrack | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect()
      }
    }
  }, [])

  const connect = useCallback(async (language: string): Promise<string> => {
    setIsConnecting(true)
    setError(null)

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Stop the test stream

      // Create session and get LiveKit token
      const sessionData = await createSession(language)
      const { sessionId, livekitToken, livekitUrl } = sessionData

      // Create and configure room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      roomRef.current = room

      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('Connected to LiveKit room')
        setIsConnected(true)
        setIsConnecting(false)
      })

      room.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from LiveKit room')
        setIsConnected(false)
        setIsConnecting(false)
      })

      room.on(RoomEvent.Reconnecting, () => {
        console.log('Reconnecting to LiveKit room...')
        setError('Connection lost, reconnecting...')
      })

      room.on(RoomEvent.Reconnected, () => {
        console.log('Reconnected to LiveKit room')
        setError(null)
      })

      room.on(RoomEvent.TrackSubscribed, (
        track: RemoteTrack,
        publication: RemoteTrackPublication
      ) => {
        console.log('Track subscribed:', publication.trackSid)
        if (track.kind === 'audio') {
          const audioElement = track.attach()
          audioElement.play()
        }
      })

      // Connect to room
      await room.connect(livekitUrl, livekitToken)

      // Create and publish local audio track
      const audioTrack = await createLocalAudioTrack({
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      })
      audioTrackRef.current = audioTrack
      setAudioStream(new MediaStream([audioTrack.mediaStreamTrack]))
      await room.localParticipant.publishTrack(audioTrack)

      return sessionId
    } catch (err) {
      console.error('Failed to connect to LiveKit:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect'
      setError(errorMessage)
      setIsConnecting(false)
      throw err
    }
  }, [])

  const disconnect = useCallback(async () => {
    try {
      if (audioTrackRef.current) {
        audioTrackRef.current.stop()
        audioTrackRef.current = null
      }

      if (roomRef.current) {
        await roomRef.current.disconnect()
        roomRef.current = null
      }

      setIsConnected(false)
      setAudioEnabled(true)
      setAudioStream(null)
      setError(null)
    } catch (err) {
      console.error('Error disconnecting:', err)
      throw err
    }
  }, [])

  const toggleAudio = useCallback(() => {
    if (audioTrackRef.current) {
      const newEnabled = !audioEnabled
      audioTrackRef.current.setEnabled(newEnabled)
      setAudioEnabled(newEnabled)
    }
  }, [audioEnabled])

  return {
    isConnected,
    isConnecting,
    error,
    audioEnabled,
    audioStream,
    connect,
    disconnect,
    toggleAudio,
  }
}
