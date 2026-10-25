import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Eye, ShoppingBag, X } from 'lucide-react'
import { formatUZS } from '../../data/hall'
import { useBookingStore, useCartTotal, useSelectedSeats } from '../../store/bookingStore'
import { BookingPanelContent } from './Sidebar'

export function MobileDock() {
  const mode = useBookingStore((s) => s.cameraMode)
  const selectedSeats = useSelectedSeats()
  const total = useCartTotal()
  const lastSelectedId = useBookingStore((s) => s.lastSelectedId)
  const openCheckout = useBookingStore((s) => s.openCheckout)
  const viewFromSeat = useBookingStore((s) => s.viewFromSeat)
  const setOpen = useBookingStore((s) => s.setMobilePanelOpen)
  const checkoutOpen = useBookingStore((s) => s.checkoutOpen)

  if (mode === 'seat') return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <motion.div
        initial={{ y: 90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel flex items-center gap-2.5 rounded-2xl p-2 pl-3.5 shadow-2xl"
      >
        <button
          onClick={() => setOpen(true)}
          className="min-w-0 flex-1 py-1 text-left"
          aria-label="Open your seat selection"
        >
          <p className="text-[7.5px] font-semibold uppercase tracking-[0.2em] text-gold/70">
            {selectedSeats.length ? `${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''} selected` : 'Grand Auditorium'}
          </p>
          <p className="mt-0.5 truncate font-display text-[19px] leading-none text-[#f5eddc]">
            {selectedSeats.length ? formatUZS(total) : "Simfoniya Konserti"}
          </p>
          <p className="mt-1 text-[7.5px] uppercase tracking-[0.14em] text-white/28">
            {selectedSeats.length ? 'Tap to review your seats' : 'Tap a burgundy seat to begin'}
          </p>
        </button>
        {lastSelectedId && (
          <button
            onClick={() => viewFromSeat(lastSelectedId)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/[0.07] text-gold"
            aria-label="View from your seat"
          >
            <Eye className="h-4 w-4" strokeWidth={1.6} />
          </button>
        )}
        <button
          onClick={() => (selectedSeats.length ? openCheckout() : setOpen(true))}
          disabled={checkoutOpen}
          className="btn-gold flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[9px] font-bold uppercase tracking-[0.1em]"
        >
          {selectedSeats.length ? (
            <>
              Checkout <ArrowRight className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              <ShoppingBag className="h-3.5 w-3.5" /> Seats
            </>
          )}
        </button>
      </motion.div>
    </div>
  )
}

export function MobileBookingSheet() {
  const open = useBookingStore((s) => s.mobilePanelOpen)
  const setOpen = useBookingStore((s) => s.setMobilePanelOpen)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            key="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[45] bg-black/70 backdrop-blur-sm lg:hidden"
            aria-label="Close seat panel"
          />
          <motion.div
            key="mobile-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="glass-panel fixed inset-x-0 bottom-0 z-[46] flex h-[88dvh] flex-col overflow-hidden rounded-t-[28px] lg:hidden"
          >
            <div className="relative flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 pb-2 pt-2.5">
              <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/15" />
              <p className="mt-2 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/30">
                Booking panel
              </p>
              <button
                onClick={() => setOpen(false)}
                className="mt-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/50"
                aria-label="Close booking panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <BookingPanelContent compact onAfterCheckout={() => setOpen(false)} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
