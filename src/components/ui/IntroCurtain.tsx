import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export function IntroCurtain() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false)
    }, 2300)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="grain fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[#08070a]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_40%,rgba(122,20,40,0.18),transparent_70%),radial-gradient(40%_40%_at_50%_55%,rgba(212,175,55,0.08),transparent_70%)]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/[0.09]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.035]" />

          <div className="relative flex flex-col items-center px-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex h-20 w-20 items-center justify-center rounded-full border border-gold/35"
            >
              <span className="absolute inset-[5px] rounded-full border border-gold/15" />
              <span className="font-display text-[30px] tracking-[0.04em] text-champagne">XD</span>
              <span className="absolute -right-1 top-2 h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_10px_3px_rgba(212,175,55,0.5)]" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.6 }}
              className="mt-7 text-[8.5px] font-semibold uppercase tracking-[0.44em] text-gold/75"
            >
              Xalqlar Do'stligi Saroyi
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.7 }}
              className="mt-3 font-display text-[44px] font-medium leading-none tracking-[-0.01em] text-[#f7f0e1] sm:text-[54px]"
            >
              Xalqlar Do'stligi
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.6 }}
              className="mt-3 text-[9px] uppercase tracking-[0.26em] text-white/30"
            >
              VR O'rindiq Tanlash · Toshkent
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-9 w-[190px]"
            >
              <div className="h-[2px] overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.45, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-[#9a7429] via-gold to-[#f0ddab]"
                />
              </div>
              <p className="mt-3 text-[7.5px] uppercase tracking-[0.3em] text-white/22">
                Zal tayyorlanmoqda
              </p>
            </motion.div>
          </div>

          <div className="absolute bottom-6 left-0 right-0 flex items-center justify-between px-6 text-[7.5px] uppercase tracking-[0.22em] text-white/18">
            <span>Ipak Yo'li Konsert Seriyasi</span>
            <span>26 · 10 · 2026</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
