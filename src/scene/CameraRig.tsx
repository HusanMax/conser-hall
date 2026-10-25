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

/* MMB click-to-Zoom tuning ------------------------------------------- */
/** Closest the camera may get to the picked point. */
const MMB_MIN_DISTANCE = 5
/** Furthest the camera may sit from the picked point. */
const MMB_MAX_DISTANCE = 27
/** Radius multiplier applied on every MMB click (0.58 ≈ 1.7× closer). */
const MMB_ZOOM_FACTOR = 0.58
const MMB_DURATION = 0.62
/** In seat view the camera may only lean forward a little. */
const SEAT_DOLLY_MAX = 1.5
/** Vertical limits for the camera body. */
const CAM_MIN_Y = 0.8
const CAM_MAX_Y = 14.5
/** Pitch limits used by the seat look-around. */
const PITCH_LIMIT = 1.25

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function quaternionFor(position: THREE.Vector3, target: THREE.Vector3): THREE.Quaternion {
  const matrix = new THREE.Matrix4()
  matrix.lookAt(position, target, UP)
  return new THREE.Quaternion().setFromRotationMatrix(matrix)
}

/**
 * Builds the camera position that keeps `hit` pinned under the cursor while
 * the camera travels closer to it.
 *
 * The point's lateral offsets are scaled by the same ratio as its depth, so
 * the clicked pixel stays exactly where it was on screen.
 */
function dollyTowardPoint(
  camera: THREE.PerspectiveCamera,
  hit: THREE.Vector3,
  zoomFactor: number,
  minDistance: number,
  maxDistance: number,
): { position: THREE.Vector3; depth: number } | null {
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion)

  const rel = hit.clone().sub(camera.position)
  const depth = rel.dot(forward)
  if (depth <= 0.05) return null

  const lateralX = rel.dot(right)
  const lateralY = rel.dot(up)

  const nextDepth = THREE.MathUtils.clamp(depth * zoomFactor, minDistance, maxDistance)
  const ratio = nextDepth / depth

  const position = camera.position
    .clone()
    .addScaledVector(forward, depth - nextDepth)
    .addScaledVector(right, lateralX * (1 - ratio))
    .addScaledVector(up, lateralY * (1 - ratio))

  // Keep the new orbit radius inside the allowed band.
  const radius = position.distanceTo(hit)
  if (radius < minDistance || radius > maxDistance) {
    const clamped = THREE.MathUtils.clamp(radius, minDistance, maxDistance)
    position.copy(hit).add(position.clone().sub(hit).setLength(clamped))
  }

  return { position, depth: nextDepth }
}

