import { createContext, useContext, useEffect, useRef, useState } from 'react'
import pianoUrl from '../../../piano.mp3'

const AUDIO_STORAGE_KEY = 'concert-hall-audio-time'
const AUDIO_PREF_KEY = 'concert-hall-audio-pref'

interface AudioContextType {
  isPlaying: boolean
  isMuted: boolean
  togglePlay: () => void
  toggleMute: () => void
  audioRef: React.RefObject<HTMLAudioElement>
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Load saved time (only after metadata)
    const restoreTime = () => {
      const saved = localStorage.getItem(AUDIO_STORAGE_KEY)
      if (saved) {
        const t = parseFloat(saved)
        if (!isNaN(t) && t >= 0 && t < audio.duration) {
          audio.currentTime = t
        }
      }
    }
    audio.addEventListener('loadedmetadata', restoreTime)

    // Periodic save (every second)
    const interval = setInterval(() => {
      if (!audio.paused) {
        localStorage.setItem(AUDIO_STORAGE_KEY, audio.currentTime.toString())
      }
    }, 1000)

    const onPlay = () => {
      setIsPlaying(true)
      localStorage.setItem(AUDIO_PREF_KEY, 'playing')
    }
    const onPause = () => {
      setIsPlaying(false)
      localStorage.setItem(AUDIO_STORAGE_KEY, audio.currentTime.toString())
      localStorage.setItem(AUDIO_PREF_KEY, 'paused')
    }
    const onVisibility = () => {
      if (document.hidden) {
        localStorage.setItem(AUDIO_STORAGE_KEY, audio.currentTime.toString())
      }
    }
    const onUnload = () => {
      localStorage.setItem(AUDIO_STORAGE_KEY, audio.currentTime.toString())
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', onUnload)
    window.addEventListener('pagehide', onUnload)

    // Autoplay attempt (respect saved preference)
    const pref = localStorage.getItem(AUDIO_PREF_KEY)
    if (pref !== 'paused') {
      audio.play().catch(() => {
        // Autoplay blocked – wait for user interaction
      })
    }

    // expose for debugging / external hooks
    ;(window as any).__concertAudio = audio

    return () => {
      clearInterval(interval)
      audio.removeEventListener('loadedmetadata', restoreTime)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', onUnload)
      window.removeEventListener('pagehide', onUnload)
    }
  }, [])

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch((e) => console.warn('Play blocked', e))
    }
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    audioRef.current.muted = !audioRef.current.muted
    setIsMuted(audioRef.current.muted)
  }

  return (
    <AudioContext.Provider value={{ isPlaying, isMuted, togglePlay, toggleMute, audioRef }}>
      <audio ref={audioRef} src={pianoUrl} loop preload="auto" />
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) throw new Error('useAudio must be used within AudioProvider')
  return context
}
