import { useEffect, useRef } from 'react'

/**
 * A soft golden ring + dot that trails the pointer.
 * Purely decorative: it never intercepts clicks and never replaces the real cursor.
 */
export function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    // Touch-only devices get no follower at all.
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      dot.style.display = 'none'
      ring.style.display = 'none'
      return
    }

    let mouseX = -200
    let mouseY = -200
    let dotX = -200
    let dotY = -200
    let ringX = -200
    let ringY = -200
    let rafId = 0
    let visible = false

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
      if (!visible) {
        visible = true
        dot.style.opacity = '1'
        ring.style.opacity = '1'
      }
    }

    const onMouseLeave = () => {
      visible = false
      dot.style.opacity = '0'
      ring.style.opacity = '0'
    }

    const animate = () => {
      // The dot tracks closely, the ring trails behind it.
      dotX += (mouseX - dotX) * 0.9
      dotY += (mouseY - dotY) * 0.9
      ringX += (mouseX - ringX) * 0.16
      ringY += (mouseY - ringY) * 0.16

      dot.style.transform = 'translate(' + (dotX - 4) + 'px,' + (dotY - 4) + 'px)'
      ring.style.transform = 'translate(' + (ringX - 19) + 'px,' + (ringY - 19) + 'px)'

      rafId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)
    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="cursor-follower-ring"
        style={{ opacity: 0 }}
      />
      <div
        ref={dotRef}
        aria-hidden
        className="cursor-follower-dot"
        style={{ opacity: 0 }}
      />
    </>
  )
}
