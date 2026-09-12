"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { AudioEngine, TRACKS, type Track } from '@/lib/audioEngine'

interface MusicContextValue {
  tracks: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  isWheelOpen: boolean
  playTrack: (track: Track) => void
  pause: () => void
  resume: () => void
  stop: () => void
  setVolume: (volume: number) => void
  openWheel: () => void
  closeWheel: () => void
  toggleWheel: () => void
}

const MusicContext = createContext<MusicContextValue | null>(null)

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioEngineRef = useRef<AudioEngine | null>(null)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.7)
  const [isWheelOpen, setIsWheelOpen] = useState(false)

  useEffect(() => {
    const engine = new AudioEngine()
    audioEngineRef.current = engine

    engine.setOnStateChange((state) => {
      setCurrentTrack(state.currentTrack)
      setIsPlaying(state.isPlaying)
    })

    engine.setVolume(volume)

    return () => {
      engine.dispose()
    }
  }, [])

  useEffect(() => {
    audioEngineRef.current?.setVolume(volume)
  }, [volume])

  const playTrack = useCallback(async (track: Track) => {
    await audioEngineRef.current?.playTrack(track)
  }, [])

  const pause = useCallback(() => {
    audioEngineRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    audioEngineRef.current?.resume()
  }, [])

  const stop = useCallback(() => {
    audioEngineRef.current?.stop()
  }, [])

  const setVolumeLocal = useCallback((vol: number) => {
    setVolumeState(vol)
  }, [])

  const openWheel = useCallback(() => {
    setIsWheelOpen(true)
  }, [])

  const closeWheel = useCallback(() => {
    setIsWheelOpen(false)
  }, [])

  const toggleWheel = useCallback(() => {
    setIsWheelOpen((prev) => !prev)
  }, [])

  return (
    <MusicContext.Provider
      value={{
        tracks: TRACKS,
        currentTrack,
        isPlaying,
        volume,
        isWheelOpen,
        playTrack,
        pause,
        resume,
        stop,
        setVolume: setVolumeLocal,
        openWheel,
        closeWheel,
        toggleWheel,
      }}
    >
      {children}
    </MusicContext.Provider>
  )
}

export function useMusic() {
  const context = useContext(MusicContext)
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider')
  }
  return context
}
