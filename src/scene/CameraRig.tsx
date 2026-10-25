import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { SEAT_MAP } from '../data/hall'
import { useBookingStore } from '../store/bookingStore'

const OVERVIEW_CAM = new THREE.Vector3(0, 11.9, 14.9)
const OVERVIEW_LOOK = new THREE.Vector3(0, 3.0, -8.0)
const STAGE_CAM = new THREE.Vector3(0, 6.3, 2.6)
const STAGE_LOOK = new THREE.Vector3(0, 4.4, -17.0)
const SEAT_LOOK = new THREE.Vector3(0, 3.6, -18.5)
const OVERVIEW_FOV = 55
const STAGE_FOV = 52
const SEAT_FOV = 62
const UP = new THREE.Vector3(0, 1, 0)

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function quaternionFor(position: THREE.Vector3, target: THREE.Vector3): THREE.Quaternion {
  const matrix = new THREE.Matrix4()
  matrix.lookAt(position, target, UP)
  return new THREE.Quaternion().setFromRotationMatrix(matrix)
}

interface Transition {
  start: number
  duration: number
  fromPos: THREE.Vector3
  toPos: THREE.Vector3
  fromQuat: THREE.Quaternion
  toQuat: THREE.Quaternion
  fromFov: number
  toFov: number
  target: THREE.Vector3
  kind: 'orbit' | 'seat'
}

export function CameraRig() {
  const { camera, gl } = useThree()
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const transitionRef = useRef<Transition | null>(null)
  const seatLook = useRef({
    baseYaw: 0,
    basePitch: 0,
    yaw: 0,
    pitch: 0,
    dragging: false,
    lastX: 0,
    lastY: 0,
  })

  const mode = useBookingStore((s) => s.cameraMode)
  const viewSeatId = useBookingStore((s) => s.viewSeatId)
  const cameraEpoch = useBookingStore((s) => s.cameraEpoch)
  const setTransitioning = useBookingStore((s) => s.setTransitioning)

  const seat = useMemo(
    () => (viewSeatId ? SEAT_MAP.get(viewSeatId) ?? null : null),
    [viewSeatId],
  )

  useEffect(() => {
    camera.rotation.order = 'YXZ'
    const controls = controlsRef.current
    if (!controls) return

    let toPos: THREE.Vector3
    let lookAt: THREE.Vector3
    let orbitTarget: THREE.Vector3
    let duration: number

    if (mode === 'seat' && seat) {
      const [sx, sy, sz] = seat.position
      const dx = 0 - sx
      const dz = -18.5 - sz
      const length = Math.hypot(dx, dz) || 1
      // sit slightly forward on the cushion, toward the stage
      toPos = new THREE.Vector3(sx + (dx / length) * 0.12, sy + 1.26, sz + (dz / length) * 0.12)
      lookAt = SEAT_LOOK.clone()
      orbitTarget = lookAt.clone()
      duration = 1.55
    } else if (mode === 'stage') {
      toPos = STAGE_CAM.clone()
      lookAt = STAGE_LOOK.clone()
      orbitTarget = STAGE_LOOK.clone()
      duration = 1.35
    } else {
      toPos = OVERVIEW_CAM.clone()
      lookAt = OVERVIEW_LOOK.clone()
      orbitTarget = OVERVIEW_LOOK.clone()
      duration = 1.45
    }

    controls.enabled = false
    const toQuat =
      mode === 'seat'
        ? quaternionFor(toPos, lookAt)
        : quaternionFor(toPos, orbitTarget)
    const perspective = camera as THREE.PerspectiveCamera
    const toFov = mode === 'seat' ? SEAT_FOV : mode === 'stage' ? STAGE_FOV : OVERVIEW_FOV

    transitionRef.current = {
      start: performance.now(),
      duration,
      fromPos: camera.position.clone(),
      toPos,
      fromQuat: camera.quaternion.clone(),
      toQuat,
      fromFov: perspective.fov,
      toFov,
      target: orbitTarget,
      kind: mode === 'seat' ? 'seat' : 'orbit',
    }
    setTransitioning(true)

    return () => {
      // interrupted transitions are replaced by the next command
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, viewSeatId, cameraEpoch])

  useEffect(() => {
    if (mode !== 'seat') return
    const el = gl.domElement
    el.style.cursor = 'grab'

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return
      const look = seatLook.current
      look.dragging = true
      look.lastX = e.clientX
      look.lastY = e.clientY
      el.style.cursor = 'grabbing'
      el.setPointerCapture?.(e.pointerId)
    }

    const onPointerMove = (e: PointerEvent) => {
      const look = seatLook.current
      if (!look.dragging) return
      const dx = e.clientX - look.lastX
      const dy = e.clientY - look.lastY
      look.lastX = e.clientX
      look.lastY = e.clientY
      look.yaw -= dx * 0.0042
      look.pitch = THREE.MathUtils.clamp(look.pitch - dy * 0.0036, -1.25, 1.25)
    }

    const onPointerUp = () => {
      seatLook.current.dragging = false
      el.style.cursor = 'grab'
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') seatLook.current.yaw += 0.07
      else if (e.key === 'ArrowRight') seatLook.current.yaw -= 0.07
      else if (e.key === 'ArrowUp') seatLook.current.pitch = THREE.MathUtils.clamp(seatLook.current.pitch + 0.05, -1.25, 1.25)
      else if (e.key === 'ArrowDown') seatLook.current.pitch = THREE.MathUtils.clamp(seatLook.current.pitch - 0.05, -1.25, 1.25)
      else return
      e.preventDefault()
    }

    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('keydown', onKey)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('keydown', onKey)
      el.style.cursor = 'auto'
      seatLook.current.dragging = false
    }
  }, [mode, gl])

  useFrame(() => {
    if (mode === 'seat') {
      const controls = controlsRef.current
      if (controls?.enabled) controls.enabled = false
    }

    const transition = transitionRef.current
    if (transition) {
      const t = Math.min(1, (performance.now() - transition.start) / (transition.duration * 1000))
      const eased = easeInOutCubic(t)
      camera.position.lerpVectors(transition.fromPos, transition.toPos, eased)
      camera.quaternion.slerpQuaternions(transition.fromQuat, transition.toQuat, eased)
      const perspective = camera as THREE.PerspectiveCamera
      perspective.fov = THREE.MathUtils.lerp(transition.fromFov, transition.toFov, eased)
      perspective.updateProjectionMatrix()

      if (t >= 1) {
        camera.position.copy(transition.toPos)
        camera.quaternion.copy(transition.toQuat)
        perspective.fov = transition.toFov
        perspective.updateProjectionMatrix()
        transitionRef.current = null
        setTransitioning(false)
        const controls = controlsRef.current
        if (transition.kind === 'orbit' && controls) {
          controls.target.copy(transition.target)
          controls.enabled = true
          controls.update()
        } else if (transition.kind === 'seat') {
          camera.rotation.order = 'YXZ'
          const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ')
          const look = seatLook.current
          look.baseYaw = euler.y
          look.basePitch = euler.x
          look.yaw = 0
          look.pitch = 0
        }
      }
      return
    }

    if (mode === 'seat') {
      const look = seatLook.current
      camera.rotation.set(look.basePitch + look.pitch, look.baseYaw + look.yaw, 0, 'YXZ')
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.055}
      rotateSpeed={0.6}
      zoomSpeed={0.85}
      panSpeed={0.55}
      screenSpacePanning
      minDistance={5}
      maxDistance={27}
      minPolarAngle={0.22}
      maxPolarAngle={1.32}
      target={[0, 3.0, -8.0]}
    />
  )
}
