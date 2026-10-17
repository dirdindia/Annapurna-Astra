import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function SuperAdminLogin3DCanvas() {
  const mountRef = useRef(null)

  useEffect(() => {
    const currentMount = mountRef.current
    if (!currentMount) return

    const width = currentMount.clientWidth || window.innerWidth / 2
    const height = currentMount.clientHeight || window.innerHeight

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0, 5.2)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    currentMount.appendChild(renderer.domElement)

    // 2. Realistic Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5)
    dirLight.position.set(6, 8, 6)
    scene.add(dirLight)

    const goldLight = new THREE.PointLight(0xf6b445, 3.5, 14)
    goldLight.position.set(-3, 2, 3)
    scene.add(goldLight)

    const tealLight = new THREE.PointLight(0x10b981, 2.4, 12)
    tealLight.position.set(3, -2, 2.5)
    scene.add(tealLight)

    const cyanLight = new THREE.PointLight(0x38bdf8, 2.0, 10)
    cyanLight.position.set(0, -3, 3)
    scene.add(cyanLight)

    // 3. Central Master Cloud Core: Dual Layer Crystal (Outer Wireframe + Inner Solid Gem)
    const coreGroup = new THREE.Group()

    // Outer wireframe cage
    const outerGeo = new THREE.IcosahedronGeometry(1.2, 1)
    const outerMat = new THREE.MeshStandardMaterial({
      color: 0x14b8a6,
      emissive: 0x0f766e,
      emissiveIntensity: 0.6,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      roughness: 0.2,
      metalness: 0.8
    })
    const outerMesh = new THREE.Mesh(outerGeo, outerMat)
    coreGroup.add(outerMesh)

    // Inner glowing crystal
    const innerGeo = new THREE.OctahedronGeometry(0.75, 0)
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.85
    })
    const innerMesh = new THREE.Mesh(innerGeo, innerMat)
    coreGroup.add(innerMesh)

    // Pulsing core beacon light
    const corePointLight = new THREE.PointLight(0xf59e0b, 2.2, 5)
    coreGroup.add(corePointLight)

    // scene.add(coreGroup)

    // 4. Orbiting Multi-Tenant Hotel Clusters (6 Satellites on inclined orbit)
    const orbitGroup = new THREE.Group()
    const satelliteCount = 6
    const satellites = []
    const satGeo = new THREE.OctahedronGeometry(0.18, 0)
    const satMat = new THREE.MeshStandardMaterial({
      color: 0xf6b445,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.9,
      roughness: 0.2,
      metalness: 0.8
    })

    for (let i = 0; i < satelliteCount; i++) {
      const sat = new THREE.Mesh(satGeo, satMat)
      const angle = (i / satelliteCount) * Math.PI * 2
      const radius = 2.2 + Math.sin(i * 1.5) * 0.3
      sat.position.set(Math.cos(angle) * radius, Math.sin(angle) * 0.6, Math.sin(angle) * radius)
      sat.userData = { angle, radius, speed: 0.008 + (i % 3) * 0.003, bobOffset: i * 0.9 }
      satellites.push(sat)
      orbitGroup.add(sat)
    }
    orbitGroup.rotation.x = 0.35
    orbitGroup.rotation.z = -0.2
    scene.add(orbitGroup)

    // 5. Ambient Stardust / Data Constellation Points
    const particleCount = 280
    const particlePositions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 9
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 7
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    const particleGeo = new THREE.BufferGeometry()
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0xfde68a,
      size: 0.035,
      transparent: true,
      opacity: 0.65
    })
    const particleSystem = new THREE.Points(particleGeo, particleMat)
    scene.add(particleSystem)

    // 6. Interactive Mouse Movement
    let mouseX = 0
    let mouseY = 0
    let targetX = 0
    let targetY = 0

    const handleMouseMove = (e) => {
      const rect = currentMount.getBoundingClientRect()
      mouseX = ((e.clientX - rect.left) / width) * 2 - 1
      mouseY = -(((e.clientY - rect.top) / height) * 2 - 1)
    }

    window.addEventListener('mousemove', handleMouseMove)

    // 7. Render Animation Loop
    let animationFrameId
    const startTime = performance.now()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const elapsed = (performance.now() - startTime) * 0.001

      // Smooth camera parallax
      targetX = mouseX * 0.35
      targetY = mouseY * 0.35
      camera.position.x += (targetX - camera.position.x) * 0.05
      camera.position.y += (targetY - camera.position.y) * 0.05
      camera.lookAt(0, 0, 0)

      // Rotate central core
      coreGroup.rotation.y = elapsed * 0.3
      coreGroup.rotation.x = Math.sin(elapsed * 0.2) * 0.15
      outerMesh.rotation.y = -elapsed * 0.4
      innerMesh.rotation.y = elapsed * 0.6
      innerMesh.rotation.z = elapsed * 0.3
      coreGroup.position.y = Math.sin(elapsed * 0.8) * 0.12

      // Orbit satellites around core
      satellites.forEach((sat) => {
        sat.userData.angle += sat.userData.speed
        const r = sat.userData.radius
        sat.position.x = Math.cos(sat.userData.angle) * r
        sat.position.z = Math.sin(sat.userData.angle) * r
        sat.position.y = Math.sin(elapsed * 1.5 + sat.userData.bobOffset) * 0.25
        sat.rotation.x += 0.02
        sat.rotation.y += 0.03
      })

      // Particle subtle breathing
      particleSystem.rotation.y = elapsed * 0.03

      renderer.render(scene, camera)
    }

    animate()

    // 8. Handle Window Resize
    const handleResize = () => {
      if (!currentMount) return
      const newWidth = currentMount.clientWidth || window.innerWidth / 2
      const newHeight = currentMount.clientHeight || window.innerHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    // 9. Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement)
      }
      outerGeo.dispose()
      outerMat.dispose()
      innerGeo.dispose()
      innerMat.dispose()
      satGeo.dispose()
      satMat.dispose()
      particleGeo.dispose()
      particleMat.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div 
      ref={mountRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ overflow: 'hidden' }}
    />
  )
}