/** Collects the meshes that can be picked (hidden batch sources are skipped). */
function pickables(scene: THREE.Object3D): THREE.Object3D[] {
  const out: THREE.Object3D[] = []
  scene.traverse((obj) => {
    if (!(obj as THREE.Mesh).isMesh) return
    // A mesh is only pickable when it and every ancestor are visible.
    let node: THREE.Object3D | null = obj
    while (node) {
      if (!node.visible) return
      node = node.parent
    }
    out.push(obj)
  })
  return out
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

interface MmbZoom {
  start: number
  duration: number
  kind: 'orbit' | 'seat'
  fromPos: THREE.Vector3
  toPos: THREE.Vector3
  fromQuat: THREE.Quaternion
  toQuat: THREE.Quaternion
  fromTarget: THREE.Vector3
  toTarget: THREE.Vector3
  fromBaseYaw: number
  fromBasePitch: number
  toBaseYaw: number
  toBasePitch: number
}

export function CameraRig() {
  const { camera, gl, scene } = useThree()
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const transitionRef = useRef<Transition | null>(null)
  const mmbZoomRef = useRef<MmbZoom | null>(null)
  const pickRaycaster = useMemo(() => new THREE.Raycaster(), [])
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

    // a running MMB zoom is superseded by an explicit camera command
    mmbZoomRef.current = null

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
      look.pitch = THREE.MathUtils.clamp(look.pitch - dy * 0.0036, -PITCH_LIMIT, PITCH_LIMIT)
    }

    const onPointerUp = () => {
      seatLook.current.dragging = false
      el.style.cursor = 'grab'
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') seatLook.current.yaw += 0.07
      else if (e.key === 'ArrowRight') seatLook.current.yaw -= 0.07
      else if (e.key === 'ArrowUp') seatLook.current.pitch = THREE.MathUtils.clamp(seatLook.current.pitch + 0.05, -PITCH_LIMIT, PITCH_LIMIT)
      else if (e.key === 'ArrowDown') seatLook.current.pitch = THREE.MathUtils.clamp(seatLook.current.pitch - 0.05, -PITCH_LIMIT, PITCH_LIMIT)
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

  /**
   * MMB click-to-Zoom.
   *
   * A middle-button press ray-casts into the auditorium, finds the 3-D point
   * under the cursor and flies the camera toward exactly that point. The
   * clicked pixel stays anchored while the camera closes in, and the point
   * becomes the new orbit target so repeated clicks keep travelling inward.
   *
   * Only `button === 1` is handled, so left-click seat picking and right-click
   * panning are untouched. The browser's middle-click autoscroll is suppressed.
   */
  useEffect(() => {
    const el = gl.domElement
    const perspective = camera as THREE.PerspectiveCamera

    // OrbitControls' own middle-button dolly would fight ours — hand the
    // middle button over completely (left = rotate, right = pan).
    const controls = controlsRef.current
    if (controls) controls.mouseButtons.MIDDLE = -1

    const pick = (clientX: number, clientY: number): THREE.Vector3 | null => {
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return null
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )
      pickRaycaster.setFromCamera(ndc, perspective)
      const hits = pickRaycaster.intersectObjects(pickables(scene), false)
      return hits.length ? hits[0].point.clone() : null
    }

    const onPointerDown = (e: PointerEvent) => {
      // middle button only — left and right clicks are left alone
      if (e.button !== 1) return

      // suppress the browser's middle-click autoscroll / paste-and-scroll
      e.preventDefault()

      // ignore while an explicit camera move is playing
      if (transitionRef.current) return

      const hit = pick(e.clientX, e.clientY)
      if (!hit) return

      const now = performance.now()
      const look = seatLook.current

      if (mode === 'seat') {
        // Seat view is a fixed vantage point: lean toward the picked spot and
        // re-aim the look-around origin at it, without breaking the drag.
        const dir = hit.clone().sub(perspective.position)
        const dist = dir.length()
        if (dist < 0.4) return
        const step = Math.min(dist * 0.35, SEAT_DOLLY_MAX)
        const toPos = perspective.position.clone().add(dir.normalize().multiplyScalar(step))
        toPos.y = THREE.MathUtils.clamp(
          toPos.y,
          (seat?.position[1] ?? 0) + 0.9,
          CAM_MAX_Y,
        )

        const aim = hit.clone().sub(toPos).normalize()
        const targetPitch = THREE.MathUtils.clamp(Math.asin(aim.y), -PITCH_LIMIT, PITCH_LIMIT)
        const targetYaw = Math.atan2(-aim.x, -aim.z)

        mmbZoomRef.current = {
          start: now,
          duration: MMB_DURATION,
          kind: 'seat',
          fromPos: perspective.position.clone(),
          toPos,
          fromQuat: perspective.quaternion.clone(),
          toQuat: quaternionFor(toPos, hit),
          fromTarget: new THREE.Vector3(),
          toTarget: new THREE.Vector3(),
          fromBaseYaw: look.baseYaw,
          fromBasePitch: look.basePitch,
          toBaseYaw: targetYaw - look.yaw,
          toBasePitch: targetPitch - look.pitch,
        }
        return
      }

      const orbit = controlsRef.current
      if (!orbit) return

      const moved = dollyTowardPoint(
        perspective,
        hit,
        MMB_ZOOM_FACTOR,
        MMB_MIN_DISTANCE,
        MMB_MAX_DISTANCE,
      )
      if (!moved) return

      const toPos = moved.position
      toPos.y = THREE.MathUtils.clamp(toPos.y, CAM_MIN_Y, CAM_MAX_Y)

      orbit.enabled = false
      mmbZoomRef.current = {
        start: now,
        duration: MMB_DURATION,
        kind: 'orbit',
        fromPos: perspective.position.clone(),
        toPos,
        fromQuat: perspective.quaternion.clone(),
        toQuat: quaternionFor(toPos, hit),
        fromTarget: orbit.target.clone(),
        toTarget: hit.clone(),
        fromBaseYaw: 0,
        fromBasePitch: 0,
        toBaseYaw: 0,
        toBasePitch: 0,
      }
    }

    // Belt-and-braces: some browsers only kick off the autoscroll on auxclick.
    const onAuxClick = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault()
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('auxclick', onAuxClick)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('auxclick', onAuxClick)
    }
  }, [gl, camera, scene, pickRaycaster, mode, seat])

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

    const zoom = mmbZoomRef.current
    if (zoom) {
      const t = Math.min(1, (performance.now() - zoom.start) / (zoom.duration * 1000))
      const eased = easeInOutCubic(t)
      camera.position.lerpVectors(zoom.fromPos, zoom.toPos, eased)

      const controls = controlsRef.current
      if (zoom.kind === 'orbit') {
        camera.quaternion.slerpQuaternions(zoom.fromQuat, zoom.toQuat, eased)
        if (controls) controls.target.lerpVectors(zoom.fromTarget, zoom.toTarget, eased)
      } else {
        const look = seatLook.current
        look.baseYaw = THREE.MathUtils.lerp(zoom.fromBaseYaw, zoom.toBaseYaw, eased)
        look.basePitch = THREE.MathUtils.lerp(zoom.fromBasePitch, zoom.toBasePitch, eased)
      }

      if (t >= 1) {
        camera.position.copy(zoom.toPos)
        if (zoom.kind === 'orbit') {
          camera.quaternion.copy(zoom.toQuat)
          if (controls) {
            controls.target.copy(zoom.toTarget)
            controls.enabled = true
            controls.update()
          }
        }
        mmbZoomRef.current = null
      }
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
