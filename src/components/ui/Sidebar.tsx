import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Armchair,
  Check,
  Eye,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { BOOKED_COUNT, EVENT, SEAT_COUNT, formatUZS } from '../../data/hall'
import { useBookingStore, useCartTotal, useSelectedSeats } from '../../store/bookingStore'
import { HallPlan, SeatLegend } from './HallPlan'
import type { Seat } from '../../data/hall'

function AnimatedTotal({ value }: { value: number }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -10, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="inline-block"
      >
        {formatUZS(value)}
      </motion.span>
    </AnimatePresence>
  )
}

function EmptySelection() {
  return (
    <div className="relative mt-2 overflow-hidden rounded-xl border border-dashed border-white/10 bg-white/[0.018] px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/[0.06]">
          <Armchair className="h-4 w-4 text-gold/80" strokeWidth={1.5} />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-gold/80" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-white/65">Your seat awaits</p>
          <p className="mt-0.5 text-[9.5px] leading-relaxed text-white/32">
            Tap any burgundy seat in the hall. Drag to orbit, scroll to zoom.
          </p>
        </div>
      </div>
    </div>
  )
}

function SeatLine({ seat, index }: { seat: Seat; index: number }) {
  const removeSeat = useBookingStore((s) => s.removeSeat)
  const viewFromSeat = useBookingStore((s) => s.viewFromSeat)
  const isVip = seat.section === 'VIP'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 18, transition: { duration: 0.16 } }}
      transition={{ duration: 0.22, delay: index * 0.02 }}
      className="group relative flex items-center gap-2.5 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.022] px-2.5 py-2 transition-colors hover:border-gold/25 hover:bg-gold/[0.035]"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
          isVip ? 'border-gold/35 bg-gold/10 text-gold' : 'border-white/10 bg-white/[0.03] text-champagne/80'
        }`}
      >
        <Armchair className="h-3.5 w-3.5" strokeWidth={1.6} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[11px] font-semibold tracking-[0.01em] text-white/85">{seat.section}</p>
          {isVip && (
            <span className="rounded-[3px] bg-gold/15 px-1 py-px text-[7px] font-bold uppercase tracking-[0.12em] text-gold">
              VIP
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[9px] tabular-nums text-white/35">
          Row {seat.row} · Seat {seat.number} <span className="mx-1 text-white/15">/</span>{' '}
          {formatUZS(seat.price).replace(' UZS', '')}
        </p>
      </div>
      <div className="flex items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => viewFromSeat(seat.id)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-white/35 transition-colors hover:bg-gold/10 hover:text-gold"
          aria-label={`View from ${seat.section} row ${seat.row} seat ${seat.number}`}
          title="View from this seat"
        >
          <Eye className="h-3.5 w-3.5" strokeWidth={1.6} />
        </button>
        <button
          onClick={() => removeSeat(seat.id)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/5 hover:text-rose-300"
          aria-label={`Remove ${seat.section} row ${seat.row} seat ${seat.number}`}
          title="Remove seat"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.6} />
        </button>
      </div>
    </motion.div>
  )
}

export function BookingPanelContent({
  compact = false,
  onAfterCheckout,
}: {
  compact?: boolean
  onAfterCheckout?: () => void
}) {
  const selectedSeats = useSelectedSeats()
  const total = useCartTotal()
  const lastSelectedId = useBookingStore((s) => s.lastSelectedId)
  const openCheckout = useBookingStore((s) => s.openCheckout)
  const viewFromSeat = useBookingStore((s) => s.viewFromSeat)
  const clearSeats = useBookingStore((s) => s.clearSeats)
  const availableTotal = useMemo(
    () => SEAT_COUNT - BOOKED_COUNT - useBookingStore.getState().purchasedIds.length,
    [],
  )

  const handleCheckout = () => {
    openCheckout()
    onAfterCheckout?.()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`relative shrink-0 ${compact ? 'px-4 pt-4' : 'px-5 pt-5'}`}>
        <div className="flex items-center justify-between">
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.24em] text-gold/85">
            {EVENT.dateShort} 2026 · {EVENT.start}
          </p>
          <span className="flex items-center gap-1.5 rounded-full border border-turquoise/20 bg-turquoise/[0.07] px-2 py-0.5 text-[7.5px] font-bold uppercase tracking-[0.16em] text-turquoise/85">
            <span className="h-1 w-1 rounded-full bg-turquoise" />
            On sale
          </span>
        </div>

        <h1 className="mt-3 font-display text-[35px] font-medium leading-[0.9] tracking-[-0.015em] text-[#f7f0e2]">
          Simfoniya
          <br />
          <span className="italic text-champagne">Konserti</span>
        </h1>

        <p className="mt-2.5 flex items-center gap-1.5 text-[9.5px] text-white/42">
          <MapPin className="h-3 w-3 text-gold/60" strokeWidth={1.6} />
          {EVENT.venue} · {EVENT.city}
        </p>

        {!compact && <HallPlan />}

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.055] pt-2.5">
          <div className="min-w-0">
            <p className="truncate text-[9px] font-medium text-white/50">{EVENT.programme}</p>
            <p className="mt-0.5 text-[8px] uppercase tracking-[0.14em] text-white/25">
              {EVENT.duration} · {EVENT.hall}
            </p>
          </div>
          <span className="shrink-0 font-display text-[11px] italic text-gold/60">Season 2026</span>
        </div>
      </div>

      <div className={`mt-4 min-h-0 flex-1 overflow-y-auto scrollbar-luxe ${compact ? 'px-4' : 'px-5'}`}>
        <div className="flex items-center justify-between">
          <span className="text-[8px] font-semibold uppercase tracking-[0.22em] text-white/30">Seat legend</span>
          <span className="text-[8px] uppercase tracking-[0.12em] text-white/20">Prices incl. VAT</span>
        </div>
        <div className="mt-2">
          <SeatLegend />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/30">
            Your selection
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gold/12 px-1 font-display text-[10px] leading-none text-gold">
              {selectedSeats.length}
            </span>
          </span>
          {selectedSeats.length > 0 && (
            <button
              onClick={clearSeats}
              className="flex items-center gap-1 text-[8px] uppercase tracking-[0.12em] text-white/25 transition-colors hover:text-rose-300/80"
            >
              <Trash2 className="h-2.5 w-2.5" />
              Clear
            </button>
          )}
        </div>

        <div className="mt-2">
          <AnimatePresence initial={false} mode="popLayout">
            {selectedSeats.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <EmptySelection />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                className="scrollbar-luxe max-h-[190px] space-y-1.5 overflow-y-auto pr-0.5"
              >
                {selectedSeats.map((seat, i) => (
                  <SeatLine key={seat.id} seat={seat} index={i} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {selectedSeats.length > 0 && (
          <div className="mt-3 rounded-xl border border-gold/20 bg-gold/[0.045] px-3 py-2.5">
            <div className="flex items-center justify-between text-[9px] text-white/40">
              <span>Subtotal</span>
              <span className="font-display text-[13px] text-white/75">{formatUZS(total)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[9px] text-white/40">
              <span className="flex items-center gap-1">
                Booking fee <Sparkles className="h-2.5 w-2.5 text-gold/60" />
              </span>
              <span className="text-turquoise/80">Complimentary</span>
            </div>
            <div className="gold-rule my-2 opacity-50" />
            <div className="flex items-end justify-between">
              <span className="pb-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-white/35">Total</span>
              <span className="font-display text-[22px] leading-none text-champagne">
                <AnimatedTotal value={total} />
              </span>
            </div>
          </div>
        )}

        <p className="mt-3 flex items-center gap-1.5 pb-3 text-[8px] leading-relaxed text-white/25">
          <Check className="h-2.5 w-2.5 shrink-0 text-turquoise/60" />
          Free cancellation up to 24 hours before the performance · {availableTotal.toLocaleString()} seats on sale
        </p>
      </div>

      <div className={`shrink-0 border-t border-white/[0.06] bg-[#0d0c10]/75 backdrop-blur-xl ${compact ? 'p-3.5' : 'p-4'}`}>
        <div className="flex gap-2">
          <button
            onClick={() => lastSelectedId && viewFromSeat(lastSelectedId)}
            disabled={!lastSelectedId}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors focus-ring ${
              lastSelectedId
                ? 'border-gold/30 bg-gold/[0.07] text-gold hover:bg-gold/15'
                : 'border-white/[0.06] bg-white/[0.02] text-white/20'
            }`}
            aria-label="View from selected seat"
            title="View from seat"
          >
            <Eye className="h-4 w-4" strokeWidth={1.6} />
          </button>
          <button
            onClick={handleCheckout}
            disabled={selectedSeats.length === 0}
            className="btn-gold group flex h-11 flex-1 items-center justify-between gap-2 rounded-xl px-4 text-[10px] font-bold uppercase tracking-[0.13em]"
          >
            <span>{selectedSeats.length ? 'Continue to checkout' : 'Select a seat'}</span>
            {selectedSeats.length > 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="hidden font-display text-[13px] normal-case tracking-normal opacity-70 sm:inline">
                  {formatUZS(total).replace(' UZS', '')}
                </span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            ) : (
              <Armchair className="h-3.5 w-3.5 opacity-40" />
            )}
          </button>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[8px] text-white/25">
          <span className="flex items-center gap-1.5">
            <LockKeyhole className="h-2.5 w-2.5" />
            Secure checkout
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-2.5 w-2.5 text-turquoise/50" />
            Official box office
          </span>
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const mode = useBookingStore((s) => s.cameraMode)

  return (
    <AnimatePresence>
      {mode !== 'seat' && (
        <motion.aside
          key="sidebar"
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 28 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel fixed bottom-4 right-4 top-[86px] z-20 hidden w-[390px] flex-col overflow-hidden rounded-[26px] lg:flex xl:right-6 xl:top-[92px] xl:w-[404px]"
        >
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
          <BookingPanelContent />
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
