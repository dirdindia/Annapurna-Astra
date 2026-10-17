import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

// 1. Floating 3D Room Key Tag (Room Booking Module)
function KeyFob3D({ hovered }) {
  const mesh = useRef()
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!mesh.current) return
    mesh.current.rotation.y = hovered ? t * 1.8 : t * 0.6
    mesh.current.rotation.x = Math.sin(t) * 0.15
  })
  return (
    <group ref={mesh} scale={0.75}>
      {/* Wooden/Brass Key Tag */}
      <mesh>
        <boxGeometry args={[0.7, 1.2, 0.08]} />
        <meshStandardMaterial color="#0A2F2F" metalness={0.8} roughness={0.2} emissive="#1F6F6B" emissiveIntensity={0.3} />
      </mesh>
      {/* Brass Astra Star */}
      <mesh position={[0, 0.15, 0.05]}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#F6B445" emissive="#D98A1F" emissiveIntensity={0.8} metalness={0.9} />
      </mesh>
      {/* Key Ring */}
      <mesh position={[0, 0.75, 0]}>
        <torusGeometry args={[0.22, 0.03, 16, 32]} />
        <meshStandardMaterial color="#F6B445" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  )
}

// 2. Floating 3D Restaurant Plate & Cloche (Restaurant POS Module)
function Cloche3D({ hovered }) {
  const mesh = useRef()
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!mesh.current) return
    mesh.current.rotation.y = hovered ? -t * 1.8 : -t * 0.5
    mesh.current.position.y = Math.sin(t * 1.5) * 0.08
  })
  return (
    <group ref={mesh} scale={0.65}>
      {/* Plate */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.85, 0.9, 0.06, 32]} />
        <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Cloche Dome */}
      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.65, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Gold Knob */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#F6B445" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  )
}

// 3. Floating 3D Bill / KOT Ticket (KOT Module)
function Receipt3D({ hovered }) {
  const mesh = useRef()
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!mesh.current) return
    mesh.current.rotation.y = hovered ? t * 1.5 : t * 0.5
    mesh.current.rotation.z = Math.sin(t * 1.2) * 0.1
  })
  return (
    <group ref={mesh} scale={0.7}>
      <mesh>
        <boxGeometry args={[0.8, 1.2, 0.02]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Printed Lines simulation */}
      {[-0.3, -0.1, 0.1, 0.3].map((y, i) => (
        <mesh key={i} position={[0, y, 0.015]}>
          <boxGeometry args={[0.6, 0.04, 0.005]} />
          <meshStandardMaterial color={i === 3 ? "#F6B445" : "#64748B"} />
        </mesh>
      ))}
    </group>
  )
}

// 4. Floating 3D Service Bell (Live KDS Module)
function ServiceBell3D({ hovered }) {
  const mesh = useRef()
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!mesh.current) return
    mesh.current.rotation.y = hovered ? t * 2 : t * 0.6
  })
  return (
    <group ref={mesh} scale={0.65}>
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.9, 1.0, 0.1, 32]} />
        <meshStandardMaterial color="#0A2F2F" metalness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.75, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color="#F6B445" metalness={0.9} roughness={0.2} emissive="#D98A1F" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" metalness={0.9} />
      </mesh>
    </group>
  )
}

// 5. Floating 3D QR Cube / Stand (QR Order Module)
function QrStand3D({ hovered }) {
  const mesh = useRef()
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!mesh.current) return
    mesh.current.rotation.y = hovered ? t * 1.6 : t * 0.5
    mesh.current.rotation.x = Math.sin(t) * 0.1
  })
  return (
    <group ref={mesh} scale={0.7}>
      <mesh>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#0F4B4A" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.46]}>
        <boxGeometry args={[0.65, 0.65, 0.02]} />
        <meshStandardMaterial color="#F6B445" emissive="#F59E0B" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

// 6. Floating 3D Mobile / Tablet (Staff App Module)
function Smartphone3D({ hovered }) {
  const mesh = useRef()
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!mesh.current) return
    mesh.current.rotation.y = hovered ? t * 1.5 : t * 0.5
    mesh.current.rotation.z = Math.sin(t * 0.8) * 0.08
  })
  return (
    <group ref={mesh} scale={0.7}>
      <mesh>
        <boxGeometry args={[0.75, 1.3, 0.06]} />
        <meshStandardMaterial color="#0A2F2F" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.035]}>
        <boxGeometry args={[0.65, 1.15, 0.01]} />
        <meshStandardMaterial color="#1F6F6B" emissive="#0284c7" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

