import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, Compass, Eye, MapPin, Move, Ticket } from 'lucide-react'
import { SEAT_MAP, formatUZS } from '../../data/hall'
import { useBookingStore, useCartTotal, useSelectedSeats } from '../../store/bookingStore'

export function SeatViewHUD() {
  const mode = useBookingStore((s) => s.cameraMode)
  const viewSeatId = useBookingStore((s) => s.viewSeatId)
  const goOverview = useBookingStore((s) => s.goOverview)
  const openCheckout = useBookingStore((s) => s.openCheckout)
  const selectedSeats = useSelectedSeats()
  const total = useCartTotal()
  const seat = viewSeatId ? SEAT_MAP.get(viewSeatId) : undefined
  const location = seat
    ? seat.section === 'Parterre'
      ? `${seat.zone} · ${seat.block}`
      : seat.zone
    : ''

  return (
    <AnimatePresence>
      {mode === 'seat' && seat && (
        <motion.div
          key="seat-hud"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="pointer-events-none fixed inset-0 z-30"
        >
          {/* cinematic letterbox + viewfinder edges */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute left-4 top-24 h-9 w-9 border-l border-t border-gold/25 sm:left-6 sm:top-28" />
          <div className="absolute right-4 top-24 h-9 w-9 border-r border-t border-gold/25 sm:right-6 sm:top-28" />
          <div className="absolute bottom-32 left-4 h-9 w-9 border-b border-l border-gold/15 sm:bottom-28 sm:left-6" />
          <div className="absolute bottom-32 right-4 h-9 w-9 border-b border-r border-gold/15 sm:bottom-28 sm:right-6" />

          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            onClick={goOverview}
            className="glass-panel pointer-events-auto absolute left-4 top-[82px] flex items-center gap-2.5 rounded-full py-2.5 pl-2.5 pr-4 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/75 transition-colors hover:border-gold/35 hover:text-champagne sm:left-6 sm:top-[92px]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gold/25 bg-gold/10 text-gold">
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
            Zaldan chiqish
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: -8, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="absolute left-1/2 top-[86px] hidden items-center gap-3 rounded-full border border-white/[0.07] bg-[#0d0c10]/60 px-4 py-2.5 backdrop-blur-xl md:flex"
          >
            <span className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-gold/80">
              <Eye className="h-3 w-3" strokeWidth={1.7} />
              View from seat
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="text-[9px] tracking-wide text-white/55">
              {seat.section} · Row {seat.row} · Seat {seat.number}
            </span>
            <span className="live-dot h-1 w-1 rounded-full bg-gold" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            transition={{ delay: 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel pointer-events-auto absolute bottom-4 left-1/2 w-[calc(100%-1.5rem)] max-w-[820px] overflow-hidden rounded-2xl md:bottom-6"
          >
            <div className="flex items-center gap-3 p-3.5 sm:gap-5 sm:px-5">
              <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/[0.07] sm:flex">
                <Compass className="h-5 w-5 text-gold" strokeWidth={1.3} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[7.5px] font-semibold uppercase tracking-[0.2em] text-gold/70">
                  <Eye className="h-2.5 w-2.5 sm:hidden" />
                  Your viewpoint
                  <span className="text-white/18">·</span>
                  <span className="text-champagne/70">{seat.section}</span>
                  <span className="hidden items-center gap-1 text-turquoise/70 sm:flex">
                    <Check className="h-2.5 w-2.5" /> Selected
                  </span>
                </p>
                <p className="mt-1 truncate font-display text-[17px] leading-tight text-[#f7f0e2] sm:text-[19px]">
                  Row {seat.row}, Seat {seat.number}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[8px] uppercase tracking-[0.1em] text-white/28">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{location}</span>
                  <span className="hidden text-white/15 sm:inline">/</span>
                  <span className="hidden text-white/35 sm:inline">{formatUZS(seat.price)}</span>
                </p>
              </div>

              <div className="hidden items-center gap-2 border-l border-white/[0.07] pl-5 md:flex">
                <Move className="h-3.5 w-3.5 text-turquoise/60" strokeWidth={1.5} />
                <div>
                  <p className="text-[7px] font-semibold uppercase tracking-[0.18em] text-white/25">
                    360° look-around
                  </p>
                  <p className="mt-0.5 text-[8.5px] text-white/40">Drag anywhere to look · arrow keys</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={goOverview}
                  className="hidden h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-[8.5px] font-semibold uppercase tracking-[0.12em] text-white/50 transition-colors hover:border-gold/30 hover:text-champagne sm:flex"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Overview
                </button>
                <button
                  onClick={openCheckout}
                  disabled={!selectedSeats.length}
                  className="btn-gold flex h-10 items-center gap-2 rounded-lg px-3.5 text-[8.5px] font-bold uppercase tracking-[0.1em]"
                >
                  <Ticket className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Book</span>
                  <span>{formatUZS(total).replace(' UZS', '')}</span>
                </button>
              </div>
            </div>
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          </motion.div>

          <div className="absolute bottom-[132px] left-1/2 flex -translate-x-1/2 items-center gap-2 text-[7.5px] uppercase tracking-[0.2em] text-white/30 md:hidden">
            <Move className="h-3 w-3 text-turquoise/50" /> Drag to look around
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
