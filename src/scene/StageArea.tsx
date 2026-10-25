import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Sparkles } from '@react-three/drei'
import { createCurtainGeometry, createWoodCanopyGeometry } from './geometry'
import { StaticBatch } from './StaticBatch'
import { getWoodTexture } from './textures'

const GOLD = '#c4a052'

function Truss({ z, width = 19 }: { z: number; width?: number }) {
  const lamps = useMemo(() => Array.from({ length: 7 }, (_, i) => -width / 2 + 1.4 + (i * (width - 2.8)) / 6), [width])
  return (
    <group position={[0, 9.55, z]}>
      {/* chords */}
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[width, 0.09, 0.09]} />
        <meshStandardMaterial color="#111114" metalness={0.65} roughness={0.45} />
      </mesh>
      <mesh position={[0, -0.36, 0]}>
        <boxGeometry args={[width, 0.09, 0.09]} />
        <meshStandardMaterial color="#111114" metalness={0.65} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[width, 0.05, 0.05]} />
        <meshStandardMaterial color="#19191d" metalness={0.6} roughness={0.5} />
      </mesh>
      {Array.from({ length: 18 }, (_, i) => {
        const x = -width / 2 + (i * width) / 17
        const sign = i % 2 === 0 ? 1 : -1
        return (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, sign * 0.68]}>
            <boxGeometry args={[0.035, 0.82, 0.035]} />
            <meshStandardMaterial color="#17171b" metalness={0.5} roughness={0.55} />
          </mesh>
        )
      })}
      {lamps.map((x, i) => (
        <group key={i} position={[x, -0.55, 0.12]} rotation={[0.16, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.11, 0.14, 0.4, 10]} />
            <meshStandardMaterial color="#0d0d10" metalness={0.7} roughness={0.38} />
          </mesh>
          <mesh position={[0, -0.22, 0]}>
            <cylinderGeometry args={[0.115, 0.09, 0.06, 10]} />
            <meshBasicMaterial color={i % 3 === 0 ? '#ffdca8' : '#f7c47a'} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.28, 8]} />
            <meshStandardMaterial color="#202024" metalness={0.6} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Piano() {
  const bodyGeometry = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-0.82, -1.25)
    shape.lineTo(0.82, -1.25)
    shape.lineTo(0.82, 0.35)
    shape.bezierCurveTo(0.82, 0.95, 0.45, 1.18, -0.16, 1.18)
    shape.bezierCurveTo(-0.6, 1.18, -0.82, 0.95, -0.82, 0.42)
    shape.lineTo(-0.82, -1.25)
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.26,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.03,
      bevelSegments: 2,
    })
    geo.rotateX(-Math.PI / 2)
    geo.translate(0, 0.98, 0)
    geo.computeVertexNormals()
    return geo
  }, [])

  const edges = useMemo(() => new THREE.EdgesGeometry(bodyGeometry, 24), [bodyGeometry])

  return (
    <group position={[-7.2, 0, -18.2]} rotation={[0, 0.55, 0]}>
      <mesh geometry={bodyGeometry}>
        <meshStandardMaterial color="#101014" metalness={0.45} roughness={0.26} envMapIntensity={0.85} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#b08b42" transparent opacity={0.55} />
      </lineSegments>

      {/* raised lid */}
      <group position={[0, 1.27, 0.18]} rotation={[-0.5, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.68, 0.045, 2.18]} />
          <meshStandardMaterial color="#121216" metalness={0.5} roughness={0.24} />
        </mesh>
        <mesh position={[0, 0.028, 0.02]}>
          <boxGeometry args={[1.56, 0.006, 2.05]} />
          <meshStandardMaterial color="#171117" metalness={0.4} roughness={0.35} />
        </mesh>
      </group>
      <mesh position={[0, 1.34, 0.2]} rotation={[-0.5, 0, 0]}>
        <boxGeometry args={[0.035, 0.035, 2.24]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.25} />
      </mesh>

      {/* keyboard */}
      <mesh position={[0, 0.94, -1.31]}>
        <boxGeometry args={[1.56, 0.11, 0.3]} />
        <meshStandardMaterial color="#e8e1d2" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.9, -1.24]}>
        <boxGeometry args={[1.42, 0.035, 0.14]} />
        <meshStandardMaterial color="#08080a" roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh position={[0, 1.0, -1.44]}>
        <boxGeometry args={[1.68, 0.06, 0.05]} />
        <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.3} />
      </mesh>

      {/* legs and pedals */}
      {[
        [-0.62, -0.78],
        [0.62, -0.78],
        [0.02, 0.72],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.49, z]}>
          <cylinderGeometry args={[0.045, 0.055, 0.98, 8]} />
          <meshStandardMaterial color="#0a0a0c" metalness={0.55} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, 0.26, -1.0]}>
        <boxGeometry args={[0.25, 0.52, 0.18]} />
        <meshStandardMaterial color="#0a0a0c" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  )
}

