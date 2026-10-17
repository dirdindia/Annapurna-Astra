import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

function FloatingBedKey({ mouse }) {
  const group = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!group.current) return
    group.current.rotation.y = t * 0.35
    group.current.position.y = Math.sin(t * 1.5) * 0.2
  })

  return (
    <group ref={group} position={[1.5, 0, 0]}>
      {/* 3D Key Fob / Tag */}
      <mesh>
        <boxGeometry args={[0.9, 1.4, 0.05]} />
        <meshStandardMaterial color="#0A2F2F" metalness={0.9} roughness={0.2} emissive="#1F6F6B" emissiveIntensity={0.2} />
      </mesh>
      {/* Golden Astra Star Emboss */}
      <mesh position={[0, 0.2, 0.04]}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color="#F6B445" emissive="#D98A1F" emissiveIntensity={0.7} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Key Ring */}
      <mesh position={[0, 0.9, 0]}>
        <torusGeometry args={[0.25, 0.035, 16, 32]} />
        <meshStandardMaterial color="#F6B445" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  )
}

function FloatingParticles({ count = 40 }) {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.getElapsedTime() * 0.08
  })

  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10
    positions[i * 3 + 1] = (Math.random() - 0.5) * 6
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4
  }

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#F6B445" transparent opacity={0.5} blending={THREE.AdditiveBlending} />
    </points>
  )
}

export default function Subpage3DCanvas() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={2} color="#ffffff" />
        <pointLight position={[-3, -2, 2]} intensity={1.5} color="#F6B445" />
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
          <FloatingBedKey mouse={{ current: [0, 0] }} />
        </Float>
        <FloatingParticles />
      </Canvas>
    </div>
  )
}
