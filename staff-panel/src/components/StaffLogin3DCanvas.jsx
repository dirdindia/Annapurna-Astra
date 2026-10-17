import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function StaffLogin3DCanvas() {
  const mountRef = useRef(null)

  useEffect(() => {
    const currentMount = mountRef.current
    if (!currentMount) return

    const width = currentMount.clientWidth || window.innerWidth / 2
    const height = currentMount.clientHeight || window.innerHeight

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.set(0, 0, 5)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    currentMount.appendChild(renderer.domElement)

    // 2. Realistic Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.4)
    dirLight.position.set(6, 8, 5)
    scene.add(dirLight)

    const saffronLight = new THREE.PointLight(0xf6b445, 3.8, 14)
    saffronLight.position.set(-3, 2, 3)
    scene.add(saffronLight)

    const emeraldLight = new THREE.PointLight(0x10b981, 2.2, 12)
    emeraldLight.position.set(3, -2, 2)
    scene.add(emeraldLight)

    const cyanLight = new THREE.PointLight(0x38bdf8, 2.0, 10)
    cyanLight.position.set(0, -3, 3)
    scene.add(cyanLight)

    // 3. Orbiting Hospitality Stars / 3D Service Badges (Rotating 3D Octahedrons)
    const starsGroup = new THREE.Group()
    const starPositions = [
      [-2.1, 1.4, 0.2],
      [-1.5, 2.1, 1.0],
      [0.3, 2.3, -0.8],
      [1.9, 1.7, 0.6],
      [2.2, 0.4, -0.9],
      [-1.8, -1.2, 0.5],
      [1.7, -1.3, 0.3],
    ]

    const starGeo = new THREE.OctahedronGeometry(0.16, 0)
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xf6b445,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.85,
      metalness: 0.9,
      roughness: 0.18,
    })

    const emeraldStarMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x059669,
      emissiveIntensity: 0.75,
      metalness: 0.9,
      roughness: 0.18,
    })

    const starMeshes = []
    starPositions.forEach((pos, idx) => {
      const mat = idx % 2 === 0 ? starMat : emeraldStarMat
      const star = new THREE.Mesh(starGeo, mat)
      star.position.set(pos[0], pos[1], pos[2])
      starsGroup.add(star)
      starMeshes.push(star)
    })
    scene.add(starsGroup)

    // 4. Ambient Hospitality Golden Dust Particles
    const particleCount = 85
    const particleGeo = new THREE.BufferGeometry()
    const posArray = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 11
      posArray[i + 1] = (Math.random() - 0.5) * 9
      posArray[i + 2] = (Math.random() - 0.5) * 5
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    const particleMat = new THREE.PointsMaterial({
      size: 0.055,
      color: 0xf6b445,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // 5. Smooth Mouse Parallax
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const onMouseMove = (e) => {
      const rect = currentMount.getBoundingClientRect()
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.8
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.8
    }
    window.addEventListener('mousemove', onMouseMove)

    // 6. Animation Loop
    let animId
    const clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      // Smooth camera parallax with lerp
      currentX += (targetX - currentX) * 0.05
      currentY += (targetY - currentY) * 0.05
      camera.position.x = currentX
      camera.position.y = -currentY
      camera.lookAt(0, 0, 0)

      // Orbiting 3D star badges
      starsGroup.rotation.y = t * 0.22
      starsGroup.rotation.x = Math.sin(t * 0.3) * 0.08

      // Individual spin on each star for extra sparkle
      starMeshes.forEach((star, i) => {
        star.rotation.y = t * (0.8 + i * 0.1)
        star.rotation.x = t * (0.5 + i * 0.08)
      })

      // Ambient particle dust drift
      particles.rotation.y = t * 0.06
      particles.rotation.x = Math.sin(t * 0.04) * 0.05

      renderer.render(scene, camera)
    }
    animate()

    // 7. Resize Handler
    const handleResize = () => {
      if (!currentMount) return
      const w = currentMount.clientWidth
      const h = currentMount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', handleResize)
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement)
      }
      starGeo.dispose()
      starMat.dispose()
      emeraldStarMat.dispose()
      particleGeo.dispose()
      particleMat.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  )
}
