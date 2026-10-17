import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

// 3D Floating Hotel Card + Key Mesh for Register sidebar
function Register3DHotelElements() {
  const cardGroup = useRef()
  const bellGroup = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (cardGroup.current) {
      cardGroup.current.rotation.y = t * 0.4
      cardGroup.current.position.y = Math.sin(t * 1.5) * 0.15
    }
    if (bellGroup.current) {
      bellGroup.current.rotation.y = -t * 0.3
      bellGroup.current.position.y = Math.cos(t * 1.8) * 0.1 - 1.2
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Gold VIP Hotel Card */}
      <group ref={cardGroup} position={[0, 0.4, 0]}>
        <mesh>
          <boxGeometry args={[1.5, 0.95, 0.04]} />
          <meshStandardMaterial color="#0A2F2F" metalness={0.9} roughness={0.15} emissive="#1F6F6B" emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[-0.45, 0.15, 0.025]}>
          <boxGeometry args={[0.3, 0.22, 0.01]} />
          <meshStandardMaterial color="#F6B445" metalness={0.95} roughness={0.1} emissive="#D98A1F" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.2, -0.2, 0.025]}>
          <boxGeometry args={[0.8, 0.08, 0.01]} />
          <meshStandardMaterial color="#F6B445" metalness={0.8} />
        </mesh>
      </group>

      {/* 3D Mini Brass Bell */}
      {/* <group ref={bellGroup} position={[0.6, -1.2, 0]} scale={0.7}>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.8, 0.9, 0.1, 32]} />
          <meshStandardMaterial color="#0A2F2F" metalness={0.85} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.65, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#F6B445" metalness={0.95} roughness={0.15} emissive="#D98A1F" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" metalness={0.9} />
        </mesh>
      </group> */}
    </group>
  )
}

function FloatingGoldParticles({ count = 35 }) {
  const points = useRef()
  useFrame((state) => {
    if (points.current) points.current.rotation.y = state.clock.getElapsedTime() * 0.08
  })

  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 8
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4
  }

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color="#F6B445" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
    </points>
  )
}

export default function Register3DScene() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[4, 5, 4]} intensity={2} color="#ffffff" />
        <pointLight position={[-3, 1, 2]} intensity={2} color="#F6B445" />
        <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
          <Register3DHotelElements />
        </Float>
        <FloatingGoldParticles />
      </Canvas>
    </div>
  )
}