function MusicStand({
  position,
  rotation = 0,
}: {
  position: [number, number, number]
  rotation?: number
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.17, 0.11, Math.sin(a) * 0.17]}
            rotation={[Math.sin(a) * 0.42, 0, -Math.cos(a) * 0.42]}
          >
            <cylinderGeometry args={[0.011, 0.011, 0.42, 5]} />
            <meshStandardMaterial color="#17171b" metalness={0.6} roughness={0.4} />
          </mesh>
        )
      })}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.012, 0.017, 1.16, 6]} />
        <meshStandardMaterial color="#1b1b20" metalness={0.65} roughness={0.35} />
      </mesh>
      <group position={[0, 1.18, 0.02]} rotation={[-0.58, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.58, 0.018, 0.42]} />
          <meshStandardMaterial color="#0e0e12" metalness={0.4} roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.012, 0]}>
          <boxGeometry args={[0.5, 0.004, 0.34]} />
          <meshStandardMaterial color="#e6dcc4" roughness={0.9} />
        </mesh>
      </group>
      <mesh position={[0.2, 1.3, 0.02]}>
        <sphereGeometry args={[0.026, 8, 8]} />
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
      </mesh>
    </group>
  )
}

function Timpani({
  position,
  scale = 1,
}: {
  position: [number, number, number]
  scale?: number
}) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.62, 24, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial
          color="#8a5a2b"
          metalness={0.8}
          roughness={0.28}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.921, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.615, 32]} />
        <meshStandardMaterial color="#d9cbb0" roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.923, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.61, 0.665, 40]} />
        <meshStandardMaterial
          color="#c9a44e"
          metalness={0.85}
          roughness={0.28}
          side={THREE.DoubleSide}
        />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.34, 0.46, Math.sin(a) * 0.34]}
            rotation={[Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3]}
          >
            <cylinderGeometry args={[0.024, 0.03, 0.92, 6]} />
            <meshStandardMaterial color="#15151a" metalness={0.6} roughness={0.4} />
          </mesh>
        )
      })}
      <mesh position={[0, 0.94, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.05, 8]} />
        <meshStandardMaterial color="#c9a44e" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  )
}

