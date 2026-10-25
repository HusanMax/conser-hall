import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { SEATS, SEAT_MAP } from '../data/hall'
import { useBookingStore } from '../store/bookingStore'
import { createSeatGeometry, createVipBandGeometry, createHaloGeometry } from './geometry'
import { getGlowTexture, getVelvetBump } from './textures'

const AVAILABLE = new THREE.Color('#6d1424')
const AVAILABLE_WARM = new THREE.Color('#8e1e30')
const BOOKED = new THREE.Color('#2c2a30')
const VIP_TINT = new THREE.Color('#7a1626')

function createSeatColors(): THREE.Color[] {
  return SEATS.map((seat) => {
    if (seat.booked) return BOOKED.clone()
    const jitter = ((seat.number * 37 + seat.row * 17) % 20) / 100
    const color = (seat.vip ? VIP_TINT : AVAILABLE).clone()
    return color.lerp(AVAILABLE_WARM, jitter * 0.7)
  })
}

export function InstancedSeats() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const vipRef = useRef<THREE.InstancedMesh>(null)
  const hoverRef = useRef<THREE.Group>(null)

  const selectedIds = useBookingStore((s) => s.selectedIds)
  const purchasedIds = useBookingStore((s) => s.purchasedIds)
  const hoveredId = useBookingStore((s) => s.hoveredId)
  const cameraMode = useBookingStore((s) => s.cameraMode)
  const toggleSeat = useBookingStore((s) => s.toggleSeat)
  const setHovered = useBookingStore((s) => s.setHovered)

  const geometry = useMemo(createSeatGeometry, [])
  const vipGeometry = useMemo(createVipBandGeometry, [])
  const haloGeometry = useMemo(() => createHaloGeometry(), [])
  const glowMap = useMemo(getGlowTexture, [])
  const bumpMap = useMemo(getVelvetBump, [])
  const seatColors = useMemo(createSeatColors, [])
  const seatIndex = useMemo(() => new Map(SEATS.map((seat, index) => [seat.id, index])), [])
  const lastHovered = useRef<string | null>(null)

  const vipSeats = useMemo(() => SEATS.filter((s) => s.vip && !s.booked), [])
  const selectedSeats = useMemo(
    () => selectedIds.map((id) => SEAT_MAP.get(id)).filter((s): s is NonNullable<typeof s> => Boolean(s)),
    [selectedIds],
  )
  const hoveredSeat = hoveredId ? SEAT_MAP.get(hoveredId) : undefined

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const dummy = new THREE.Object3D()
    SEATS.forEach((seat, i) => {
      dummy.position.set(...seat.position)
      dummy.rotation.set(0, seat.yaw, 0)
      dummy.scale.setScalar(1)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, seatColors[i])
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()

    const vip = vipRef.current
    if (vip) {
      vipSeats.forEach((seat, i) => {
        dummy.position.set(...seat.position)
        dummy.rotation.set(0, seat.yaw, 0)
        dummy.scale.setScalar(1)
        dummy.updateMatrix()
        vip.setMatrixAt(i, dummy.matrix)
      })
      vip.instanceMatrix.needsUpdate = true
      vip.computeBoundingSphere()
    }
  }, [seatColors, vipSeats])

  // Seats purchased during this session become permanently dimmed too.
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    for (const id of purchasedIds) {
      const idx = seatIndex.get(id)
      if (idx != null) mesh.setColorAt(idx, BOOKED)
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [purchasedIds, seatIndex])

  useEffect(() => {
    const previous = lastHovered.current
    if (previous && previous !== hoveredId && meshRef.current?.instanceColor) {
      const idx = seatIndex.get(previous)
      if (idx != null) {
        meshRef.current.setColorAt(idx, purchasedIds.includes(previous) ? BOOKED : seatColors[idx])
      }
    }
    if (hoveredId && meshRef.current) {
      const idx = seatIndex.get(hoveredId)
      if (idx != null) {
        const seat = SEATS[idx]
        if (!seat.booked && !purchasedIds.includes(hoveredId)) {
          meshRef.current.setColorAt(idx, AVAILABLE_WARM.clone().lerp(new THREE.Color('#d6b05a'), 0.28))
        }
      }
    }
    if (meshRef.current?.instanceColor) meshRef.current.instanceColor.needsUpdate = true
    lastHovered.current = hoveredId
    document.body.style.cursor = hoveredId ? 'pointer' : 'auto'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hoveredId, seatColors, seatIndex, purchasedIds])

  useFrame(({ clock }) => {
    if (!hoverRef.current) return
    const t = clock.getElapsedTime()
    const pulse = 1 + Math.sin(t * 4.2) * 0.06
    hoverRef.current.scale.setScalar(pulse)
    hoverRef.current.rotation.y = t * 0.22
  })

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (cameraMode === 'seat') return
    e.stopPropagation()
    const instanceId = e.instanceId
    if (instanceId == null) return
    const seat = SEATS[instanceId]
    if (seat && seat.id !== hoveredId) setHovered(seat.id)
  }

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (cameraMode === 'seat') return
    e.stopPropagation()
    const instanceId = e.instanceId
    if (instanceId == null) return
    const seat = SEATS[instanceId]
    if (!seat) return
    if (seat.booked || useBookingStore.getState().purchasedIds.includes(seat.id)) {
      useBookingStore.getState().showToast('That seat is already taken. Try a neighbouring one.', 'error')
      return
    }
    toggleSeat(seat.id)
  }

  return (
    <group>
      <instancedMesh
        ref={meshRef}
        args={[geometry, undefined, SEATS.length]}
        frustumCulled={false}
        onPointerMove={handlePointerMove}
        onPointerOut={() => setHovered(null)}
        onClick={handleClick}
      >
        <meshLambertMaterial color="#ffffff" bumpMap={bumpMap} bumpScale={0.012} />
      </instancedMesh>

      {/* Champagne band on the top of every VIP seat */}
      <instancedMesh ref={vipRef} args={[vipGeometry, undefined, Math.max(vipSeats.length, 1)]} frustumCulled={false}>
        <meshStandardMaterial color="#9a7a3a" metalness={0.55} roughness={0.45} envMapIntensity={0.6} />
      </instancedMesh>

      {/* Selected seats: a gold shell, a halo ring and a soft aura */}
      {selectedSeats.map((seat) => (
        <group key={seat.id} position={seat.position}>
          <mesh geometry={geometry} rotation={[0, seat.yaw, 0]} scale={1.035} renderOrder={2}>
            <meshStandardMaterial
              color="#d8b24d"
              emissive="#a77b22"
              emissiveIntensity={0.5}
              metalness={0.7}
              roughness={0.3}
              envMapIntensity={1.2}
            />
          </mesh>
          <mesh geometry={haloGeometry} position={[0, 0.02, 0]} rotation={[0, seat.yaw, 0]}>
            <meshBasicMaterial
              color="#f0ca6b"
              transparent
              opacity={0.72}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <sprite position={[0, 1.3, 0]} scale={[1.15, 1.15, 1]}>
            <spriteMaterial
              map={glowMap}
              color="#f6d98d"
              transparent
              opacity={0.62}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </sprite>
        </group>
      ))}

      {/* Hovered seat: rotating gold halo + aura */}
      {hoveredSeat && !hoveredSeat.booked && !purchasedIds.includes(hoveredSeat.id) && cameraMode !== 'seat' && (
        <group
          ref={hoverRef}
          position={[hoveredSeat.position[0], hoveredSeat.position[1] + 0.03, hoveredSeat.position[2]]}
        >
          <mesh geometry={haloGeometry} rotation={[0, hoveredSeat.yaw, 0]}>
            <meshBasicMaterial
              color="#ffe6a3"
              transparent
              opacity={0.9}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, 0.72, 0]} rotation={[0, hoveredSeat.yaw, 0]}>
            <boxGeometry args={[0.6, 1.32, 0.62]} />
            <meshBasicMaterial
              color="#bf9743"
              wireframe
              transparent
              opacity={0.3}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <sprite position={[0, 1.28, 0]} scale={[0.7, 0.7, 1]}>
            <spriteMaterial
              map={glowMap}
              color="#ffe1a0"
              transparent
              opacity={0.32}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </sprite>
        </group>
      )}
    </group>
  )
}
