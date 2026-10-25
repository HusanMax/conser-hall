import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAudio } from '../components/ui/AudioController'

interface Note {
  id: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  opacity: number
  startTime: number
}

export function PianoNotes() {
  const { audioRef } = useAudio()
  const [notes, setNotes] = useState<Note[]>([])
  const noteIdCounter = useRef(0)

  useFrame((state, delta) => {
    const audio = audioRef.current
    if (!audio || audio.paused) return

    // Approx 120bpm = 0.5s per beat, 160bpm = 0.375s
    // Roughly trigger a note based on the audio time
    if (Math.random() < 0.05) {
      const newNote: Note = {
        id: noteIdCounter.current++,
        position: new THREE.Vector3(-7.2 + (Math.random() - 0.5) * 1.5, 1.2, -18.2 + (Math.random() - 0.5) * 1),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.5, Math.random() * 0.5 + 0.2, (Math.random() - 0.5) * 0.5),
        opacity: 1,
        startTime: state.clock.elapsedTime,
      }
      setNotes((prev) => [...prev, newNote])
    }

    setNotes((prev) =>
      prev
        .map((note) => ({
          ...note,
          position: note.position.add(note.velocity.clone().multiplyScalar(delta * 2)),
          opacity: Math.max(0, note.opacity - delta * 0.5),
        }))
        .filter((note) => note.opacity > 0)
    )
  })

  return (
    <>
      {notes.map((note) => (
        <mesh key={note.id} position={note.position}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshBasicMaterial color="#d4af37" transparent opacity={note.opacity} />
        </mesh>
      ))}
    </>
  )
}
