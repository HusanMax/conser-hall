import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  PARTERRE_LAYOUT,
  SIDE_TIER_LAYOUT,
  TIER1_LAYOUT,
} from '../data/hall'
import { createAisleGeometry } from './geometry'
import { StaticBatch } from './StaticBatch'
import { getCarpetTexture } from './textures'

const CENTRE_Z = -13
const DEG = Math.PI / 180

const COLORS = {
  wall: '#cbc4b6',
  wallShade: '#a79f91',
  slat: '#e3dccd',
  gold: '#b28b3c',
  step: '#42111b',
  riser: '#2a0b12',
  char: '#0c0b0e',
  balcony: '#3a151d',
  fascia: '#d7d0c2',
}

function arcPosition(radius: number, angleDeg: number): [number, number, number] {
  const a = angleDeg * DEG
  return [Math.sin(a) * radius, 0, CENTRE_Z + Math.cos(a) * radius]
}

/** Flat annular sector lying in the XZ plane, used for raked floors and balconies. */
function RingSector({
  inner,
  outer,
  start,
  end,
  y,
  color,
  roughness = 0.9,
  metalness = 0.02,
  segments = 80,
  map,
}: {
  inner: number
  outer: number
  start: number
  end: number
  y: number
  color: string
  roughness?: number
  metalness?: number
  segments?: number
  map?: THREE.Texture | null
}) {
  return (
    <mesh position={[0, y, CENTRE_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
      <ringGeometry
        args={[inner, outer, segments, 1, (start - 90) * DEG, (end - start) * DEG]}
      />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        map={map ?? undefined}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

/** Curved vertical band, useful for balcony fascias and gold trims. */
function curvedBandGeometry(radius: number, height: number, start: number, end: number, segments = 72) {
  const geo = new THREE.CylinderGeometry(
    radius,
    radius,
    height,
    segments,
    1,
    true,
    start * DEG,
    (end - start) * DEG,
  )
  return geo
}

function BalconyFascia({
  radius,
  y,
  start,
  end,
  height = 1.05,
}: {
  radius: number
  y: number
  start: number
  end: number
  height?: number
}) {
  const geo = useMemo(
    () => curvedBandGeometry(radius, height, start, end, 56),
    [radius, height, start, end],
  )
  return (
    <group>
      <mesh geometry={geo} position={[0, y - height / 2, CENTRE_Z]}>
        <meshStandardMaterial color={COLORS.fascia} roughness={0.75} metalness={0.02} side={THREE.DoubleSide} />
      </mesh>
      <mesh
        geometry={curvedBandGeometry(radius + 0.03, 0.07, start, end, 56)}
        position={[0, y + 0.035, CENTRE_Z]}
      >
        <meshStandardMaterial color={COLORS.gold} metalness={0.8} roughness={0.28} side={THREE.DoubleSide} />
      </mesh>
      <mesh
        geometry={curvedBandGeometry(radius + 0.02, 0.035, start, end, 56)}
        position={[0, y - height + 0.04, CENTRE_Z]}
      >
        <meshStandardMaterial color="#8b6b2c" metalness={0.7} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export function HallShell() {
  const wallSlatsRef = useRef<THREE.InstancedMesh>(null)
  const fasciaSlatsRef = useRef<THREE.InstancedMesh>(null)
  const sconcesRef = useRef<THREE.InstancedMesh>(null)
  const aisleLightsRef = useRef<THREE.InstancedMesh>(null)
  const carpet = useMemo(getCarpetTexture, [])

  const wallSlats = useMemo(() => {
    const out: { pos: [number, number, number]; rot: number }[] = []
    for (let angle = -108; angle <= 108; angle += 1.25) {
      out.push({ pos: arcPosition(30.82, angle), rot: angle * DEG })
    }
    return out
  }, [])

  const fasciaSlats = useMemo(() => {
    const out: { pos: [number, number, number]; rot: number; height: number }[] = []
    const pushRun = (radius: number, start: number, end: number, height: number) => {
      const arc = ((end - start) * DEG) * radius
      const count = Math.max(6, Math.floor(arc / 0.48))
      for (let i = 0; i <= count; i++) {
        const angle = start + ((end - start) * i) / count
        out.push({ pos: arcPosition(radius, angle), rot: angle * DEG, height })
      }
    }
    for (const tier of SIDE_TIER_LAYOUT) {
      for (const side of [-1, 1]) {
        const a = side * tier.startAngle
        const b = side * tier.endAngle
        pushRun(tier.radius - 0.55, Math.min(a, b), Math.max(a, b), 0.92)
      }
    }
    for (const tier of TIER1_LAYOUT) {
      pushRun(tier.startRadius - 0.72, -tier.angle, tier.angle, tier.level === 1 ? 1.02 : 0.92)
    }
    return out
  }, [])

  const sconces = useMemo(() => {
    const out: { pos: [number, number, number]; rot: number }[] = []
    for (const y of [4.6, 7.8, 11.0]) {
      for (const angle of [-96, -74, -52, -30, 30, 52, 74, 96]) {
        out.push({ pos: [Math.sin(angle * DEG) * 30.25, y, CENTRE_Z + Math.cos(angle * DEG) * 30.25], rot: angle * DEG })
      }
    }
    return out
  }, [])

  const aisleLights = useMemo(() => {
    const out: { pos: [number, number, number]; rot: number }[] = []
    for (let row = 0; row < PARTERRE_LAYOUT.rows; row++) {
      const radius = PARTERRE_LAYOUT.rowRadius(row)
      const y = PARTERRE_LAYOUT.rowY(row) + 0.055
      for (const aisle of PARTERRE_LAYOUT.aisleAngles) {
        for (const offset of [-0.63, 0.63]) {
          const a = (aisle * DEG)
          const pos: [number, number, number] = [
            Math.sin(a) * radius + Math.cos(a) * offset,
            y,
            CENTRE_Z + Math.cos(a) * radius - Math.sin(a) * offset,
          ]
          out.push({ pos, rot: a })
        }
      }
    }
    return out
  }, [])

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()

    const wall = wallSlatsRef.current
    if (wall) {
      wallSlats.forEach((slat, i) => {
        dummy.position.set(...slat.pos)
        dummy.rotation.set(0, slat.rot, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        wall.setMatrixAt(i, dummy.matrix)
      })
      wall.instanceMatrix.needsUpdate = true
      wall.computeBoundingSphere()
    }

    const fascia = fasciaSlatsRef.current
    if (fascia) {
      fasciaSlats.forEach((slat, i) => {
        dummy.position.set(slat.pos[0], slat.pos[1], slat.pos[2])
        dummy.rotation.set(0, slat.rot, 0)
        dummy.scale.set(1, slat.height / 0.92, 1)
        dummy.updateMatrix()
        fascia.setMatrixAt(i, dummy.matrix)
      })
      fascia.instanceMatrix.needsUpdate = true
      fascia.computeBoundingSphere()
    }

    const sconceMesh = sconcesRef.current
    if (sconceMesh) {
      sconces.forEach((sconce, i) => {
        dummy.position.set(...sconce.pos)
        dummy.rotation.set(0, sconce.rot, 0)
        dummy.scale.set(1, 1, 1)
        dummy.updateMatrix()
        sconceMesh.setMatrixAt(i, dummy.matrix)
      })
      sconceMesh.instanceMatrix.needsUpdate = true
      sconceMesh.computeBoundingSphere()
    }

    const aisleMesh = aisleLightsRef.current
    if (aisleMesh) {
      aisleLights.forEach((light, i) => {
        dummy.position.set(...light.pos)
        dummy.rotation.set(0, 0, 0)
        dummy.scale.setScalar(1)
        dummy.updateMatrix()
        aisleMesh.setMatrixAt(i, dummy.matrix)
      })
      aisleMesh.instanceMatrix.needsUpdate = true
      aisleMesh.computeBoundingSphere()
    }
  }, [aisleLights, fasciaSlats, sconces, wallSlats])

  return (
    <StaticBatch>
      {/* Hall enclosure */}
      <mesh position={[0, 8.2, CENTRE_Z]} receiveShadow={false}>
        <cylinderGeometry args={[31.3, 31.3, 16.4, 160, 1, true, -112 * DEG, 224 * DEG]} />
        <meshStandardMaterial
          color={COLORS.wall}
          roughness={0.88}
          metalness={0.01}
          side={THREE.DoubleSide}
          envMapIntensity={0.2}
        />
      </mesh>

      {/* Dark base of the walls */}
      <mesh position={[0, 0.9, CENTRE_Z]}>
        <cylinderGeometry args={[31.22, 31.22, 1.8, 150, 1, true, -112 * DEG, 224 * DEG]} />
        <meshStandardMaterial color="#181218" roughness={0.92} side={THREE.DoubleSide} />
      </mesh>

      {/* Vertical fluted wall panels */}
      <instancedMesh
        ref={wallSlatsRef}
        args={[undefined, undefined, wallSlats.length]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.13, 13.4, 0.34]} />
        <meshStandardMaterial color={COLORS.slat} roughness={0.82} metalness={0.02} envMapIntensity={0.3} />
      </instancedMesh>

      {/* Recess behind the flutes */}
      <mesh position={[0, 8.0, CENTRE_Z]}>
        <cylinderGeometry args={[30.95, 30.95, 13.9, 140, 1, true, -109 * DEG, 218 * DEG]} />
        <meshStandardMaterial color={COLORS.wallShade} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* Gold rings embracing the tiers */}
      {[3.3, 6.45, 9.6, 12.75].map((y) => (
        <mesh
          key={y}
          geometry={curvedBandGeometry(30.68, 0.09, -111, 111, 140)}
          position={[0, y, CENTRE_Z]}
        >
          <meshStandardMaterial color={COLORS.gold} metalness={0.82} roughness={0.28} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* White structural piers */}
      {[-104, -88, -72, -56, 56, 72, 88, 104].map((angle) => {
        const [x, , z] = arcPosition(30.35, angle)
        return (
          <group key={angle} position={[x, 0, z]} rotation={[0, angle * DEG, 0]}>
            <mesh position={[0, 7.2, 0]}>
              <boxGeometry args={[1.15, 14.4, 0.7]} />
              <meshStandardMaterial color="#ded7c8" roughness={0.78} />
            </mesh>
            <mesh position={[0, 7.2, -0.39]}>
              <boxGeometry args={[0.16, 13.7, 0.06]} />
              <meshStandardMaterial color={COLORS.gold} metalness={0.75} roughness={0.32} />
            </mesh>
            <mesh position={[0, 0.5, -0.2]}>
              <boxGeometry args={[1.65, 1.0, 0.95]} />
              <meshStandardMaterial color="#b7b0a2" roughness={0.85} />
            </mesh>
          </group>
        )
      })}

      {/* Wall sconces */}
      <instancedMesh ref={sconcesRef} args={[undefined, undefined, sconces.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.1, 0.16, 0.55, 8]} />
        <meshStandardMaterial color="#e9c473" emissive="#f3b95b" emissiveIntensity={1.8} roughness={0.4} toneMapped={false} />
      </instancedMesh>

      {/* Base floor under the stalls */}
      <RingSector inner={3.9} outer={31} start={-111} end={111} y={0.08} color="#0b090c" roughness={0.96} />

      {/* Raked parterre — individual curved steps */}
      {Array.from({ length: PARTERRE_LAYOUT.rows }, (_, row) => {
        const radius = PARTERRE_LAYOUT.rowRadius(row)
        const y = PARTERRE_LAYOUT.rowY(row)
        return (
          <group key={row}>
            <RingSector
              inner={radius - 0.43}
              outer={radius + 0.45}
              start={PARTERRE_LAYOUT.minAngle}
              end={PARTERRE_LAYOUT.maxAngle}
              y={y - 0.01}
              color={COLORS.step}
              roughness={0.94}
              segments={72}
            />
            <mesh
              geometry={curvedBandGeometry(radius - 0.44, 0.16, PARTERRE_LAYOUT.minAngle, PARTERRE_LAYOUT.maxAngle, 72)}
              position={[0, y - 0.09, CENTRE_Z]}
            >
              <meshStandardMaterial color={COLORS.riser} roughness={0.9} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )
      })}

      {/* Rear cross-aisle beneath the grand balcony */}
      <RingSector
        inner={23.5}
        outer={27.5}
        start={-47}
        end={47}
        y={3.9}
        color="#1a0a10"
        roughness={0.94}
        segments={60}
      />
      <mesh geometry={curvedBandGeometry(23.53, 3.75, -47, 47, 60)} position={[0, 1.92, CENTRE_Z]}>
        <meshStandardMaterial color="#241016" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={curvedBandGeometry(23.56, 0.06, -47, 47, 60)} position={[0, 3.85, CENTRE_Z]}>
        <meshStandardMaterial color={COLORS.gold} metalness={0.8} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Radial carpet aisles */}
      {PARTERRE_LAYOUT.aisleAngles.map((angle) => (
        <mesh
          key={angle}
          geometry={createAisleGeometry(
            angle * DEG,
            4.2,
            23.65,
            PARTERRE_LAYOUT.rowY(0) + 0.035,
            PARTERRE_LAYOUT.rowY(PARTERRE_LAYOUT.rows - 1) + 0.05,
            1.28,
          )}
          renderOrder={1}
        >
          <meshStandardMaterial
            map={carpet}
            color="#d8b6b6"
            roughness={0.95}
            metalness={0.01}
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Warm aisle step lights */}
      <instancedMesh ref={aisleLightsRef} args={[undefined, undefined, aisleLights.length]} frustumCulled={false}>
        <sphereGeometry args={[0.032, 6, 6]} />
        <meshBasicMaterial color="#ffd18a" toneMapped={false} />
      </instancedMesh>

      {/* Tier 1 rear balconies */}
      {TIER1_LAYOUT.map((tier) => {
        const outerRadius = tier.startRadius + (tier.rows - 1) * 0.78 + 0.6
        return (
          <group key={tier.level}>
            <RingSector
              inner={tier.startRadius - 0.62}
              outer={outerRadius}
              start={-tier.angle}
              end={tier.angle}
              y={tier.baseY - 0.04}
              color={COLORS.balcony}
              roughness={0.92}
              segments={100}
            />
            {Array.from({ length: tier.rows }, (_, row) => {
              const radius = tier.startRadius + row * 0.78
              const y = tier.baseY + row * 0.19
              return (
                <RingSector
                  key={row}
                  inner={radius - 0.43}
                  outer={radius + 0.42}
                  start={-tier.angle}
                  end={tier.angle}
                  y={y - 0.012}
                  color={COLORS.step}
                  roughness={0.94}
                  segments={90}
                />
              )
            })}
            <BalconyFascia
              radius={tier.startRadius - 0.68}
              y={tier.baseY + 0.02}
              start={-tier.angle}
              end={tier.angle}
              height={tier.level === 1 ? 1.15 : 1.0}
            />
            {/* Dark soffit under the balcony */}
            <RingSector
              inner={tier.startRadius - 0.6}
              outer={outerRadius}
              start={-tier.angle}
              end={tier.angle}
              y={tier.baseY - 0.22}
              color="#0a080c"
              roughness={1}
              segments={70}
            />
          </group>
        )
      })}

      {/* Side balcony tiers */}
      {SIDE_TIER_LAYOUT.map((tier) => {
        const outerRadius = tier.radius + (tier.rows - 1) * 0.8 + 0.65
        return (
          <group key={tier.level}>
            {[-1, 1].map((side) => {
              const a = side * tier.startAngle
              const b = side * tier.endAngle
              const start = Math.min(a, b)
              const end = Math.max(a, b)
              return (
                <group key={side}>
                  <RingSector
                    inner={tier.radius - 0.62}
                    outer={outerRadius}
                    start={start}
                    end={end}
                    y={tier.y - 0.04}
                    color={COLORS.balcony}
                    roughness={0.92}
                    segments={64}
                  />
                  {Array.from({ length: tier.rows }, (_, row) => {
                    const radius = tier.radius + row * 0.8
                    const y = tier.y + row * 0.18
                    return (
                      <RingSector
                        key={row}
                        inner={radius - 0.43}
                        outer={radius + 0.42}
                        start={start}
                        end={end}
                        y={y - 0.012}
                        color={COLORS.step}
                        roughness={0.94}
                        segments={52}
                      />
                    )
                  })}
                  <BalconyFascia
                    radius={tier.radius - 0.68}
                    y={tier.y + 0.02}
                    start={start}
                    end={end}
                    height={1.0}
                  />
                  {/* Gold end caps of each box */}
                  {[start, end].map((angle) => {
                    const [x, , z] = arcPosition(tier.radius + 0.7, angle)
                    return (
                      <group key={angle} position={[x, 0, z]} rotation={[0, angle * DEG - Math.PI / 2, 0]}>
                        <mesh position={[0, tier.y + 0.5, 0]}>
                          <boxGeometry args={[3.0, 1.08, 0.12]} />
                          <meshStandardMaterial color="#d1cabc" roughness={0.78} />
                        </mesh>
                        <mesh position={[0, tier.y + 1.05, 0]}>
                          <boxGeometry args={[3.05, 0.06, 0.16]} />
                          <meshStandardMaterial color={COLORS.gold} metalness={0.8} roughness={0.3} />
                        </mesh>
                      </group>
                    )
                  })}
                  <RingSector
                    inner={tier.radius - 0.6}
                    outer={outerRadius}
                    start={start}
                    end={end}
                    y={tier.y - 0.2}
                    color="#0a080c"
                    roughness={1}
                    segments={44}
                  />
                </group>
              )
            })}
          </group>
        )
      })}

      {/* White fluted balcony fronts */}
      <instancedMesh
        ref={fasciaSlatsRef}
        args={[undefined, undefined, fasciaSlats.length]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.105, 0.92, 0.16]} />
        <meshStandardMaterial color="#e9e3d6" roughness={0.72} metalness={0.02} envMapIntensity={0.4} />
      </instancedMesh>

      {/* Rear wall acoustic relief panels */}
      {[-44, -18, 18, 44].map((angle) => {
        const [x, , z] = arcPosition(30.62, angle)
        return (
          <group key={angle} position={[x, 0, z]} rotation={[0, angle * DEG, 0]}>
            <mesh position={[0, 8.2, 0]}>
              <boxGeometry args={[2.3, 11.2, 0.16]} />
              <meshStandardMaterial color="#bdb5a6" roughness={0.9} />
            </mesh>
            <mesh position={[0, 8.2, -0.1]}>
              <boxGeometry args={[2.05, 10.9, 0.06]} />
              <meshStandardMaterial color="#978e80" roughness={0.95} />
            </mesh>
          </group>
        )
      })}
    </StaticBatch>
  )
}
