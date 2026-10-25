import { SEAT_COUNT, SECTION_META, formatUZS } from '../../data/hall'
import { useBookingStore } from '../../store/bookingStore'

const CX = 120
const CY = 22

function polar(radius: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180
  return [CX + Math.cos(a) * radius, CY + Math.sin(a) * radius]
}

function annulus(inner: number, outer: number, a1: number, a2: number) {
  const [ox1, oy1] = polar(outer, a1)
  const [ox2, oy2] = polar(outer, a2)
  const [ix2, iy2] = polar(inner, a2)
  const [ix1, iy1] = polar(inner, a1)
  return `M ${ox1} ${oy1} A ${outer} ${outer} 0 0 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${inner} ${inner} 0 0 0 ${ix1} ${iy1} Z`
}

function arcLine(radius: number, a1: number, a2: number) {
  const [x1, y1] = polar(radius, a1)
  const [x2, y2] = polar(radius, a2)
  return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`
}

const seatDots = [46, 58, 70, 82].flatMap((radius, ring) =>
  Array.from({ length: 9 }, (_, i) => {
    const angle = 33 + (i * 114) / 8
    const [x, y] = polar(radius, angle)
    return { x, y, key: `${ring}-${i}` }
  }),
)

export function HallPlan() {
  const purchasedCount = useBookingStore((s) => s.purchasedIds.length)
  const available = SEAT_COUNT - (SECTION_META.reduce((sum, s) => sum + (s.total - s.available), 0) + purchasedCount)

  return (
    <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0b0f]/70">
      <div className="pointer-events-none absolute inset-0 checker opacity-[0.35]" />
      <svg viewBox="0 0 240 122" className="relative w-full" role="img" aria-label="Top-down plan of the Grand Auditorium">
        <defs>
          <linearGradient id="planStage" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7f6126" />
            <stop offset="0.5" stopColor="#e0c078" />
            <stop offset="1" stopColor="#8a6b2b" />
          </linearGradient>
          <radialGradient id="planGlow" cx="50%" cy="20%" r="80%">
            <stop offset="0" stopColor="#d4af37" stopOpacity="0.12" />
            <stop offset="1" stopColor="#d4af37" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="0" y="0" width="240" height="122" fill="url(#planGlow)" />

        {/* tier 1 — rear balcony */}
        <path d={annulus(82, 94, 14, 166)} fill="#8b5e5e" fillOpacity="0.26" stroke="#b58a70" strokeOpacity="0.5" strokeWidth="0.7" />
        {/* parterre */}
        <path d={annulus(38, 81, 17, 163)} fill="#7a1428" fillOpacity="0.4" stroke="#b97786" strokeOpacity="0.45" strokeWidth="0.7" />
        {/* VIP */}
        <path d={annulus(38, 56, 68, 112)} fill="#d4af37" fillOpacity="0.28" stroke="#e1c26e" strokeOpacity="0.8" strokeWidth="0.8" />
        {/* side balconies */}
        <path d={annulus(54, 92, 8, 22)} fill="#4fd1c5" fillOpacity="0.17" stroke="#4fd1c5" strokeOpacity="0.45" strokeWidth="0.7" />
        <path d={annulus(54, 92, 158, 172)} fill="#4fd1c5" fillOpacity="0.17" stroke="#4fd1c5" strokeOpacity="0.45" strokeWidth="0.7" />

        {/* radial aisles */}
        <path d={arcLine(80, 66, 66)} stroke="none" />
        {[65, 115].map((angle) => {
          const [x1, y1] = polar(38, angle)
          const [x2, y2] = polar(80, angle)
          return (
            <line
              key={angle}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#0b0b0e"
              strokeWidth="2.2"
              strokeOpacity="0.9"
            />
          )
        })}

        {/* seat sparkle */}
        {seatDots.map((dot) => (
          <circle key={dot.key} cx={dot.x} cy={dot.y} r="0.72" fill="#efe0bd" fillOpacity="0.36" />
        ))}

        {/* stage */}
        <rect x="87" y="6" width="66" height="13" rx="2.5" fill="url(#planStage)" />
        <rect x="87" y="6" width="66" height="13" rx="2.5" fill="none" stroke="#f2dda2" strokeOpacity="0.45" />
        <text x="120" y="14.4" textAnchor="middle" fontSize="5.2" letterSpacing="1.5" fill="#1b1408" fontWeight="700">
          STAGE
        </text>

        <text x="120" y="76" textAnchor="middle" fontSize="4.8" letterSpacing="1.4" fill="#ecd9a7" fillOpacity="0.8">
          PARTERRE
        </text>
        <text x="120" y="54" textAnchor="middle" fontSize="4.2" letterSpacing="1.5" fill="#fff1c3" fillOpacity="0.85">
          VIP
        </text>
        <text x="120" y="91" textAnchor="middle" fontSize="4.1" letterSpacing="1.5" fill="#e2c1b6" fillOpacity="0.65">
          TIER 1
        </text>
        <text x="33" y="90" textAnchor="middle" fontSize="3.8" letterSpacing="1" fill="#4fd1c5" fillOpacity="0.75" transform="rotate(-66 33 90)">
          SIDE BOXES
        </text>
        <text x="207" y="90" textAnchor="middle" fontSize="3.8" letterSpacing="1" fill="#4fd1c5" fillOpacity="0.75" transform="rotate(66 207 90)">
          SIDE BOXES
        </text>

        {/* stage light beams */}
        <path d="M104 20 L96 32 M120 20 L120 32 M136 20 L144 32" stroke="#e9cc8a" strokeOpacity="0.25" strokeWidth="0.5" strokeDasharray="1 2" />
      </svg>

      <div className="relative flex items-center justify-between border-t border-white/[0.06] px-3 py-2">
        <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/35">
          Grand Auditorium · {SEAT_COUNT.toLocaleString()} seats
        </span>
        <span className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-turquoise/80">
          <span className="h-1 w-1 rounded-full bg-turquoise" />
          {available.toLocaleString()} available
        </span>
      </div>
    </div>
  )
}

const legend = [
  { label: 'Available', color: '#8e1b31', ring: '#a7465a' },
  { label: 'Selected', color: '#d4af37', ring: '#f1dda4', glow: true },
  { label: 'Booked', color: '#2c2a30', ring: '#4a474e' },
  { label: 'VIP', color: '#7a1626', ring: '#d4af37' },
]

export function SeatLegend() {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {legend.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.045] bg-white/[0.018] px-2 py-2"
        >
          <span
            className="relative h-2.5 w-2.5 shrink-0 rounded-[3px]"
            style={{
              background: item.color,
              boxShadow: item.glow
                ? `0 0 8px 1px ${item.color}99`
                : `inset 0 0 0 1px ${item.ring}`,
            }}
          />
          <span className="truncate text-[8.5px] font-medium uppercase tracking-[0.08em] text-white/45">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

export function SectionAvailability() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      {SECTION_META.map((section) => (
        <div key={section.id} className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: section.color }} />
            <span className="truncate text-[9px] text-white/40">{section.name}</span>
          </span>
          <span className="shrink-0 font-display text-[11px] text-white/55">
            {formatUZS(section.price).replace(' UZS', '')}
          </span>
        </div>
      ))}
    </div>
  )
}
