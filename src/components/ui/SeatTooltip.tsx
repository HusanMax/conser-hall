import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Armchair, Ban, Check, MousePointerClick } from 'lucide-react'
import { SEAT_MAP, formatUZS } from '../../data/hall'
import { useBookingStore } from '../../store/bookingStore'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

const TOOLTIP_WIDTH = 252

export function SeatTooltip() {
  const hoveredId = useBookingStore((s) => s.hoveredId)
  const cameraMode = useBookingStore((s) => s.cameraMode)
  const selectedIds = useBookingStore((s) => s.selectedIds)
  const purchasedIds = useBookingStore((s) => s.purchasedIds)
  const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
  const [pos, setPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!finePointer) return
    const move = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [finePointer])

  const seat = hoveredId ? SEAT_MAP.get(hoveredId) : undefined
  const location = seat
    ? seat.section === 'Parterre'
      ? `${seat.zone} · ${seat.block}`
      : seat.zone
    : ''
  const visible = Boolean(seat) && finePointer && cameraMode !== 'seat'
  const selected = seat ? selectedIds.includes(seat.id) : false
  const unavailable = seat ? seat.booked || purchasedIds.includes(seat.id) : false

  const left = Math.min(
    Math.max(12, pos.x + 18),
    (typeof window !== 'undefined' ? window.innerWidth : 1200) - TOOLTIP_WIDTH - 12,
  )
  const top = Math.min(
    Math.max(12, pos.y + 18),
    (typeof window !== 'undefined' ? window.innerHeight : 800) - 190,
  )

  return (
    <AnimatePresence>
      {visible && seat && (
        <motion.div
          key="seat-tooltip"
          initial={{ opacity: 0, scale: 0.96, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
          style={{ left, top, width: TOOLTIP_WIDTH }}
          className="glass-panel pointer-events-none fixed z-[35] overflow-hidden rounded-2xl p-3.5 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.95)]"
        >
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="flex items-center gap-1.5 text-[7.5px] font-semibold uppercase tracking-[0.2em] text-gold/85">
                {seat.section}
                {seat.vip && <span className="rounded-sm bg-gold/15 px-1 py-px text-[6.5px] text-gold">VIP</span>}
              </p>
              <p className="mt-1 font-display text-[21px] leading-none text-[#f7f0e2]">
                Row {seat.row} <span className="text-white/25">/</span> Seat {seat.number}
              </p>
            </div>
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                unavailable
                  ? 'border-white/[0.06] bg-white/[0.02] text-white/20'
                  : selected
                    ? 'border-gold/40 bg-gold/10 text-gold'
                    : 'border-turquoise/25 bg-turquoise/[0.07] text-turquoise/80'
              }`}
            >
              {unavailable ? (
                <Ban className="h-3.5 w-3.5" />
              ) : selected ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Armchair className="h-3.5 w-3.5" />
              )}
            </div>
          </div>

          <div className="gold-rule my-2.5 opacity-60" />

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[7px] font-semibold uppercase tracking-[0.18em] text-white/25">Joylashuv</p>
              <p className="mt-1 line-clamp-2 text-[9.5px] leading-snug text-white/50">{location}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[7px] font-semibold uppercase tracking-[0.18em] text-white/25">Narxi</p>
              <p className="mt-0.5 font-display text-[16px] leading-tight text-champagne">
                {formatUZS(seat.price)}
              </p>
            </div>
          </div>

          <div
            className={`mt-2.5 flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[8px] font-medium uppercase tracking-[0.1em] ${
              unavailable
                ? 'border-white/[0.05] bg-white/[0.02] text-white/25'
                : selected
                  ? 'border-gold/20 bg-gold/[0.055] text-gold/85'
                  : 'border-turquoise/15 bg-turquoise/[0.04] text-turquoise/75'
            }`}
          >
            {unavailable ? (
              <>
                <Ban className="h-2.5 w-2.5" /> Band qilingan
              </>
            ) : selected ? (
              <>
                <Check className="h-2.5 w-2.5" /> Tanlangan · olib tashlash
              </>
            ) : (
              <>
                <MousePointerClick className="h-2.5 w-2.5" /> Mavjud · tanlash
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