// 7. Floating 3D Analytics Growth Bars (Reports Module)
function ChartBars3D({ hovered }) {
  const mesh = useRef()
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!mesh.current) return
    mesh.current.rotation.y = hovered ? t * 1.5 : t * 0.4
  })
  return (
    <group ref={mesh} scale={0.7}>
      <mesh position={[-0.3, -0.2, 0]}>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial color="#0F4B4A" metalness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.2, 0.9, 0.2]} />
        <meshStandardMaterial color="#1F6F6B" metalness={0.8} />
      </mesh>
      <mesh position={[0.3, 0.25, 0]}>
        <boxGeometry args={[0.2, 1.4, 0.2]} />
        <meshStandardMaterial color="#F6B445" emissive="#D98A1F" emissiveIntensity={0.6} metalness={0.9} />
      </mesh>
    </group>
  )
}

// 8. Floating 3D Multi-Buildings (Multi-property Module)
function MultiHotel3D({ hovered }) {
  const mesh = useRef()
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!mesh.current) return
    mesh.current.rotation.y = hovered ? t * 1.4 : t * 0.4
  })
  return (
    <group ref={mesh} scale={0.65}>
      <mesh position={[-0.3, 0, 0]}>
        <boxGeometry args={[0.5, 1.2, 0.5]} />
        <meshStandardMaterial color="#0A2F2F" metalness={0.8} />
      </mesh>
      <mesh position={[0.3, -0.2, 0]}>
        <boxGeometry args={[0.5, 0.8, 0.5]} />
        <meshStandardMaterial color="#F6B445" emissive="#D98A1F" emissiveIntensity={0.4} metalness={0.8} />
      </mesh>
    </group>
  )
}

// 9. Floating 3D Supplies Crate (Inventory Module)
function InventoryCrate3D({ hovered }) {
  const mesh = useRef()
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!mesh.current) return
    mesh.current.rotation.y = hovered ? t * 1.5 : t * 0.5
    mesh.current.rotation.x = 0.2
  })
  return (
    <group ref={mesh} scale={0.65}>
      <mesh>
        <boxGeometry args={[0.9, 0.9, 0.9]} />
        <meshStandardMaterial color="#D97706" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.46]}>
        <boxGeometry args={[0.7, 0.1, 0.02]} />
        <meshStandardMaterial color="#FEF3C7" />
      </mesh>
    </group>
  )
}

const modelMap = {
  0: KeyFob3D,
  1: Cloche3D,
  2: Receipt3D,
  3: ServiceBell3D,
  4: QrStand3D,
  5: Smartphone3D,
  6: ChartBars3D,
  7: MultiHotel3D,
  8: InventoryCrate3D,
}

export default function Bento3DIcon({ index = 0, hovered = false }) {
  const ModelComponent = modelMap[index % 9] || KeyFob3D

  return (
    <div className="w-16 h-16 pointer-events-none shrink-0">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 3, 3]} intensity={2.2} color="#ffffff" />
        <pointLight position={[-2, -1, 1]} intensity={2.0} color="#F6B445" />
        <Float speed={2} rotationIntensity={0.8} floatIntensity={0.8}>
          <ModelComponent hovered={hovered} />
        </Float>
      </Canvas>
    </div>
  )
}
