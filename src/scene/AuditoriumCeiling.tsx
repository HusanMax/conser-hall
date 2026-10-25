import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createFunnelGeometry } from './geometry'
import { StaticBatch } from './StaticBatch'

interface FunnelInstance {
  position: THREE.Vector3
  rotation: number
  scale: number
  glow: THREE.Color
}

const ARC_CENTRE_Z = -13

function buildFunnelField(): { instances: FunnelInstance[]; bounds: { radius: number; maxY: number } } {
  const instances: FunnelInstance[] = []
  const rings = 18
  const inner = 5.1
  const outer = 30.4
  let maxY = 0

  for (let ring = 0; ring < rings; ring++) {
    const f = ring / (rings - 1)
    const radius = inner + (outer - inner) * f
    const angularSpan = 101 - f * 4
    const arcLength = ((angularSpan * 2) * Math.PI * radius) / 180
    const perRing = Math.max(8, Math.floor(arcLength / 1.62))
    for (let i = 0; i < perRing; i++) {
      const t = perRing === 1 ? 0.5 : i / (perRing - 1)
      const angleDeg = -angularSpan + t * angularSpan * 2
      const angle = (angleDeg * Math.PI) / 180
      const x = Math.sin(angle) * radius
      const z = ARC_CENTRE_Z + Math.cos(angle) * radius
      const sweep =
        12.15 +
        radius * 0.078 +
        Math.cos(angle * 0.95) * 0.62 +
        Math.sin(radius * 0.31 + angle * 0.5) * 0.32
      const scale = 0.86 + f * 0.32 + Math.sin(i * 1.7) * 0.035
      const warm = 0.75 + 0.25 * Math.sin(i * 0.8 + ring * 0.6)
      instances.push({
        position: new THREE.Vector3(x, sweep, z),
        rotation: angle + Math.sin(i * 2.1) * 0.05,
        scale,
        glow: new THREE.Color(1, 0.74 + warm * 0.12, 0.42 + warm * 0.18),
      })
      maxY = Math.max(maxY, sweep)
    }
  }

  return { instances, bounds: { radius: outer, maxY } }
}

export function AuditoriumCeiling() {
  const funnelRef = useRef<THREE.InstancedMesh>(null)
  const glowRef = useRef<THREE.InstancedMesh>(null)
  const { instances, bounds } = useMemo(buildFunnelField, [])
  const funnelGeo = useMemo(createFunnelGeometry, [])

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    const funnelMesh = funnelRef.current
    const glowMesh = glowRef.current
    if (!funnelMesh || !glowMesh) return

    instances.forEach((funnel, i) => {
      dummy.position.copy(funnel.position)
      dummy.rotation.set(0, funnel.rotation, 0)
      dummy.scale.setScalar(funnel.scale)
      dummy.updateMatrix()
      funnelMesh.setMatrixAt(i, dummy.matrix)

      dummy.position.y = funnel.position.y - 0.76 * funnel.scale
      dummy.scale.setScalar(0.9 + funnel.scale * 0.25)
      dummy.updateMatrix()
      glowMesh.setMatrixAt(i, dummy.matrix)
      glowMesh.setColorAt(i, funnel.glow)
    })
    funnelMesh.instanceMatrix.needsUpdate = true
    glowMesh.instanceMatrix.needsUpdate = true
    if (glowMesh.instanceColor) glowMesh.instanceColor.needsUpdate = true
    funnelMesh.computeBoundingSphere()
    glowMesh.computeBoundingSphere()
  }, [instances])

  return (
    <StaticBatch>
      {/* Dark acoustic back-plane, visible between the hanging petals */}
      <mesh position={[0, 16.55, ARC_CENTRE_Z]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[34.5, 96]} />
        <meshLambertMaterial color="#070709" side={THREE.DoubleSide} />
      </mesh>

      {/* Cream-white parametric acoustic funnels */}
      <instancedMesh
        ref={funnelRef}
        args={[funnelGeo, undefined, instances.length]}
        frustumCulled={false}
      >
        <meshLambertMaterial color="#d9d1c0" side={THREE.DoubleSide} />
      </instancedMesh>

      {/* Warm pin lights hidden inside each acoustic module */}
      <instancedMesh ref={glowRef} args={[undefined, undefined, instances.length]} frustumCulled={false}>
        <sphereGeometry args={[0.055, 4, 2]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Hanging line-array clusters flanking the proscenium */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 9.1, 12.15, -8.4]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[0, -i * 0.34, 0]} rotation={[0.1 + i * 0.025, side * 0.16, 0]}>
              <boxGeometry args={[0.5, 0.3, 0.4]} />
              <meshStandardMaterial color="#0c0c0f" roughness={0.5} metalness={0.4} />
            </mesh>
          ))}
          <mesh position={[0, 2.2, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 4.4, 6]} />
            <meshStandardMaterial color="#1a1a1e" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* The ceiling reads through the warm hall key light and emissive pin lights. */}
    </StaticBatch>
  )
}
