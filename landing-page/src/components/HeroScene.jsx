import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Text } from '@react-three/drei'
import * as THREE from 'three'

// 1. Interactive 3D Service Bell (Reception Bell)
function ReceptionBell({ mouse }) {
  const bellGroup = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!bellGroup.current) return
    const targetX = mouse.current[0] * 0.4
    const targetY = mouse.current[1] * 0.4

    bellGroup.current.rotation.y = THREE.MathUtils.lerp(bellGroup.current.rotation.y, targetX + t * 0.35, 0.05)
    bellGroup.current.rotation.x = THREE.MathUtils.lerp(bellGroup.current.rotation.x, -targetY * 0.3 + 0.2, 0.05)
    bellGroup.current.position.y = Math.sin(t * 1.8) * 0.12 - 0.2
  })

  return (
    <group ref={bellGroup} position={[-0.8, -0.2, 0.5]}>
      {/* Base platform */}
      <mesh position={[0, -0.65, 0]}>
        <cylinderGeometry args={[1.3, 1.45, 0.15, 32]} />
        <meshStandardMaterial color="#0A2F2F" metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Inner stand rim */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[1.15, 1.25, 0.1, 32]} />
        <meshStandardMaterial color="#F6B445" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Bell Dome (Gold Brass) */}
      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.95, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
        <meshStandardMaterial
          color="#F6B445"
          metalness={0.92}
          roughness={0.15}
          emissive="#78350F"
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Bell top finial / neck */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.08, 0.14, 0.3, 16]} />
        <meshStandardMaterial color="#D98A1F" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Bell Push Button Top */}
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial
          color="#FEF08A"
          metalness={0.95}
          roughness={0.1}
          emissive="#F59E0B"
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  )
}

// 2. Floating 3D RFID Smart Keycard (Hotel Room 305 Access)
function FloatingKeycard({ mouse }) {
  const cardRef = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!cardRef.current) return
    cardRef.current.position.y = Math.sin(t * 1.6 + 1) * 0.18 + 0.9
    cardRef.current.rotation.y = t * 0.6
    cardRef.current.rotation.z = Math.sin(t * 1.2) * 0.15
  })

  return (
    <group ref={cardRef} position={[1.4, 0.9, 0.8]}>
      {/* Keycard Body */}
      <mesh>
        <boxGeometry args={[1.2, 0.75, 0.035]} />
        <meshStandardMaterial
          color="#0F4B4A"
          metalness={0.8}
          roughness={0.2}
          emissive="#1F6F6B"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Smart Chip / Magnetic Gold Band */}
      <mesh position={[-0.32, 0.12, 0.02]}>
        <boxGeometry args={[0.28, 0.22, 0.01]} />
        <meshStandardMaterial
          color="#F6B445"
          metalness={0.95}
          roughness={0.15}
          emissive="#D98A1F"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Keycard Astra Saffron Stripe */}
      <mesh position={[0.25, -0.15, 0.02]}>
        <boxGeometry args={[0.55, 0.06, 0.01]} />
        <meshStandardMaterial color="#F6B445" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  )
}

// 3. Floating Chef Cloche / Food Cover (Restaurant & Kitchen POS theme)
function FloatingCloche() {
  const clocheRef = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!clocheRef.current) return
    clocheRef.current.position.y = Math.cos(t * 1.4) * 0.15 - 1.1
    clocheRef.current.rotation.y = -t * 0.4
    clocheRef.current.rotation.x = Math.sin(t * 0.8) * 0.1
  })

  return (
    <group ref={clocheRef} position={[1.2, -1.1, -0.2]}>
      {/* Plate Base */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.9, 0.95, 0.08, 32]} />
        <meshStandardMaterial color="#E2E8F0" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Cloche Dome */}
      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial
          color="#CBD5E1"
          metalness={0.96}
          roughness={0.1}
          clearcoat={1}
        />
      </mesh>
      {/* Cloche Knob */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#F6B445" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

// 4. Floating 5-Star Hotel Rating Badges (Orbiting Stars)
function OrbitingHotelStars() {
  const starsGroup = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (starsGroup.current) {
      starsGroup.current.rotation.y = t * 0.25
    }
  })

  const starPositions = [
    [-2.2, 1.2, 0],
    [-1.7, 1.8, 1.2],
    [0.2, 2.2, -1.0],
    [2.1, 1.5, 0.8],
    [2.3, 0.2, -1.2]
  ]

  return (
    <group ref={starsGroup}>
      {starPositions.map((pos, idx) => (
        <Float key={idx} speed={3} rotationIntensity={2} floatIntensity={1.5}>
          <mesh position={pos}>
            <octahedronGeometry args={[0.16, 0]} />
            <meshStandardMaterial
              color="#F6B445"
              emissive="#F59E0B"
              emissiveIntensity={0.8}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

// 5. Golden Ambient Hospitality Dust
function HospitalityGlowParticles({ count = 80 }) {
  const pointsRef = useRef()

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.1
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t
    }
  })

  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 12
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8
    positions[i * 3 + 2] = (Math.random() - 0.5) * 6
  }

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#F6B445"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

export default function HeroScene() {
  const mouse = useRef([0, 0])

  const handlePointerMove = (e) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1
    const y = -(e.clientY / window.innerHeight) * 2 + 1
    mouse.current = [x, y]
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[6, 8, 5]} intensity={2.2} color="#FFFFFF" />
        <pointLight position={[-4, 2, 2]} intensity={2.5} color="#F6B445" />
        <pointLight position={[4, -2, 2]} intensity={1.5} color="#38BDF8" />

        {/* <ReceptionBell mouse={mouse} /> */}
        <FloatingKeycard mouse={mouse} />
        {/* <FloatingCloche /> */}
        <OrbitingHotelStars />
        <HospitalityGlowParticles count={75} />
      </Canvas>
    </div>
  )
}