export function StageArea() {
  const wood = useMemo(getWoodTexture, [])
  const canopy = useMemo(createWoodCanopyGeometry, [])
  const curtain = useMemo(() => createCurtainGeometry(6.2, 12.2), [])
  const backCurtain = useMemo(() => createCurtainGeometry(15.6, 11.8), [])
  const spotTarget = useMemo(() => new THREE.Object3D(), [])
  const curtainTarget = useMemo(() => new THREE.Object3D(), [])
  const spotLeft = useRef<THREE.SpotLight>(null)
  const curtainWash = useRef<THREE.SpotLight>(null)

  useEffect(() => {
    spotTarget.position.set(0, 2.0, -20.5)
    spotTarget.updateMatrixWorld()
    curtainTarget.position.set(0, 5.6, -24.4)
    curtainTarget.updateMatrixWorld()
    if (spotLeft.current) {
      spotLeft.current.target = spotTarget
      spotTarget.updateMatrixWorld()
    }
    if (curtainWash.current) {
      curtainWash.current.target = curtainTarget
      curtainTarget.updateMatrixWorld()
    }
  }, [spotTarget, curtainTarget])

  const canopyRibs = useMemo(
    () => Array.from({ length: 19 }, (_, i) => {
      const v = i / 18
      return { z: -12.15 - v * 10.4, y: 10.66 + v * 2.9, tilt: Math.atan(2.9 / 10.4) }
    }),
    [],
  )

  return (
    <StaticBatch>
      {/* Black lacquered stage — glossy, but dark enough to keep the focus on the orchestra */}
      <mesh position={[0, 0.01, -19]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
        <planeGeometry args={[26.5, 13]} />
        <meshStandardMaterial
          color="#020203"
          roughness={0.92}
          metalness={0.03}
          envMapIntensity={0.04}
        />
      </mesh>
      {/* Stage apron */}
      <mesh position={[0, -0.33, -12.62]}>
        <boxGeometry args={[26.6, 0.68, 0.5]} />
        <meshStandardMaterial color="#08080a" roughness={0.35} metalness={0.4} />
      </mesh>
      {/* Closed apron edge */}
      <mesh position={[0, -0.33, -12.37]}>
        <boxGeometry args={[26.6, 0.68, 0.05]} />
        <meshStandardMaterial color="#08080a" roughness={0.35} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.025, -12.84]}>
        <boxGeometry args={[26.6, 0.035, 0.1]} />
        <meshBasicMaterial color="#e6bd6b" toneMapped={false} />
      </mesh>

      {/* Stage back and wings */}
      <mesh position={[0, 7, -25.4]}>
        <boxGeometry args={[27, 14, 0.5]} />
        <meshStandardMaterial color="#08080b" roughness={0.82} metalness={0.08} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 13.4, 7, -19.4]}>
          <boxGeometry args={[0.5, 14, 12.4]} />
          <meshStandardMaterial color="#0a0a0d" roughness={0.85} metalness={0.08} />
        </mesh>
      ))}

      {/* Warm walnut acoustic wall with vertical fins behind the orchestra */}
      <mesh position={[0, 7, -24.9]}>
        <planeGeometry args={[25.8, 13.6]} />
        <meshStandardMaterial color="#2a180c" roughness={0.9} />
      </mesh>
      {Array.from({ length: 25 }, (_, i) => {
        const x = -12.3 + i * (24.6 / 24)
        return (
          <mesh key={i} position={[x, 6.5, -24.72]}>
            <boxGeometry args={[0.17, 12.6, 0.24]} />
            <meshStandardMaterial
              map={wood}
              color={i % 4 === 0 ? '#8a5a2b' : i % 3 === 0 ? '#5d3c1f' : '#3b2514'}
              metalness={0.18}
              roughness={0.62}
            />
          </mesh>
        )
      })}

      {/* Grand burgundy drape framed by the wood shell */}
      <mesh geometry={backCurtain} position={[0, 5.92, -24.48]}>
        <meshStandardMaterial
          color="#3d0912"
          roughness={0.97}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={backCurtain} position={[0, 5.92, -24.6]} scale={[1.04, 1, 1]}>
        <meshStandardMaterial
          color="#4e0b18"
          roughness={0.98}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Gold valance and side trims around the drape */}
      <mesh position={[0, 11.82, -24.38]}>
        <boxGeometry args={[16.1, 0.34, 0.26]} />
        <meshStandardMaterial color={GOLD} metalness={0.82} roughness={0.3} />
      </mesh>
      <mesh position={[0, 11.58, -24.37]}>
        <boxGeometry args={[16.2, 0.05, 0.3]} />
        <meshStandardMaterial color="#f0d49a" metalness={0.7} roughness={0.35} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 7.92, 5.92, -24.36]}>
          <boxGeometry args={[0.1, 11.8, 0.22]} />
          <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.32} />
        </mesh>
      ))}

      {/* Warm wood side walls that frame the stage */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 12.85, 6.4, -19.1]}>
          <mesh>
            <boxGeometry args={[0.32, 12.8, 11.8]} />
            <meshStandardMaterial color="#2b1a0d" roughness={0.88} />
          </mesh>
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[side * -0.19, 0, -5.1 + i * 1.27]}>
              <boxGeometry args={[0.14, 12.3, 0.2]} />
              <meshStandardMaterial
                map={wood}
                color={i % 3 === 0 ? '#7d5730' : '#4a2d16'}
                metalness={0.2}
                roughness={0.55}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Stage riser steps at the very back */}
      {[0, 1, 2].map((i) => (
        <group key={i}>
          <mesh position={[0, 0.22 + i * 0.22, -23.0 + i * 0.34]}>
            <boxGeometry args={[20 - i * 1.4, 0.44 + i * 0.44, 0.7]} />
            <meshStandardMaterial color="#09090c" roughness={0.6} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0.44 + i * 0.44 + 0.01, -22.64 + i * 0.34]}>
            <boxGeometry args={[20 - i * 1.4, 0.02, 0.08]} />
            <meshStandardMaterial color="#6e5a31" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Wine velvet drapes in the wings */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 10.9, 6.1, -23.2]} rotation={[0, side * -0.08, 0]}>
          <mesh geometry={curtain}>
            <meshStandardMaterial
              color="#4a0b16"
              roughness={0.95}
              metalness={0}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh geometry={curtain} position={[side * -1.5, 0, 0.16]} scale={[0.7, 1, 1]}>
            <meshStandardMaterial color="#5d0d1c" roughness={0.97} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* Grand wooden acoustic canopy */}
      <mesh geometry={canopy} renderOrder={1}>
        <meshStandardMaterial
          map={wood}
          color="#6f4523"
          roughness={0.72}
          metalness={0.08}
          side={THREE.DoubleSide}
          envMapIntensity={0.3}
          emissive="#2a1406"
          emissiveIntensity={0.38}
        />
      </mesh>
      {canopyRibs.map((rib, i) => (
        <mesh key={i} position={[0, rib.y + 0.035, rib.z]} rotation={[rib.tilt, 0, 0]}>
          <boxGeometry args={[29.2, 0.11, 0.13]} />
          <meshStandardMaterial color={i % 3 === 0 ? '#b58c4b' : '#211308'} metalness={0.45} roughness={0.55} />
        </mesh>
      ))}
      {/* Canopy leading edge */}
      <mesh position={[0, 10.58, -12.1]}>
        <boxGeometry args={[29.3, 0.22, 0.3]} />
        <meshStandardMaterial color={GOLD} metalness={0.82} roughness={0.27} />
      </mesh>

      {/* Slim proscenium band above the canopy — keeps the wood shell dominant */}
      <mesh position={[0, 13.5, -13.55]}>
        <boxGeometry args={[29.5, 0.42, 1.5]} />
        <meshStandardMaterial map={wood} color="#7d5730" roughness={0.5} metalness={0.18} />
      </mesh>
      <mesh position={[0, 13.27, -13.55]}>
        <boxGeometry args={[29.6, 0.06, 1.58]} />
        <meshStandardMaterial color={GOLD} metalness={0.88} roughness={0.24} />
      </mesh>
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={i} position={[-13 + i * 1.86, 11.15, -12.52]}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshBasicMaterial color="#ffdca4" toneMapped={false} />
        </mesh>
      ))}

      {/* White fluted proscenium towers */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 14.15, 0, -14.2]}>
          <mesh position={[0, 6.4, 0]}>
            <boxGeometry args={[2.9, 12.8, 2.1]} />
            <meshStandardMaterial color="#cfc8ba" roughness={0.8} />
          </mesh>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} position={[-1.12 + i * 0.32, 6.4, 1.08]}>
              <boxGeometry args={[0.1, 12.1, 0.18]} />
              <meshStandardMaterial color="#e6e0d2" roughness={0.7} />
            </mesh>
          ))}
          <mesh position={[0, 12.55, 1.02]}>
            <boxGeometry args={[3.05, 0.16, 0.2]} />
            <meshStandardMaterial color={GOLD} metalness={0.82} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.65, 1.02]}>
            <boxGeometry args={[3.05, 0.12, 0.2]} />
            <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.35} />
          </mesh>
          <mesh position={[0, 6.2, 1.13]}>
            <boxGeometry args={[0.06, 10.8, 0.03]} />
            <meshStandardMaterial color="#8f7238" metalness={0.7} roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Side acoustic wood columns just inside the towers */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 12.3, 0, -14.4]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[0, 4.9, -i * 0.32]}>
              <boxGeometry args={[0.16, 9.8 + i * 0.3, 0.18]} />
              <meshStandardMaterial map={wood} color="#a87c4a" metalness={0.25} roughness={0.45} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Lighting trusses */}
      <Truss z={-16.2} />
      <Truss z={-20.7} width={17} />

      {/* Stage spotlights */}
      <primitive object={spotTarget} position={[0, 2.0, -20.5]} />
      <primitive object={curtainTarget} position={[0, 5.6, -24.4]} />
      <spotLight
        ref={spotLeft}
        position={[-3.5, 10.3, -16.5]}
        angle={0.78}
        penumbra={0.8}
        intensity={115}
        distance={36}
        decay={2}
        color="#ffd9a6"
        castShadow={false}
      />
      {/* Curtain wash from beneath the acoustic canopy */}
      <spotLight
        ref={curtainWash}
        position={[0, 11.2, -14.8]}
        angle={0.58}
        penumbra={0.9}
        intensity={165}
        distance={32}
        decay={2}
        color="#ffc78d"
        castShadow={false}
      />

      {/* One warm fill keeps the apron and instruments readable without flattening the floor. */}
      <pointLight position={[0, 4.4, -18.4]} intensity={22} distance={20} decay={2} color="#ffe0b8" />

      {/* Conductor's podium — no performer */}
      <group position={[0, 0, -16.4]}>
        <mesh position={[0, 0.09, 0]}>
          <boxGeometry args={[1.45, 0.18, 1.05]} />
          <meshStandardMaterial color="#2a180c" roughness={0.62} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.19, -0.44]}>
          <boxGeometry args={[1.5, 0.035, 0.08]} />
          <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} />
        </mesh>
        <MusicStand position={[0, 0.18, -0.18]} rotation={Math.PI} />
      </group>

      {/* Empty orchestra stands, ready for the symphony */}
      {[-6.6, -3.3, 0, 3.3, 6.6].map((x) => (
        <MusicStand key={`front-${x}`} position={[x, 0, -20.0 - (x * x) / 60]} rotation={0} />
      ))}
      {[-4.8, 0, 4.8].map((x) => (
        <MusicStand key={`rear-${x}`} position={[x, 0, -22.0]} rotation={0} />
      ))}

      {/* Timpani on the right */}
      <Timpani position={[8.7, 0, -20.7]} />
      <Timpani position={[9.8, 0, -21.9]} scale={0.82} />

      {/* Piano bench */}
      <group position={[-8.25, 0, -19.9]} rotation={[0, 0.55, 0]}>
        <mesh position={[0, 0.46, 0]}>
          <boxGeometry args={[0.9, 0.12, 0.42]} />
          <meshStandardMaterial color="#1a1016" roughness={0.55} metalness={0.1} />
        </mesh>
        {[
          [-0.36, -0.14],
          [0.36, -0.14],
          [-0.36, 0.14],
          [0.36, 0.14],
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.23, z]}>
            <cylinderGeometry args={[0.022, 0.026, 0.46, 6]} />
            <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* The only instrument on stage — no performers */}
      <Piano />

      <Sparkles
        count={70}
        scale={[20, 7, 9]}
        position={[0, 5.2, -18.5]}
        size={2.1}
        speed={0.22}
        opacity={0.36}
        color="#f6d7a4"
      />
    </StaticBatch>
  )
}
