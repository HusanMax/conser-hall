import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three-stdlib'

/** Lathe-ish folded-paper acoustic funnel that hangs from the ceiling. */
export function createFunnelGeometry(): THREE.BufferGeometry {
  const segments = 16
  const rings = 7
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= rings; i++) {
    const v = i / rings // 0 bottom, 1 top
    const y = -0.82 + v * 0.95
    // profile: narrow closed tip → broad, gently flared mouth
    const profile = 0.14 + 0.52 * Math.pow(v, 1.55)
    for (let j = 0; j <= segments; j++) {
      const u = j / segments
      const theta = u * Math.PI * 2
      // eight soft folds, like folded acoustic paper
      const fold = 1 + 0.055 * Math.cos(theta * 8) * Math.sin(Math.PI * Math.min(1, v * 1.2))
      const r = profile * fold
      positions.push(Math.sin(theta) * r, y - 0.06 * Math.cos(theta * 8) * Math.pow(v, 3), Math.cos(theta) * r)
      uvs.push(u, v)
    }
  }

  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j
      const b = a + segments + 1
      indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

/** A one-piece theatre seat shell, instanced 2,000+ times. */
export function createSeatGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = []

  // Simple chamfer-free boxes keep the instanced seat shell light: 2,113 seats
  // are drawn every frame, so rounded-box tessellation is reserved for the VIP trim.
  const plinth = new THREE.BoxGeometry(0.4, 0.34, 0.4)
  plinth.translate(0, 0.19, 0)
  parts.push(plinth)

  const cushion = new THREE.BoxGeometry(0.54, 0.16, 0.52)
  cushion.translate(0, 0.42, 0.015)
  parts.push(cushion)

  const back = new RoundedBoxGeometry(0.54, 0.66, 0.16, 1, 0.055)
  back.rotateX(-0.09)
  back.translate(0, 0.78, -0.21)
  parts.push(back)

  const head = new RoundedBoxGeometry(0.52, 0.17, 0.2, 1, 0.06)
  head.rotateX(-0.13)
  head.translate(0, 1.11, -0.255)
  parts.push(head)

  const armL = new THREE.BoxGeometry(0.075, 0.12, 0.5)
  armL.translate(-0.29, 0.56, -0.03)
  parts.push(armL)

  const armR = armL.clone()
  armR.translate(0.58, 0, 0)
  parts.push(armR)

  // RoundedBoxGeometry is non-indexed while BoxGeometry is indexed; normalise
  // before merging so the seat stays a single instanced draw call.
  const flatParts = parts.map((part) => {
    if (!part.index) return part
    const flat = part.toNonIndexed()
    part.dispose()
    return flat
  })
  const merged = mergeGeometries(flatParts, false)
  flatParts.forEach((p) => p.dispose())
  if (!merged) throw new Error('Unable to merge seat geometry')
  merged.computeBoundingSphere()
  merged.computeVertexNormals()
  return merged
}

/** Slim gold band across the top of a VIP seat back. */
export function createVipBandGeometry(): THREE.BufferGeometry {
  const band = new RoundedBoxGeometry(0.55, 0.045, 0.19, 1, 0.012)
  band.rotateX(-0.13)
  band.translate(0, 1.135, -0.27)
  return band
}

/** Flat ring used as a golden seat halo. */
export function createHaloGeometry(inner = 0.34, outer = 0.43): THREE.BufferGeometry {
  const geo = new THREE.RingGeometry(inner, outer, 36, 1)
  geo.rotateX(-Math.PI / 2)
  return geo
}

/**
 * A fan-shaped ramp ribbon that follows the rake of the parterre.
 * Angles are in radians, measured like the hall seats.
 */
export function createAisleGeometry(
  angle: number,
  innerRadius: number,
  outerRadius: number,
  innerY: number,
  outerY: number,
  width: number,
): THREE.BufferGeometry {
  const dir = new THREE.Vector2(Math.sin(angle), Math.cos(angle))
  const across = new THREE.Vector2(Math.cos(angle), -Math.sin(angle))
  const half = width / 2
  const points: number[] = []
  const uvs: number[] = []
  const indices = [0, 2, 1, 1, 2, 3]

  for (const [r, y, v] of [
    [innerRadius, innerY, 0],
    [outerRadius, outerY, 1],
  ] as const) {
    for (const side of [-1, 1]) {
      const x = dir.x * r + across.x * half * side
      const z = dir.y * r + across.y * half * side
      points.push(x, y, -13 + z)
      uvs.push(side === -1 ? 0 : 1, v)
    }
  }
  // reorder so the quad is 0 (inner left), 1 (inner right), 2 (outer right), 3 (outer left)
  const reordered = [points[0], points[1], points[2], points[3], points[4], points[5], points[6], points[7], points[8], points[9], points[10], points[11]]
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(reordered, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

/**
 * Curved wooden canopy slats above the stage. Produces a grid surface with an
 * asymmetric wave, which reads like the acoustic wood shells in the reference.
 */
export function createWoodCanopyGeometry(): THREE.BufferGeometry {
  const width = 29
  const depth = 10.4
  const segX = 56
  const segZ = 18
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let iz = 0; iz <= segZ; iz++) {
    const v = iz / segZ
    for (let ix = 0; ix <= segX; ix++) {
      const u = ix / segX
      const x = (u - 0.5) * width
      const z = -12.15 - v * depth
      const lateral = Math.abs(x) / (width / 2)
      const y =
        10.6 +
        v * 2.9 +
        Math.pow(lateral, 2.2) * 0.9 +
        Math.sin(u * Math.PI * 2 + 0.3) * 0.35 * v
      positions.push(x, y, z)
      uvs.push(u * 3, v * 1.4)
    }
  }

  for (let iz = 0; iz < segZ; iz++) {
    for (let ix = 0; ix < segX; ix++) {
      const a = iz * (segX + 1) + ix
      const b = a + segX + 1
      indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

/** Gently folded stage drape. */
export function createCurtainGeometry(width = 5.5, height = 12): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, height, 28, 1)
  const pos = geo.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    pos.setZ(i, Math.sin((x / width) * Math.PI * 7) * 0.22 + Math.sin(x * 2.2) * 0.05)
  }
  geo.computeVertexNormals()
  return geo
}
