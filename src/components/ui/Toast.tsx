import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { useBookingStore } from '../../store/bookingStore'

export function Toast() {
  const toast = useBookingStore((s) => s.toast)
  const dismiss = useBookingStore((s) => s.dismissToast)

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 18, scale: 0.97, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: 12, scale: 0.98, x: '-50%' }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={`fixed bottom-[94px] left-1/2 z-[70] flex max-w-[calc(100vw-2rem)] items-center gap-2.5 rounded-full border py-2.5 pl-3 pr-2 shadow-2xl backdrop-blur-2xl lg:bottom-7 ${
            toast.tone === 'error'
              ? 'border-rose-400/25 bg-[#1a0d12]/95 text-rose-100/85'
              : 'border-gold/25 bg-[#151107]/95 text-champagne/90'
          }`}
        >
          {toast.tone === 'error' ? (
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-300/80" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-gold" />
          )}
          <span className="text-[9.5px] font-medium tracking-wide">{toast.message}</span>
          <button
            onClick={dismiss}
            className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
            aria-label="Dismiss message"
          >
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
