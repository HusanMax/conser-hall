export type HallSection = 'VIP' | 'Parterre' | 'Tier 1' | 'Side Balcony'

export interface Seat {
  /** Stable unique id, e.g. P-12-18 */
  id: string
  section: HallSection
  block: 'Left' | 'Centre' | 'Right'
  row: number
  number: number
  price: number
  booked: boolean
  vip: boolean
  level: number
  /** Seat position in world space (floor of the seat, y = row floor) */
  position: [number, number, number]
  /** Y rotation so that the seat faces the stage */
  yaw: number
  /** Human readable zone name used in the tooltip */
  zone: string
}

export interface SectionSummary {
  id: HallSection
  name: string
  description: string
  price: number
  total: number
  available: number
  color: string
}

export const EVENT = {
  title: 'Simfoniya Konserti',
  venue: "Xalqlar Do'stligi",
  city: "Toshkent, O'zbekiston",
  dateLong: '26 October 2026',
  dateShort: '26 OKT',
  doors: '18:30',
  start: '19:00',
  duration: '2 h 15 min',
  programme: 'Uzbekistan National Symphony Orchestra',
  conductor: 'Alisher Karimov',
  hall: 'Grand Auditorium',
} as const

export const PRICES = {
  VIP: 890_000,
  Parterre: 490_000,
  'Tier 1': 350_000,
  'Side Balcony': 310_000,
} as const

/** The stage-facing focal point all seats point at. */
export const STAGE_FOCUS = { x: 0, y: 1.6, z: -19 } as const

