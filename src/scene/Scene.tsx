import { Suspense } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { Environment, Lightformer, Preload } from '@react-three/drei'
import { AuditoriumCeiling } from './AuditoriumCeiling'
import { HallShell } from './HallShell'
import { InstancedSeats } from './InstancedSeats'
import { StageArea } from './StageArea'
import { CameraRig } from './CameraRig'
import { PianoNotes } from './PianoNotes'

function HallLighting() {
  return (
    <>
      <ambientLight intensity={0.42} color="#d8c6ad" />
      <hemisphereLight args={['#a89a8a', '#2a0b10', 0.62]} />
      <directionalLight position={[0, 17, 9]} intensity={1.2} color="#fff0dc" />
      <directionalLight position={[0, 7, -16]} intensity={0.82} color="#ffcf9e" />
      <pointLight position={[0, 10.4, 5]} intensity={34} distance={26} decay={2} color="#ffd8a4" />
    </>
  )
}

function StudioEnvironment() {
  return (
    <Environment resolution={96} frames={1}>
      <color attach="background" args={['#15121a']} />
      <Lightformer
        form="rect"
        intensity={2.1}
        color="#ffd7ab"
        position={[0, 9, -17]}
        scale={[22, 9, 1]}
        target={[0, 3, 0]}
      />
      <Lightformer
        form="ring"
        intensity={1.4}
        color="#ffbe7d"
        position={[-14, 8, 5]}
        scale={7}
        target={[0, 3, 0]}
      />
      <Lightformer
        form="ring"
        intensity={1.4}
        color="#ffbe7d"
        position={[14, 8, 5]}
        scale={7}
        target={[0, 3, 0]}
      />
      <Lightformer
        form="rect"
        intensity={0.8}
        color="#b8cfe0"
        position={[0, 5, 22]}
        scale={[20, 8, 1]}
        target={[0, 3, 0]}
      />
    </Environment>
  )
}

export function Scene() {
  return (
    <Canvas
      id="hall-canvas"
      dpr={[1, 1.75]}
      camera={{ position: [0, 11.9, 14.9], fov: 55, near: 0.05, far: 150 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
      }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
        gl.outputColorSpace = THREE.SRGBColorSpace
        scene.background = new THREE.Color('#08070a')
      }}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
    >
      <color attach="background" args={['#08070a']} />
      <fog attach="fog" args={['#09080c', 42, 105]} />
      <Suspense fallback={null}>
        <HallLighting />
        <StudioEnvironment />
        <StageArea />
        <HallShell />
        <AuditoriumCeiling />
        <InstancedSeats />
        <CameraRig />
        <PianoNotes />
        <Preload all />
      </Suspense>
    </Canvas>
  )
}
