import { useLayoutEffect, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const KEEP_ATTRIBUTES = new Set(['position', 'normal', 'uv'])

function materialKey(material: THREE.Material): string {
  const m = material as THREE.MeshStandardMaterial
  return [
    material.type,
    m.color?.getHexString() ?? '',
    m.emissive?.getHexString() ?? '',
    m.emissiveIntensity ?? '',
    m.roughness ?? '',
    m.metalness ?? '',
    m.opacity ?? '',
    m.transparent ?? '',
    m.side ?? '',
    m.depthWrite ?? '',
    m.depthTest ?? '',
    m.toneMapped ?? '',
    m.map?.uuid ?? '',
    m.bumpMap?.uuid ?? '',
    m.normalMap?.uuid ?? '',
    m.alphaMap?.uuid ?? '',
    m.envMapIntensity ?? '',
    m.wireframe ?? '',
    m.polygonOffset ?? '',
    m.polygonOffsetFactor ?? '',
    m.polygonOffsetUnits ?? '',
    m.blending ?? '',
    m.vertexColors ?? '',
    m.flatShading ?? '',
  ].join('|')
}

function prepareGeometry(source: THREE.BufferGeometry, matrix: THREE.Matrix4): THREE.BufferGeometry {
  const geometry = source.clone()
  geometry.applyMatrix4(matrix)
  const flat = geometry.index ? geometry.toNonIndexed() : geometry
  if (flat !== geometry) geometry.dispose()

  if (!flat.getAttribute('normal')) flat.computeVertexNormals()
  if (!flat.getAttribute('uv')) {
    const count = flat.getAttribute('position')?.count ?? 0
    flat.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2))
  }
  for (const name of Object.keys(flat.attributes)) {
    if (!KEEP_ATTRIBUTES.has(name)) flat.deleteAttribute(name)
  }
  return flat
}

/**
 * Collapses static decoration into one draw call per material.
 *
 * The auditorium contains hundreds of small, individually-authored meshes
 * (fins, trusses, stands, trims). They never move, so merging them keeps the
 * reference-accurate geometry while removing the per-frame draw-call cost.
 * Instanced meshes, lights, points, lines and interactive objects are left
 * untouched.
 */
export function StaticBatch({ children }: { children: ReactNode }) {
  const sourceRef = useRef<THREE.Group>(null)
  const mergedRef = useRef<THREE.Group>(null)

  useLayoutEffect(() => {
    const source = sourceRef.current
    const mergedRoot = mergedRef.current
    if (!source || !mergedRoot) return

    source.updateWorldMatrix(true, true)
    const inverseRoot = new THREE.Matrix4().copy(source.matrixWorld).invert()
    const batches = new Map<
      string,
      { material: THREE.Material; geometries: THREE.BufferGeometry[] }
    >()
    const hidden: THREE.Object3D[] = []

    source.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (!mesh.isMesh || object instanceof THREE.InstancedMesh || object instanceof THREE.SkinnedMesh) return
      if (Array.isArray(mesh.material)) return
      if (!mesh.geometry?.getAttribute('position')) return

      const material = mesh.material as THREE.Material
      const key = materialKey(material)
      let batch = batches.get(key)
      if (!batch) {
        batch = { material: material.clone(), geometries: [] }
        batches.set(key, batch)
      }

      const local = new THREE.Matrix4().copy(inverseRoot).multiply(mesh.matrixWorld)
      batch.geometries.push(prepareGeometry(mesh.geometry, local))
      hidden.push(mesh)
    })

    const merged: THREE.Mesh[] = []
    for (const { material, geometries } of batches.values()) {
      if (!geometries.length) continue
      const geometry = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false)
      if (!geometry) {
        geometries.forEach((g) => g.dispose())
        material.dispose()
        continue
      }
      if (geometries.length > 1) geometries.forEach((g) => g.dispose())
      geometry.computeBoundingBox()
      geometry.computeBoundingSphere()
      const mesh = new THREE.Mesh(geometry, material)
      mesh.matrixAutoUpdate = false
      mesh.frustumCulled = false
      mergedRoot.add(mesh)
      merged.push(mesh)
    }

    for (const object of hidden) object.visible = false

    return () => {
      for (const object of hidden) object.visible = true
      for (const mesh of merged) {
        mergedRoot.remove(mesh)
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
      }
    }
    // The source groups are static by design; merge once after first commit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <group ref={sourceRef}>{children}</group>
      <group ref={mergedRef} />
    </>
  )
}