type Rng = () => number
function mulberry32(a: number): Rng {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rng = mulberry32(20261026)

/** Angle (radians) → world position on an arc centred just in front of the stage. */
export function arcPoint(radius: number, angleDeg: number): [number, number] {
  const a = (angleDeg * Math.PI) / 180
  return [Math.sin(a) * radius, -13 + Math.cos(a) * radius]
}

function yawTowardsStage(x: number, z: number): number {
  const dx = STAGE_FOCUS.x - x
  const dz = STAGE_FOCUS.z - z
  // Seat geometry faces local +Z, so align +Z with the direction to the stage.
  return Math.atan2(dx, dz)
}

function sectionForParterre(row: number, angle: number, block: string): HallSection {
  if (row <= 4 && block === 'Centre' && Math.abs(angle) <= 23) return 'VIP'
  return 'Parterre'
}

function priceFor(section: HallSection): number {
  return PRICES[section]
}

const SEAT_PITCH = 0.545
const AISLE_HALF_WIDTH = 0.64

interface RowSpec {
  radius: number
  y: number
  section: HallSection
  level: number
  zone: string
  rows: number
  row: number
  minAngle: number
  maxAngle: number
  aisles: number[]
  prefix: string
  numberFrom?: number
}

function generateRow(spec: RowSpec): Seat[] {
  const { radius, y, minAngle, maxAngle, aisles, section, level, zone, prefix } = spec
  const seats: Seat[] = []
  const totalArc = ((maxAngle - minAngle) * Math.PI * radius) / 180
  const count = Math.floor(totalArc / SEAT_PITCH)
  const ids: number[] = []

  for (let i = 0; i <= count; i++) {
    const t = count === 0 ? 0 : i / count
    const angle = minAngle + (maxAngle - minAngle) * t
    const aRad = (angle * Math.PI) / 180
    const arcMetres = (angle * Math.PI * radius) / 180
    let inAisle = false
    for (const aisle of aisles) {
      const aisleRad = (aisle * Math.PI) / 180
      const aisleMetres = (aisle * Math.PI * radius) / 180
      if (Math.abs(arcMetres - aisleMetres) < AISLE_HALF_WIDTH + 0.13) inAisle = true
    }
    if (inAisle) continue
    // avoid seats exactly at the outer boundary
    if (Math.abs(aRad) > Math.PI) continue
    ids.push(angle)
  }

  ids.forEach((angle, index) => {
    const [x, z] = arcPoint(radius, angle)
    const number = (spec.numberFrom ?? 1) + index
    const centreDistance = Math.abs(angle)
    const block: Seat['block'] =
      centreDistance < 25 ? 'Centre' : angle < 0 ? 'Left' : 'Right'
    const bookedChance = section === 'VIP' ? 0.31 : section === 'Side Balcony' ? 0.16 : 0.2
    const booked = rng() < bookedChance
    const seatSection = section === 'Parterre' ? sectionForParterre(spec.row, angle, block) : section
    const vip = seatSection === 'VIP'
    seats.push({
      id: `${prefix}-${String(spec.row).padStart(2, '0')}-${String(number).padStart(2, '0')}`,
      section: seatSection,
      block,
      row: spec.row,
      number,
      price: priceFor(seatSection),
      booked,
      vip,
      level,
      position: [x, y, z],
      yaw: yawTowardsStage(x, z),
      zone,
    })
  })
  return seats
}

export const SEATS: Seat[] = []

export const PARTERRE_LAYOUT = {
  rows: 24,
  minRadius: 4.9,
  maxRadius: 23.2,
  minAngle: -68,
  maxAngle: 68,
  aisleAngles: [-25.5, 25.5],
  rowRadius: (row: number) => 4.9 + (row / 23) * (23.2 - 4.9),
  rowY: (row: number) => 0.28 + row * 0.148,
}

export const TIER1_LAYOUT = [
  { startRadius: 25.4, baseY: 6.55, rows: 4, angle: 44, level: 1, rowOffset: 0, zone: 'Tier 1 · Grand Balcony' },
  { startRadius: 28.1, baseY: 9.75, rows: 3, angle: 34, level: 2, rowOffset: 4, zone: 'Tier 1 · Upper Balcony' },
] as const

export const SIDE_TIER_LAYOUT = [
  { y: 4.25, level: 1, radius: 24.9, rows: 2, startAngle: 47, endAngle: 82 },
  { y: 7.05, level: 2, radius: 25.6, rows: 2, startAngle: 48, endAngle: 84 },
  { y: 9.85, level: 3, radius: 26.3, rows: 2, startAngle: 49, endAngle: 86 },
] as const

/* ------------------------------------------------------------------ */
/* PARTERRE — a sweeping fan of 24 rows, split by two radial aisles.   */
/* ------------------------------------------------------------------ */
{
  const rows = PARTERRE_LAYOUT.rows
  for (let r = 0; r < rows; r++) {
    SEATS.push(
      ...generateRow({
        radius: PARTERRE_LAYOUT.rowRadius(r),
        y: PARTERRE_LAYOUT.rowY(r),
        section: 'Parterre',
        level: 0,
        zone: 'Parterre',
        row: r + 1,
        rows,
        minAngle: PARTERRE_LAYOUT.minAngle,
        maxAngle: PARTERRE_LAYOUT.maxAngle,
        aisles: PARTERRE_LAYOUT.aisleAngles,
        prefix: 'P',
      }),
    )
  }
}

/* ------------------------------------------------------------------ */
/* TIER 1 — two rear balcony tiers, gently stepped.                    */
/* ------------------------------------------------------------------ */
{
  for (const tier of TIER1_LAYOUT) {
    for (let r = 0; r < tier.rows; r++) {
      SEATS.push(
        ...generateRow({
          radius: tier.startRadius + r * 0.78,
          y: tier.baseY + r * 0.19,
          section: 'Tier 1',
          level: tier.level,
          zone: tier.zone,
          row: tier.rowOffset + r + 1,
          rows: tier.rows,
          minAngle: -tier.angle,
          maxAngle: tier.angle,
          aisles: [-0.8, 15.5, -15.5],
          prefix: tier.level === 1 ? 'T1' : 'T2',
        }),
      )
    }
  }
}

/* ------------------------------------------------------------------ */
/* SIDE BALCONIES — three tiers of boxes along each curved side wall.  */
/* ------------------------------------------------------------------ */
{
  for (const tier of SIDE_TIER_LAYOUT) {
    for (let r = 0; r < tier.rows; r++) {
      for (const side of [-1, 1]) {
        const angleA = side * tier.startAngle
        const angleB = side * tier.endAngle
        SEATS.push(
          ...generateRow({
            radius: tier.radius + r * 0.8,
            y: tier.y + r * 0.18,
            section: 'Side Balcony',
            level: tier.level,
            zone: `Side Balcony · ${side < 0 ? 'West' : 'East'} · Tier ${tier.level}`,
            row: (tier.level - 1) * 2 + r + 1,
            rows: tier.rows,
            minAngle: Math.min(angleA, angleB),
            maxAngle: Math.max(angleA, angleB),
            aisles: [side * ((tier.startAngle + tier.endAngle) / 2)],
            prefix: side < 0 ? 'SL' : 'SR',
          }),
        )
      }
    }
  }
}

export const SEAT_MAP = new Map(SEATS.map((s) => [s.id, s]))

export const SEAT_COUNT = SEATS.length
export const BOOKED_COUNT = SEATS.filter((s) => s.booked).length

export const SECTION_META: SectionSummary[] = [
  {
    id: 'VIP',
    name: 'VIP',
    description: 'Front centre, closest to the orchestra',
    price: PRICES.VIP,
    total: 0,
    available: 0,
    color: '#E8C56B',
  },
  {
    id: 'Parterre',
    name: 'Parterre',
    description: 'The Grand stalls — full stage perspective',
    price: PRICES.Parterre,
    total: 0,
    available: 0,
    color: '#8E1B31',
  },
  {
    id: 'Tier 1',
    name: 'Tier 1',
    description: 'Rear balcony with a complete hall view',
    price: PRICES['Tier 1'],
    total: 0,
    available: 0,
    color: '#A45A5A',
  },
  {
    id: 'Side Balcony',
    name: 'Side Balcony',
    description: 'Intimate boxes in three tiers',
    price: PRICES['Side Balcony'],
    total: 0,
    available: 0,
    color: '#4FD1C5',
  },
]

for (const section of SECTION_META) {
  const inSection = SEATS.filter((s) => s.section === section.id)
  section.total = inSection.length
  section.available = inSection.filter((s) => !s.booked).length
}

export function formatUZS(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount).replace(/,/g, ' ') + ' UZS'
}

export function formatSeatLabel(seat: Seat): string {
  return `${seat.section} · Row ${seat.row} · Seat ${seat.number}`
}
