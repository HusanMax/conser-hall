import { create } from 'zustand'
import { SEAT_MAP, type Seat } from '../data/hall'

export type CameraMode = 'overview' | 'stage' | 'seat'
export type CheckoutStep = 'details' | 'payment' | 'success'
export type PaymentMethod = 'click' | 'payme' | 'card'

export interface BookingDraft {
  name: string
  phone: string
  email: string
  method: PaymentMethod
  cardNumber: string
  cardExpiry: string
  cardName: string
}

interface BookingState {
  selectedIds: string[]
  purchasedIds: string[]
  hoveredId: string | null
  lastSelectedId: string | null
  cameraMode: CameraMode
  viewSeatId: string | null
  cameraEpoch: number
  isTransitioning: boolean
  checkoutOpen: boolean
  checkoutStep: CheckoutStep
  mobilePanelOpen: boolean
  toast: { id: number; message: string; tone: 'gold' | 'error' } | null
  booking: BookingDraft
  bookingRef: string | null
  toggleSeat: (id: string) => void
  removeSeat: (id: string) => void
  clearSeats: () => void
  setHovered: (id: string | null) => void
  viewFromSeat: (id?: string) => void
  goOverview: () => void
  focusStage: () => void
  setTransitioning: (v: boolean) => void
  openCheckout: () => void
  closeCheckout: () => void
  setCheckoutStep: (step: CheckoutStep) => void
  setMobilePanelOpen: (v: boolean) => void
  updateBooking: (patch: Partial<BookingDraft>) => void
  completeBooking: () => void
  finishBooking: () => void
  showToast: (message: string, tone?: 'gold' | 'error') => void
  dismissToast: () => void
}

const MAX_SEATS = 6

const initialBooking: BookingDraft = {
  name: '',
  phone: '+998 ',
  email: '',
  method: 'click',
  cardNumber: '',
  cardExpiry: '',
  cardName: '',
}

export const useBookingStore = create<BookingState>((set, get) => ({
  selectedIds: [],
  purchasedIds: [],
  hoveredId: null,
  lastSelectedId: null,
  cameraMode: 'overview',
  viewSeatId: null,
  cameraEpoch: 0,
  isTransitioning: false,
  checkoutOpen: false,
  checkoutStep: 'details',
  mobilePanelOpen: false,
  toast: null,
  booking: initialBooking,
  bookingRef: null,

  toggleSeat: (id) => {
    const seat = SEAT_MAP.get(id)
    if (!seat || seat.booked || get().purchasedIds.includes(id)) return
    const { selectedIds } = get()
    if (selectedIds.includes(id)) {
      set({
        selectedIds: selectedIds.filter((s) => s !== id),
        lastSelectedId:
          selectedIds.filter((s) => s !== id).at(-1) ?? null,
        hoveredId: null,
      })
      return
    }
    if (selectedIds.length >= MAX_SEATS) {
      get().showToast(`You can reserve up to ${MAX_SEATS} seats per booking.`, 'error')
      return
    }
    set({
      selectedIds: [...selectedIds, id],
      lastSelectedId: id,
      hoveredId: null,
    })
  },

  removeSeat: (id) => {
    const { selectedIds } = get()
    const remaining = selectedIds.filter((s) => s !== id)
    set({
      selectedIds: remaining,
      lastSelectedId: remaining.at(-1) ?? null,
    })
    if (get().viewSeatId === id) {
      set({ viewSeatId: remaining.at(-1) ?? null })
      if (!remaining.length) get().goOverview()
    }
  },

  clearSeats: () => set({ selectedIds: [], lastSelectedId: null, viewSeatId: null }),

  setHovered: (id) => {
    if (get().hoveredId !== id) set({ hoveredId: id })
  },

  viewFromSeat: (id) => {
    const targetId = id ?? get().lastSelectedId ?? get().selectedIds.at(-1)
    if (!targetId) return
    const seat = SEAT_MAP.get(targetId)
    if (!seat || seat.booked || get().purchasedIds.includes(targetId)) return
    if (!get().selectedIds.includes(targetId)) {
      get().toggleSeat(targetId)
    }
    set((state) => ({
      viewSeatId: targetId,
      cameraMode: 'seat',
      cameraEpoch: state.cameraEpoch + 1,
      hoveredId: null,
      mobilePanelOpen: false,
      checkoutOpen: false,
    }))
  },

  goOverview: () =>
    set((state) => ({
      cameraMode: 'overview',
      cameraEpoch: state.cameraEpoch + 1,
      hoveredId: null,
      mobilePanelOpen: false,
    })),

  focusStage: () =>
    set((state) => ({
      cameraMode: 'stage',
      cameraEpoch: state.cameraEpoch + 1,
      hoveredId: null,
      mobilePanelOpen: false,
    })),

  setTransitioning: (v) => set({ isTransitioning: v }),

  openCheckout: () => {
    if (!get().selectedIds.length) {
      get().showToast('Choose at least one seat to continue.', 'error')
      return
    }
    set({ checkoutOpen: true, checkoutStep: 'details', mobilePanelOpen: false })
  },

  closeCheckout: () => set({ checkoutOpen: false }),

  setCheckoutStep: (step) => set({ checkoutStep: step }),

  setMobilePanelOpen: (v) => set({ mobilePanelOpen: v }),

  updateBooking: (patch) => set({ booking: { ...get().booking, ...patch } }),

  completeBooking: () => {
    const ref = `IS-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`
    set((state) => ({
      bookingRef: ref,
      checkoutStep: 'success',
      purchasedIds: Array.from(new Set([...state.purchasedIds, ...state.selectedIds])),
    }))
  },

  finishBooking: () =>
    set((state) => ({
      checkoutOpen: false,
      selectedIds: [],
      lastSelectedId: null,
      viewSeatId: null,
      cameraMode: 'overview',
      cameraEpoch: state.cameraEpoch + 1,
      checkoutStep: 'details',
      bookingRef: null,
    })),

  showToast: (message, tone = 'gold') => {
    set({ toast: { id: Date.now(), message, tone } })
    window.setTimeout(() => {
      if (get().toast?.message === message) set({ toast: null })
    }, 3600)
  },

  dismissToast: () => set({ toast: null }),
}))

export const useSelectedSeats = (): Seat[] => {
  const ids = useBookingStore((s) => s.selectedIds)
  return ids.map((id) => SEAT_MAP.get(id)).filter((s): s is Seat => Boolean(s))
}

export const useCartTotal = (): number => {
  const ids = useBookingStore((s) => s.selectedIds)
  let total = 0
  for (const id of ids) total += SEAT_MAP.get(id)?.price ?? 0
  return total
}
