import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Clock3,
  MapPin,
  Maximize2,
  Minimize2,
  Orbit,
  Rows3,
  Volume2,
  VolumeX,
  Play,
  Pause,
} from 'lucide-react'
import { EVENT } from '../../data/hall'
import { useBookingStore } from '../../store/bookingStore'
import { useAudio } from './AudioController'

function HoverLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#151319]/95 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-white/65 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100 xl:block">
      {children}
    </span>
  )
}

export function TopBar() {
  const mode = useBookingStore((s) => s.cameraMode)
  const goOverview = useBookingStore((s) => s.goOverview)
  const focusStage = useBookingStore((s) => s.focusStage)
  const { isPlaying, isMuted, togglePlay, toggleMute } = useAudio()
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      /* fullscreen can be blocked by the browser */
    }
  }

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 px-3 pt-3 sm:px-5 sm:pt-5 lg:px-7 lg:pt-6">
      <div className="flex items-start justify-between gap-3">
        <div className="pointer-events-auto flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-[#121016]/70 shadow-[0_0_30px_-8px_rgba(212,175,55,0.6)] backdrop-blur-xl">
            <span className="absolute inset-[4px] rounded-full border border-gold/15" />
            <span className="font-display text-[17px] tracking-[0.04em] text-champagne">XD</span>
            <span className="absolute -right-0.5 top-0 h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_2px_rgba(212,175,55,0.6)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.42em] text-gold/85 sm:text-[9.5px]">
              Xalqlar
            </p>
            <p className="mt-0.5 truncate font-display text-[15px] leading-none text-white/90 sm:text-[17px]">
              Do'stligi <span className="text-white/35">·</span>{' '}
              <span className="italic text-champagne/90">Toshkent</span>
            </p>
          </div>
        </div>

        <div className="pointer-events-auto hidden items-center gap-0 divide-x divide-white/10 rounded-full border border-white/[0.07] bg-[#100f13]/55 px-2 py-2 text-[10px] text-white/55 shadow-2xl backdrop-blur-2xl md:flex">
          <span className="flex items-center gap-1.5 px-3">
            <CalendarDays className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} />
            {EVENT.dateLong}
          </span>
          <span className="flex items-center gap-1.5 px-3">
            <Clock3 className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} />
            {EVENT.start}
          </span>
          <span className="hidden items-center gap-1.5 px-3 lg:flex">
            <MapPin className="h-3.5 w-3.5 text-gold/70" strokeWidth={1.5} />
            Toshkent, O'zbekiston
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause music' : 'Play music'}
            className="icon-btn group relative h-10 w-10 rounded-full focus-ring"
            title={isPlaying ? 'Pause music' : 'Play music'}
          >
            {isPlaying ? <Pause className="h-4 w-4" strokeWidth={1.6} /> : <Play className="h-4 w-4" strokeWidth={1.6} />}
            <HoverLabel>{isPlaying ? 'Pause' : 'Play'}</HoverLabel>
          </button>
          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute music' : 'Mute music'}
            className="icon-btn group relative h-10 w-10 rounded-full focus-ring"
            title={isMuted ? 'Unmute music' : 'Mute music'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" strokeWidth={1.6} /> : <Volume2 className="h-4 w-4" strokeWidth={1.6} />}
            <HoverLabel>{isMuted ? 'Unmute' : 'Mute'}</HoverLabel>
          </button>
          <button
            onClick={goOverview}
            aria-label="Reset to hall overview"
            className="icon-btn group relative h-10 w-10 rounded-full focus-ring"
            title="Overview (R)"
          >
            <Orbit className="h-4 w-4" strokeWidth={1.6} />
            <HoverLabel>Overview</HoverLabel>
          </button>
          <button
            onClick={focusStage}
            aria-label="Focus the stage"
            className="icon-btn group relative h-10 w-10 rounded-full focus-ring"
            title="Focus stage (F)"
          >
            <Rows3 className="h-4 w-4" strokeWidth={1.6} />
            <HoverLabel>Stage</HoverLabel>
          </button>
          <button
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            className="icon-btn group relative h-10 w-10 rounded-full focus-ring"
            title="Toggle fullscreen"
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" strokeWidth={1.6} />
            ) : (
              <Maximize2 className="h-4 w-4" strokeWidth={1.6} />
            )}
            <HoverLabel>{fullscreen ? 'Exit full screen' : 'Full screen'}</HoverLabel>
          </button>
          <div className="ml-1 hidden items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-3 py-2 lg:flex">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-gold" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-gold/90">
              {mode === 'seat' ? 'Seat view' : 'Live seat map'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
