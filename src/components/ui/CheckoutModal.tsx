import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarPlus,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Ticket,
  User,
  Wallet,
  X,
} from 'lucide-react'
import { EVENT, formatUZS } from '../../data/hall'
import {
  type PaymentMethod,
  useBookingStore,
  useCartTotal,
  useSelectedSeats,
} from '../../store/bookingStore'

function buildQrMatrix(seed: string, size = 21): boolean[] {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const rand = () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return (h >>> 0) / 4294967296
  }
  const cells = new Array(size * size).fill(false)
  const finderOrigins: [number, number][] = [
    [0, 0],
    [size - 7, 0],
    [0, size - 7],
  ]
  const inFinder = (x: number, y: number) =>
    finderOrigins.find(([ox, oy]) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const finder = inFinder(x, y)
      if (finder) {
        const lx = x - finder[0]
        const ly = y - finder[1]
        const edge = lx === 0 || lx === 6 || ly === 0 || ly === 6
        const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4
        cells[y * size + x] = edge || core
        continue
      }
      // leave a quiet gap around finder patterns
      const nearFinder = finderOrigins.some(
        ([ox, oy]) => x >= ox - 1 && x <= ox + 7 && y >= oy - 1 && y <= oy + 7,
      )
      cells[y * size + x] = nearFinder ? false : rand() > 0.54
    }
  }
  return cells
}

function QrCode({ seed }: { seed: string }) {
  const cells = useMemo(() => buildQrMatrix(seed), [seed])
  return (
    <div className="rounded-lg bg-[#f4ecda] p-2" aria-hidden>
      <div
        className="grid h-[92px] w-[92px] gap-px"
        style={{ gridTemplateColumns: 'repeat(21, minmax(0, 1fr))' }}
      >
        {cells.map((on, i) => (
          <span key={i} className={on ? 'bg-[#16120b]' : 'bg-transparent'} />
        ))}
      </div>
    </div>
  )
}

function StepRail() {
  const step = useBookingStore((s) => s.checkoutStep)
  const steps = [
    { id: 'details', label: 'Details' },
    { id: 'payment', label: 'Payment' },
    { id: 'success', label: 'Confirmed' },
  ] as const
  const currentIndex = steps.findIndex((s) => s.id === step)

  return (
    <div className="flex items-center gap-2.5">
      {steps.map((s, i) => {
        const done = i < currentIndex
        const active = i === currentIndex
        return (
          <div key={s.id} className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border text-[8px] font-bold transition-colors ${
                  done
                    ? 'border-gold/50 bg-gold/15 text-gold'
                    : active
                      ? 'border-gold/60 bg-gold text-[#171204]'
                      : 'border-white/10 bg-white/[0.02] text-white/25'
                }`}
              >
                {done ? <Check className="h-2.5 w-2.5" /> : i + 1}
              </span>
              <span
                className={`text-[8px] font-semibold uppercase tracking-[0.14em] ${
                  active ? 'text-white/70' : done ? 'text-gold/60' : 'text-white/22'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && <span className="h-px w-5 bg-white/10" />}
          </div>
        )
      })}
    </div>
  )
}

