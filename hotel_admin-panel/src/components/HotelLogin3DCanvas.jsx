import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function HotelLogin3DCanvas() {
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

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    currentMount.appendChild(renderer.domElement)

    // 2. Realistic Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2)
    dirLight.position.set(6, 8, 5)
    scene.add(dirLight)

    const saffronLight = new THREE.PointLight(0xf6b445, 3.5, 12)
    saffronLight.position.set(-3, 2, 3)
    scene.add(saffronLight)

    const cyanLight = new THREE.PointLight(0x38bdf8, 2.0, 10)
    cyanLight.position.set(3, -2, 2)
    scene.add(cyanLight)

    // 3. Orbiting 5-Star Hotel Rating Badges (Rotating 3D Octahedron Stars)
    const starsGroup = new THREE.Group()
    const starPositions = [
      [-2.0, 1.4, 0],
      [-1.5, 2.0, 1.0],
      [0.3, 2.2, -0.8],
      [1.9, 1.6, 0.6],
      [2.2, 0.4, -1.0],
    ]

    const starGeo = new THREE.OctahedronGeometry(0.15, 0)
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xf6b445,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.2,
    })

    starPositions.forEach((pos) => {
      const star = new THREE.Mesh(starGeo, starMat)
      star.position.set(pos[0], pos[1], pos[2])
      starsGroup.add(star)
    })
    scene.add(starsGroup)

    // 4. Ambient Hospitality Golden Dust Particles
    const particleCount = 75
    const particleGeo = new THREE.BufferGeometry()
    const posArray = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 10
      posArray[i + 1] = (Math.random() - 0.5) * 8
      posArray[i + 2] = (Math.random() - 0.5) * 5
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
    const particleMat = new THREE.PointsMaterial({
      size: 0.055,
      color: 0xf6b445,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // 5. Mouse tracking for parallax
    let mouseX = 0
    let mouseY = 0
    const onMouseMove = (e) => {
      const rect = currentMount.getBoundingClientRect()
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    }
    window.addEventListener('mousemove', onMouseMove)

    // 6. Animation Loop
    let animId
    const clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()

      // Orbiting 5-Star badges
      starsGroup.rotation.y = t * 0.25

      // Ambient particle dust
      particles.rotation.y = t * 0.08

      renderer.render(scene, camera)
    }
    animate()

    // 9. Resize Handler
    const handleResize = () => {
      if (!currentMount) return
      const w = currentMount.clientWidth
      const h = currentMount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', handleResize)
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement)
      }
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
