import { useEffect } from 'react'
import { Compass, Move3d, MousePointerClick } from 'lucide-react'
import { Scene } from './scene/Scene'
import { TopBar } from './components/ui/TopBar'
import { Sidebar } from './components/ui/Sidebar'
import { MobileBookingSheet, MobileDock } from './components/ui/MobileBooking'
import { SeatTooltip } from './components/ui/SeatTooltip'
import { SeatViewHUD } from './components/ui/SeatViewHUD'
import { CheckoutModal } from './components/ui/CheckoutModal'
import { IntroCurtain } from './components/ui/IntroCurtain'
import { Toast } from './components/ui/Toast'
import { CursorFollower } from './components/ui/CursorFollower'
import { useBookingStore } from './store/bookingStore'

export default function App() {
  const mode = useBookingStore((s) => s.cameraMode)
  const checkoutOpen = useBookingStore((s) => s.checkoutOpen)
  const goOverview = useBookingStore((s) => s.goOverview)
  const focusStage = useBookingStore((s) => s.focusStage)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const typing =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT'
      if (e.key === 'Escape') {
        if (checkoutOpen) return
        const state = useBookingStore.getState()
        if (state.mobilePanelOpen) {
          state.setMobilePanelOpen(false)
          return
        }
        if (state.cameraMode === 'seat') state.goOverview()
        return
      }
      if (typing || checkoutOpen) return
      const key = e.key.toLowerCase()
      if (key === 'r') goOverview()
      if (key === 'f') focusStage()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [checkoutOpen, focusStage, goOverview])

  return (
    <main className="relative h-full w-full overflow-hidden bg-[#08070a]">
      <Scene />

      {/* cinematic overlays */}
      <div className="vignette pointer-events-none absolute inset-0 z-10" />
      <div className="grain pointer-events-none absolute inset-0 z-10" />

      <TopBar />
      <Sidebar />
      <MobileDock />
      <MobileBookingSheet />

      <SeatTooltip />
      <SeatViewHUD />

      {mode !== 'seat' && (
        <div className="pointer-events-none fixed bottom-5 left-5 z-20 hidden items-center gap-3 lg:flex xl:left-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#0f0e12]/65 backdrop-blur-xl">
            <Compass className="h-4 w-4 text-gold/55" strokeWidth={1.4} />
          </div>
          <div>
            <p className="text-[7.5px] font-semibold uppercase tracking-[0.22em] text-gold/55">
              Grand Auditorium · Overview
            </p>
            <p className="mt-1 flex items-center gap-2 text-[8.5px] text-white/30">
              <span className="flex items-center gap-1">
                <Move3d className="h-2.5 w-2.5" /> Aylantirish
              </span>
              <span className="text-white/10">·</span>
              <span>Yaxlitlashtirish</span>
              <span className="text-white/10">·</span>
              <span className="flex items-center gap-1">
                <MousePointerClick className="h-2.5 w-2.5" /> O'rindiq tanlash
              </span>
            </p>
          </div>
        </div>
      )}

      {mode !== 'seat' && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 text-[7px] uppercase tracking-[0.24em] text-white/18 xl:flex">
          <span className="h-px w-7 bg-white/15" />
          Xalqlar Do'stligi <span className="text-gold/30">✦</span> Toshkent
          <span className="h-px w-7 bg-white/15" />
        </div>
      )}

      <CheckoutModal />
      <Toast />
      <IntroCurtain />
      <CursorFollower />
    </main>
  )
}