function OrderSummary() {
  const selectedSeats = useSelectedSeats()
  const total = useCartTotal()

  return (
    <aside className="hidden min-h-0 flex-col border-l border-white/[0.06] bg-[#0b0a0e]/50 lg:flex">
      <div className="relative overflow-hidden border-b border-white/[0.06] p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gold/[0.055] blur-2xl" />
        <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-gold/70">Your evening</p>
        <h3 className="mt-2 font-display text-[28px] leading-[0.95] text-[#f6efdf]">
          Simfoniya
          <br />
          <span className="italic text-champagne">Konserti</span>
        </h3>
        <div className="mt-3 space-y-1.5">
          <p className="flex items-center gap-2 text-[9px] text-white/40">
            <MapPin className="h-3 w-3 text-gold/50" /> {EVENT.venue}
          </p>
          <p className="flex items-center gap-2 text-[9px] text-white/40">
            <CalendarPlus className="h-3 w-3 text-gold/50" /> {EVENT.dateLong} · {EVENT.start}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-luxe p-5">
        <div className="flex items-center justify-between">
          <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-white/28">
            Tickets
          </p>
          <span className="rounded-full bg-gold/10 px-2 py-0.5 font-display text-[10px] text-gold">
            {selectedSeats.length}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          {selectedSeats.map((seat) => (
            <div key={seat.id} className="flex items-center justify-between gap-2 border-b border-white/[0.045] pb-2">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-medium text-white/70">{seat.section}</p>
                <p className="mt-0.5 text-[8px] uppercase tracking-[0.1em] text-white/28">
                  Row {seat.row} · Seat {seat.number}
                </p>
              </div>
              <p className="shrink-0 font-display text-[12px] text-white/55">
                {formatUZS(seat.price).replace(' UZS', '')}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-1.5 text-[9px]">
          <div className="flex justify-between text-white/35">
            <span>Subtotal</span>
            <span>{formatUZS(total)}</span>
          </div>
          <div className="flex justify-between text-white/35">
            <span>Booking fee</span>
            <span className="text-turquoise/70">Included</span>
          </div>
          <div className="flex justify-between text-white/35">
            <span>Taxes</span>
            <span>Included</span>
          </div>
        </div>
        <div className="gold-rule my-3 opacity-50" />
        <div className="flex items-end justify-between">
          <span className="pb-1 text-[8px] font-semibold uppercase tracking-[0.18em] text-white/30">Total</span>
          <span className="font-display text-[24px] leading-none text-champagne">{formatUZS(total)}</span>
        </div>
      </div>

      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-2 text-[8px] text-white/25">
          <ShieldCheck className="h-3 w-3 text-turquoise/50" />
          Official box office · Secure encrypted checkout
        </div>
      </div>
    </aside>
  )
}

export function CheckoutModal() {
  const open = useBookingStore((s) => s.checkoutOpen)
  const step = useBookingStore((s) => s.checkoutStep)
  const booking = useBookingStore((s) => s.booking)
  const bookingRef = useBookingStore((s) => s.bookingRef)
  const updateBooking = useBookingStore((s) => s.updateBooking)
  const setStep = useBookingStore((s) => s.setCheckoutStep)
  const closeCheckout = useBookingStore((s) => s.closeCheckout)
  const finishBooking = useBookingStore((s) => s.finishBooking)
  const completeBooking = useBookingStore((s) => s.completeBooking)
  const selectedSeats = useSelectedSeats()
  const total = useCartTotal()

  const [touched, setTouched] = useState(false)
  const [processing, setProcessing] = useState(false)
  const timerRef = useRef<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [step])

  useEffect(() => {
    if (!open) {
      setTouched(false)
      setProcessing(false)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !processing) handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, processing, step])

  const phoneDigits = booking.phone.replace(/\D/g, '')
  const emailOk = !booking.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(booking.email.trim())
  const nameOk = booking.name.trim().length >= 2
  const phoneOk = phoneDigits.length >= 9
  const cardDigits = booking.cardNumber.replace(/\D/g, '')
  const cardOk = cardDigits.length >= 16
  const expiryOk = /^(0[1-9]|1[0-2])\/\d{2}$/.test(booking.cardExpiry)
  const cardNameOk = booking.cardName.trim().length >= 2
  const paymentOk = booking.method !== 'card' || (cardOk && expiryOk && cardNameOk)

  const detailsValid = nameOk && phoneOk && emailOk

  const handleClose = () => {
    if (processing) return
    if (step === 'success') finishBooking()
    else closeCheckout()
  }

  const continueToPayment = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!detailsValid) return
    setTouched(false)
    setStep('payment')
  }

  const payNow = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!paymentOk || processing) return
    setProcessing(true)
    timerRef.current = window.setTimeout(() => {
      completeBooking()
      setProcessing(false)
    }, 1600)
  }

  const addToCalendar = () => {
    const seats = selectedSeats.map((s) => `${s.section} R${s.row} S${s.number}`).join(', ')
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Istiqlol Sanat Saroyi//Concert Hall//EN',
      'BEGIN:VEVENT',
      'UID:' + (bookingRef ?? 'ISTIQLOL') + '@concert-hall.uz',
      'DTSTAMP:20261001T090000Z',
      'DTSTART:20261026T140000Z',
      'DTEND:20261026T161500Z',
      'SUMMARY:Simfoniya Konserti — Istiqlol San\'at Saroyi',
      `LOCATION:${EVENT.venue}\\, Tashkent\\, Uzbekistan`,
      `DESCRIPTION:${EVENT.programme}. Seats: ${seats}. Booking: ${bookingRef ?? ''}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `istiqlol-${bookingRef ?? 'ticket'}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyRef = async () => {
    if (!bookingRef) return
    try {
      await navigator.clipboard.writeText(bookingRef)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard may be unavailable */
    }
  }

  const startPayment = (method: PaymentMethod) => updateBooking({ method })

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="checkout-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleClose()
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Checkout"
            initial={{ opacity: 0, y: 30, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.99 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="glass-panel relative flex h-[93dvh] w-full max-w-[980px] flex-col overflow-hidden rounded-t-[26px] sm:h-auto sm:max-h-[90dvh] sm:rounded-[26px]"
          >
            <div className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-gold/55 to-transparent" />

            <header className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3.5 sm:px-6 sm:py-4">
              <div className="flex items-center gap-3">
                <div className="hidden h-9 w-9 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.06] sm:flex">
                  <LockKeyhole className="h-3.5 w-3.5 text-gold" strokeWidth={1.6} />
                </div>
                <div>
                  <p className="text-[7.5px] font-semibold uppercase tracking-[0.22em] text-gold/70">
                    Secure checkout
                  </p>
                  <p className="mt-0.5 font-display text-[17px] leading-none text-white/90">
                    {step === 'success' ? 'Your tickets are confirmed' : EVENT.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="hidden sm:block">
                  <StepRail />
                </div>
                <button
                  onClick={handleClose}
                  disabled={processing}
                  className="icon-btn h-9 w-9 rounded-full disabled:opacity-30"
                  aria-label="Close checkout"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 lg:grid-cols-[1fr_318px]">
              <div className="flex min-h-0 flex-col">
                <div ref={scrollRef} className="scrollbar-luxe min-h-0 flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {step === 'details' && (
                      <motion.form
                        key="details"
                        id="checkout-details"
                        onSubmit={continueToPayment}
                        initial={{ opacity: 0, x: 14 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -14 }}
                        transition={{ duration: 0.24 }}
                        className="p-4 sm:p-6"
                        noValidate
                      >
                        <div className="sm:hidden">
                          <StepRail />
                        </div>
                        <p className="mt-4 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/28 sm:mt-0">
                          Step 01 — Guest details
                        </p>
                        <h2 className="mt-2 font-display text-[27px] font-medium leading-tight text-[#f5eddd]">
                          Who is attending?
                        </h2>
                        <p className="mt-1.5 max-w-md text-[10px] leading-relaxed text-white/35">
                          E-tickets and your booking confirmation will be issued to these details.
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label htmlFor="full-name" className="label">
                              Full name
                            </label>
                            <div className="relative">
                              <User className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/22" />
                              <input
                                id="full-name"
                                className="field pl-10"
                                placeholder="e.g. Aziza Karimova"
                                autoComplete="name"
                                value={booking.name}
                                onChange={(e) => updateBooking({ name: e.target.value })}
                                aria-invalid={touched && !nameOk}
                              />
                            </div>
                            {touched && !nameOk && (
                              <p className="mt-1.5 text-[9px] text-rose-300/80">Please enter your full name.</p>
                            )}
                          </div>

                          <div>
                            <label htmlFor="phone" className="label">
                              Phone number
                            </label>
                            <div className="relative">
                              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/22" />
                              <input
                                id="phone"
                                type="tel"
                                inputMode="tel"
                                className="field pl-10"
                                placeholder="+998 90 123 45 67"
                                autoComplete="tel"
                                value={booking.phone}
                                onChange={(e) =>
                                  updateBooking({ phone: e.target.value.replace(/[^\d+ ]/g, '') })
                                }
                                aria-invalid={touched && !phoneOk}
                              />
                            </div>
                            {touched && !phoneOk && (
                              <p className="mt-1.5 text-[9px] text-rose-300/80">Enter a valid phone number.</p>
                            )}
                          </div>

                          <div>
                            <label htmlFor="email" className="label">
                              Email <span className="normal-case tracking-normal text-white/20">(optional)</span>
                            </label>
                            <div className="relative">
                              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/22" />
                              <input
                                id="email"
                                type="email"
                                className="field pl-10"
                                placeholder="you@example.com"
                                autoComplete="email"
                                value={booking.email}
                                onChange={(e) => updateBooking({ email: e.target.value })}
                                aria-invalid={touched && !emailOk}
                              />
                            </div>
                            {touched && !emailOk && (
                              <p className="mt-1.5 text-[9px] text-rose-300/80">Enter a valid email address.</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                          <div className="flex items-start gap-2.5">
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-turquoise/65" strokeWidth={1.5} />
                            <p className="text-[9px] leading-relaxed text-white/32">
                              Your details are used only for this reservation. No account is required and no
                              payment will be taken in this demonstration.
                            </p>
                          </div>
                        </div>
                      </motion.form>
                    )}

                    {step === 'payment' && (
                      <motion.form
                        key="payment"
                        id="checkout-payment"
                        onSubmit={payNow}
                        initial={{ opacity: 0, x: 14 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -14 }}
                        transition={{ duration: 0.24 }}
                        className="p-4 sm:p-6"
                        noValidate
                      >
                        <div className="sm:hidden">
                          <StepRail />
                        </div>
                        <p className="mt-4 text-[8px] font-semibold uppercase tracking-[0.22em] text-white/28 sm:mt-0">
                          Step 02 — Payment
                        </p>
                        <h2 className="mt-2 font-display text-[27px] font-medium leading-tight text-[#f5eddd]">
                          Choose how to pay
                        </h2>
                        <p className="mt-1.5 text-[10px] text-white/35">
                          All transactions are simulated securely for this demo.
                        </p>

                        <div className="mt-5 grid grid-cols-3 gap-2">
                          {(
                            [
                              { id: 'click', label: 'Click', icon: Wallet, sub: 'Instant' },
                              { id: 'payme', label: 'Payme', icon: Smartphone, sub: 'Instant' },
                              { id: 'card', label: 'Card', icon: CreditCard, sub: 'Uzcard / Humo' },
                            ] as const
                          ).map((method) => {
                            const active = booking.method === method.id
                            const Icon = method.icon
                            return (
                              <button
                                key={method.id}
                                type="button"
                                onClick={() => startPayment(method.id)}
                                className={`relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${
                                  active
                                    ? 'border-gold/50 bg-gold/[0.07] shadow-[0_0_0_1px_rgba(212,175,55,0.12)]'
                                    : 'border-white/[0.07] bg-white/[0.018] hover:border-white/15'
                                }`}
                                aria-pressed={active}
                              >
                                <Icon
                                  className={`h-4 w-4 ${active ? 'text-gold' : 'text-white/35'}`}
                                  strokeWidth={1.5}
                                />
                                <div>
                                  <p className={`text-[10px] font-semibold ${active ? 'text-white/85' : 'text-white/50'}`}>
                                    {method.label}
                                  </p>
                                  <p className="mt-0.5 text-[7.5px] uppercase tracking-[0.08em] text-white/25">
                                    {method.sub}
                                  </p>
                                </div>
                                {active && (
                                  <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[#171204]">
                                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                                  </span>
                                )}
                              </button>
                            )
                          })}
                        </div>

                        {booking.method === 'card' ? (
                          <div className="mt-4 space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.018] p-3.5">
                            <div>
                              <label htmlFor="card-number" className="label">
                                Card number
                              </label>
                              <div className="relative">
                                <CreditCard className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/22" />
                                <input
                                  id="card-number"
                                  inputMode="numeric"
                                  className="field pl-10 tracking-[0.08em]"
                                  placeholder="8600 0000 0000 0000"
                                  value={booking.cardNumber}
                                  onChange={(e) => {
                                    const digits = e.target.value.replace(/\D/g, '').slice(0, 16)
                                    const formatted = digits.replace(/(.{4})/g, '$1 ').trim()
                                    updateBooking({ cardNumber: formatted })
                                  }}
                                  aria-invalid={touched && !cardOk}
                                />
                              </div>
                              {touched && !cardOk && (
                                <p className="mt-1.5 text-[9px] text-rose-300/80">Enter a 16-digit card number.</p>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label htmlFor="expiry" className="label">
                                  Expiry
                                </label>
                                <input
                                  id="expiry"
                                  inputMode="numeric"
                                  className="field"
                                  placeholder="MM/YY"
                                  value={booking.cardExpiry}
                                  onChange={(e) => {
                                    let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                                    if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`
                                    updateBooking({ cardExpiry: v })
                                  }}
                                  aria-invalid={touched && !expiryOk}
                                />
                              </div>
                              <div>
                                <label htmlFor="card-name" className="label">
                                  Name on card
                                </label>
                                <input
                                  id="card-name"
                                  className="field"
                                  placeholder="A. KARIMOVA"
                                  value={booking.cardName}
                                  onChange={(e) => updateBooking({ cardName: e.target.value.toUpperCase() })}
                                  aria-invalid={touched && !cardNameOk}
                                />
                              </div>
                            </div>
                            {touched && (!expiryOk || !cardNameOk) && (
                              <p className="text-[9px] text-rose-300/80">Complete the expiry date and cardholder name.</p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-4 flex items-start gap-3 rounded-xl border border-gold/15 bg-gold/[0.04] p-3.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10">
                              {booking.method === 'click' ? (
                                <Wallet className="h-4 w-4 text-gold/80" />
                              ) : (
                                <Smartphone className="h-4 w-4 text-gold/80" />
                              )}
                            </div>
                            <div>
                              <p className="text-[10px] font-medium text-white/65">
                                {booking.method === 'click' ? 'Click' : 'Payme'} payment simulation
                              </p>
                              <p className="mt-1 text-[9px] leading-relaxed text-white/32">
                                You will normally confirm the {formatUZS(total)} payment in the{' '}
                                {booking.method === 'click' ? 'Click' : 'Payme'} app. This demo completes the
                                booking instantly.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex items-center gap-2 text-[8px] text-white/22">
                          <LockKeyhole className="h-3 w-3" />
                          This is a demo checkout. No card is charged.
                        </div>
                      </motion.form>
                    )}

                    {step === 'success' && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="p-4 sm:p-6"
                      >
                        <div className="sm:hidden">
                          <StepRail />
                        </div>
                        <div className="mt-4 flex items-start gap-4 sm:mt-0">
                          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/[0.08]">
                            <CheckCircle2 className="h-6 w-6 text-gold" strokeWidth={1.4} />
                            <span className="absolute inset-0 animate-ping rounded-full border border-gold/20" />
                          </div>
                          <div>
                            <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-gold/70">
                              Step 03 — Confirmed
                            </p>
                            <h2 className="mt-1.5 font-display text-[28px] leading-tight text-[#f6efdf]">
                              See you at the symphony,{' '}
                              <span className="italic text-champagne">{booking.name.split(' ')[0] || 'guest'}</span>.
                            </h2>
                            <p className="mt-1 text-[10px] text-white/35">
                              Your e-tickets are reserved. Present the QR code at the entrance.
                            </p>
                          </div>
                        </div>

                        <div className="relative mt-5 overflow-hidden rounded-2xl border border-gold/25 bg-[linear-gradient(135deg,rgba(48,38,24,0.7),rgba(18,15,13,0.8))]">
                          <div className="pointer-events-none absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#0c0b0f]" />
                          <div className="pointer-events-none absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#0c0b0f]" />
                          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
                            <div>
                              <p className="text-[7px] font-semibold uppercase tracking-[0.24em] text-gold/65">
                                Admit one · e-ticket
                              </p>
                              <p className="mt-1 font-display text-[19px] leading-none text-champagne">
                                Simfoniya Konserti
                              </p>
                            </div>
                            <BadgeCheck className="h-5 w-5 text-gold/80" strokeWidth={1.4} />
                          </div>
                          <div className="flex gap-4 p-4">
                            <QrCode seed={bookingRef ?? 'ISTIQLOL-2026'} />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[9px] text-white/45">
                                <span className="flex items-center gap-1">
                                  <CalendarPlus className="h-3 w-3 text-gold/50" />
                                  {EVENT.dateLong}
                                </span>
                                <span>{EVENT.start}</span>
                              </div>
                              <p className="mt-1.5 flex items-center gap-1 text-[9px] text-white/35">
                                <MapPin className="h-3 w-3 text-gold/50" />
                                {EVENT.venue}, Tashkent
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {selectedSeats.map((seat) => (
                                  <span
                                    key={seat.id}
                                    className="rounded border border-gold/15 bg-gold/[0.06] px-1.5 py-0.5 text-[7px] uppercase tracking-[0.08em] text-champagne/75"
                                  >
                                    {seat.section} · R{seat.row} S{seat.number}
                                  </span>
                                ))}
                              </div>
                              <div className="mt-2.5 flex items-center gap-2 text-[8px] text-white/30">
                                <span className="uppercase tracking-[0.14em]">Booking ref</span>
                                <button
                                  onClick={copyRef}
                                  className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[8px] tracking-wider text-white/60 transition-colors hover:text-gold"
                                  title="Copy booking reference"
                                >
                                  {copied ? 'Copied' : bookingRef}
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="ornament-line mx-4 h-px opacity-30" />
                          <div className="flex items-center justify-between px-4 py-2.5">
                            <span className="text-[7px] uppercase tracking-[0.18em] text-white/25">
                              {selectedSeats.length} ticket{selectedSeats.length > 1 ? 's' : ''} · {booking.name}
                            </span>
                            <span className="font-display text-[13px] text-champagne">{formatUZS(total)}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={addToCalendar}
                            className="flex h-10 items-center gap-2 rounded-lg border border-gold/30 bg-gold/[0.07] px-3.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-gold transition-colors hover:bg-gold/15"
                          >
                            <CalendarPlus className="h-3.5 w-3.5" />
                            Add to calendar
                          </button>
                          <button
                            onClick={finishBooking}
                            className="btn-gold flex h-10 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-[9px] font-bold uppercase tracking-[0.12em]"
                          >
                            Return to the hall
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-3 flex items-center gap-1.5 text-[8px] text-white/22">
                          <Ticket className="h-2.5 w-2.5" />
                          A confirmation would normally be sent to {booking.email || booking.phone}. This is a
                          demonstration.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {step !== 'success' && (
                  <div className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.06] bg-[#0c0b0f]/65 px-4 py-3.5 sm:px-6">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTouched(false)
                          if (step === 'payment') setStep('details')
                          else closeCheckout()
                        }}
                        className="flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-white/35 transition-colors hover:text-white/70"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back
                      </button>
                      <div className="hidden items-center gap-1.5 text-[8px] text-white/20 sm:flex">
                        <LockKeyhole className="h-2.5 w-2.5" />
                        Encrypted
                      </div>
                    </div>
                    {step === 'details' ? (
                      <button
                        type="submit"
                        form="checkout-details"
                        className="btn-gold flex h-10 items-center gap-2 rounded-lg px-4 text-[9px] font-bold uppercase tracking-[0.12em]"
                      >
                        Continue to payment
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        form="checkout-payment"
                        disabled={processing}
                        className="btn-gold flex h-10 min-w-[160px] items-center justify-center gap-2 rounded-lg px-4 text-[9px] font-bold uppercase tracking-[0.12em]"
                      >
                        {processing ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Processing
                          </>
                        ) : (
                          <>
                            <LockKeyhole className="h-3.5 w-3.5" />
                            Pay {formatUZS(total).replace(' UZS', '')}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <OrderSummary />
            </div>

            {step !== 'success' && (
              <div className="flex shrink-0 items-center justify-between border-t border-white/[0.05] px-4 py-2 lg:hidden">
                <span className="text-[8px] uppercase tracking-[0.14em] text-white/25">
                  {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''}
                </span>
                <span className="font-display text-[16px] text-champagne">{formatUZS(total)}</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
