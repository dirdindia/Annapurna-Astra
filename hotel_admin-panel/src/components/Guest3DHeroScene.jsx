import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Guest3DHeroScene({ hotelName = "E-Annapurna", hotelType = "Luxury Dining" }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 7.5);

    // Renderer with transparency & antialias
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xf6b445, 3.5, 30);
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x0a9396, 2.5, 30);
    pointLight2.position.set(-5, -4, 4);
    scene.add(pointLight2);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
    dirLight.position.set(0, 8, 4);
    scene.add(dirLight);

    // Group for entire rotating luxury centerpiece
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Luxury Gold Ring (Astral halo)
    const ringGeo = new THREE.TorusGeometry(2.3, 0.05, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xf6b445,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xd98a1f,
      emissiveIntensity: 0.25,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.8;
    mainGroup.add(ringMesh);

    // 2. Secondary Lagoon Ring
    const innerRingGeo = new THREE.TorusGeometry(1.7, 0.035, 16, 80);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0x94d2bd,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x0a9396,
      emissiveIntensity: 0.2,
    });
    const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRingMesh.rotation.x = -Math.PI / 3;
    innerRingMesh.rotation.y = Math.PI / 6;
    mainGroup.add(innerRingMesh);

    // 3. Central Luxury Cloche / Chef Platter
    const clocheGroup = new THREE.Group();
    mainGroup.add(clocheGroup);

    // Platter base
    const platterGeo = new THREE.CylinderGeometry(1.25, 1.35, 0.09, 48);
    const platterMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.95,
      roughness: 0.1,
    });
    const platter = new THREE.Mesh(platterGeo, platterMat);
    platter.position.y = -0.35;
    clocheGroup.add(platter);

    // Golden Rim for platter
    const platterRimGeo = new THREE.TorusGeometry(1.32, 0.03, 16, 48);
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf6b445,
      metalness: 0.95,
      roughness: 0.1,
      emissive: 0xd98a1f,
      emissiveIntensity: 0.3,
    });
    const platterRim = new THREE.Mesh(platterRimGeo, goldMat);
    platterRim.rotation.x = Math.PI / 2;
    platterRim.position.y = -0.32;
    clocheGroup.add(platterRim);

    // Dome cover (Cloche)
    const domeGeo = new THREE.SphereGeometry(1.0, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.9,
      roughness: 0.12,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = -0.3;
    clocheGroup.add(dome);

    // Cloche Handle Knob
    const knobGeo = new THREE.SphereGeometry(0.16, 24, 24);
    const knob = new THREE.Mesh(knobGeo, goldMat);
    knob.position.y = 0.72;
    clocheGroup.add(knob);

    // 4. Floating Asters / Sparkles
    const particlesCount = 36;
    const particleGeo = new THREE.OctahedronGeometry(0.08, 0);
    const particleMat = new THREE.MeshStandardMaterial({
      color: 0xf6b445,
      emissive: 0xf6b445,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
    });

    const particles = [];
    for (let i = 0; i < particlesCount; i++) {
      const mesh = new THREE.Mesh(particleGeo, particleMat);
      const angle = (i / particlesCount) * Math.PI * 2;
      const radius = 2.4 + (Math.random() - 0.5) * 1.2;
      const height = (Math.random() - 0.5) * 2.2;
      mesh.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      mesh.scale.setScalar(0.5 + Math.random() * 0.9);
      mesh.userData = {
        speed: 0.008 + Math.random() * 0.015,
        angle: angle,
        radius: radius,
        initY: height,
        bobSpeed: 1 + Math.random() * 2,
      };
      mainGroup.add(mesh);
      particles.push(mesh);
    }

    // Mouse movement interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.6;
      targetY = y * 0.4;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animation Loop
    let clock = new THREE.Clock();
    let animId;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse easing
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      // Group rotation
      mainGroup.rotation.y = elapsedTime * 0.45 + mouseX * 0.8;
      mainGroup.rotation.x = Math.sin(elapsedTime * 0.3) * 0.15 + mouseY * 0.5;

      // Cloche slight breathing
      clocheGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.12;
      clocheGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.2;

      // Rings differential spin
      ringMesh.rotation.z = elapsedTime * 0.35;
      innerRingMesh.rotation.z = -elapsedTime * 0.4;

      // Particles orbit
      particles.forEach((p) => {
        p.userData.angle += p.userData.speed;
        p.position.x = Math.cos(p.userData.angle) * p.userData.radius;
        p.position.z = Math.sin(p.userData.angle) * p.userData.radius;
        p.position.y = p.userData.initY + Math.sin(elapsedTime * p.userData.bobSpeed) * 0.25;
        p.rotation.x += 0.02;
        p.rotation.y += 0.03;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[280px] sm:h-[340px] md:h-[400px] overflow-hidden rounded-3xl bg-gradient-to-b from-[#061C1C] via-[#0A2F2F] to-[#061C1C] border border-white/10 shadow-2xl flex items-center justify-center">
      {/* Dynamic Glassmorphism Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-saffron-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Foreground Hospitality Card Overlay */}
      <div className="absolute bottom-5 inset-x-4 sm:inset-x-8 z-10 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[#061C1C]/80 backdrop-blur-xl border border-white/15 shadow-2xl pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-saffron-500/30">
            {hotelName?.charAt(0) || "A"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-saffron-500/20 text-saffron-400 border border-saffron-500/30">
                {hotelType || "Fine Dining"}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Digital Menu
              </span>
            </div>
            <h2 className="text-white font-extrabold text-base sm:text-lg font-display tracking-wide mt-0.5">
              {hotelName}
            </h2>
          </div>
        </div>

        <div className="text-center sm:text-right">
          <p className="text-[11px] text-slate-300 font-medium">⚡ Instant Kitchen Dispatch • Direct Table Order</p>
          <p className="text-[10px] text-saffron-400/90 font-semibold mt-0.5">Contactless QR Experience</p>
        </div>
      </div>
    </div>
  );
}
