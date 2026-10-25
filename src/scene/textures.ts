import * as THREE from 'three'

let woodTexture: THREE.CanvasTexture | null = null
let carpetTexture: THREE.CanvasTexture | null = null
let velvetBump: THREE.CanvasTexture | null = null
let glowTexture: THREE.CanvasTexture | null = null

function canvas2d(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  return { canvas, ctx }
}

/** Amber walnut with hand-polished grain, used across the proscenium and canopy. */
export function getWoodTexture(): THREE.CanvasTexture {
  if (woodTexture) return woodTexture
  const { canvas, ctx } = canvas2d(1024, 512)
  const base = ctx.createLinearGradient(0, 0, 1024, 512)
  base.addColorStop(0, '#4a2a13')
  base.addColorStop(0.28, '#7a4a22')
  base.addColorStop(0.54, '#5a3417')
  base.addColorStop(0.78, '#8a5a2b')
  base.addColorStop(1, '#3d2110')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 1024, 512)

  // broad grain ribbons
  for (let i = 0; i < 90; i++) {
    const y = (i / 90) * 512 + Math.sin(i * 1.7) * 8
    const alpha = 0.035 + (i % 7) * 0.008
    ctx.beginPath()
    ctx.strokeStyle =
      i % 3 === 0 ? `rgba(227,178,99,${alpha + 0.03})` : `rgba(24,10,3,${alpha + 0.05})`
    ctx.lineWidth = 0.6 + (i % 5) * 0.45
    for (let x = 0; x <= 1024; x += 8) {
      const wave =
        Math.sin(x * 0.006 + i * 0.9) * 7 +
        Math.sin(x * 0.021 + i * 0.4) * 2.5 +
        Math.sin(x * 0.0015 + i) * 10
      if (x === 0) ctx.moveTo(x, y + wave)
      else ctx.lineTo(x, y + wave)
    }
    ctx.stroke()
  }

  // fine pores
  for (let i = 0; i < 2100; i++) {
    const x = Math.random() * 1024
    const y = Math.random() * 512
    ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '20,9,3' : '245,196,120'},${Math.random() * 0.05})`
    ctx.fillRect(x, y, 1 + Math.random() * 7, 0.7)
  }

  // lacquer sheen streaks
  const sheen = ctx.createLinearGradient(0, 0, 1024, 0)
  sheen.addColorStop(0, 'rgba(255,220,160,0)')
  sheen.addColorStop(0.35, 'rgba(255,220,160,0.05)')
  sheen.addColorStop(0.55, 'rgba(255,220,160,0.14)')
  sheen.addColorStop(0.75, 'rgba(255,220,160,0.02)')
  sheen.addColorStop(1, 'rgba(255,220,160,0)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, 1024, 512)

  woodTexture = new THREE.CanvasTexture(canvas)
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping
  woodTexture.repeat.set(2.2, 1)
  woodTexture.colorSpace = THREE.SRGBColorSpace
  woodTexture.anisotropy = 4
  return woodTexture
}

/** Deep wine carpet with a faint golden lattice, used in the parterre aisles. */
export function getCarpetTexture(): THREE.CanvasTexture {
  if (carpetTexture) return carpetTexture
  const { canvas, ctx } = canvas2d(512, 512)
  ctx.fillStyle = '#3c0912'
  ctx.fillRect(0, 0, 512, 512)
  const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 340)
  grad.addColorStop(0, 'rgba(139,28,46,0.55)')
  grad.addColorStop(1, 'rgba(20,2,6,0.5)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 512)

  ctx.strokeStyle = 'rgba(198,156,84,0.22)'
  ctx.lineWidth = 1.3
  const step = 64
  for (let i = -512; i < 1024; i += step) {
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + 512, 512)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(i, 512)
    ctx.lineTo(i + 512, 0)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(198,156,84,0.12)'
  ctx.lineWidth = 0.7
  for (let y = 16; y < 512; y += 32) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(512, y)
    ctx.stroke()
  }
  // pile speckle
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(${Math.random() > 0.4 ? '9,1,3' : '154,66,74'},${Math.random() * 0.09})`
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1.2, 1.2)
  }

  carpetTexture = new THREE.CanvasTexture(canvas)
  carpetTexture.wrapS = carpetTexture.wrapT = THREE.RepeatWrapping
  carpetTexture.repeat.set(3, 3)
  carpetTexture.colorSpace = THREE.SRGBColorSpace
  carpetTexture.anisotropy = 4
  return carpetTexture
}

/** Fine, soft noise used as a bump map for the velvet seats. */
export function getVelvetBump(): THREE.CanvasTexture {
  if (velvetBump) return velvetBump
  const { canvas, ctx } = canvas2d(256, 256)
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 20000; i++) {
    const v = Math.random() * 255
    ctx.fillStyle = `rgba(${v},${v},${v},${Math.random() * 0.35})`
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 1, 1)
  }
  for (let i = 0; i < 42; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${Math.random() * 0.08})`
    ctx.beginPath()
    ctx.moveTo(0, Math.random() * 256)
    ctx.lineTo(256, Math.random() * 256)
    ctx.stroke()
  }
  velvetBump = new THREE.CanvasTexture(canvas)
  velvetBump.wrapS = velvetBump.wrapT = THREE.RepeatWrapping
  velvetBump.repeat.set(2, 2)
  return velvetBump
}

/** Camera-facing warm halo for selected seats. */
export function getGlowTexture(): THREE.CanvasTexture {
  if (glowTexture) return glowTexture
  const { canvas, ctx } = canvas2d(256, 256)
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(255,244,203,1)')
  g.addColorStop(0.14, 'rgba(255,216,130,0.82)')
  g.addColorStop(0.38, 'rgba(231,177,66,0.3)')
  g.addColorStop(0.75, 'rgba(212,175,55,0.06)')
  g.addColorStop(1, 'rgba(212,175,55,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  glowTexture = new THREE.CanvasTexture(canvas)
  glowTexture.colorSpace = THREE.SRGBColorSpace
  return glowTexture
}
