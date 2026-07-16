import { useEffect, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  converge: boolean
}

export function NebulaBackground({ converge }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const convergeRef = useRef(converge)
  convergeRef.current = converge

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500)
    camera.position.z = 95

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    el.appendChild(renderer.domElement)

    const mainCount = 3200
    const nanoCount = 1200

    const positions = new Float32Array(mainCount * 3)
    const base = new Float32Array(mainCount * 3)
    const velocity = new Float32Array(mainCount * 3)
    const phases = new Float32Array(mainCount)

    for (let i = 0; i < mainCount; i++) {
      const r = 95 * Math.cbrt(Math.random())
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi) * 0.85
      const ix = i * 3
      base[ix] = x
      base[ix + 1] = y
      base[ix + 2] = z
      positions[ix] = x
      positions[ix + 1] = y
      positions[ix + 2] = z
      velocity[ix] = (Math.random() - 0.5) * 0.03
      velocity[ix + 1] = (Math.random() - 0.5) * 0.03
      velocity[ix + 2] = (Math.random() - 0.5) * 0.03
      phases[i] = Math.random() * Math.PI * 2
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.38,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const points = new THREE.Points(geometry, material)
    scene.add(points)

    const geometry2 = new THREE.BufferGeometry()
    const positions2 = new Float32Array(mainCount * 3)
    for (let i = 0; i < mainCount; i++) {
      const ix = i * 3
      positions2[ix] = positions[ix]
      positions2[ix + 1] = positions[ix + 1]
      positions2[ix + 2] = positions[ix + 2]
    }
    geometry2.setAttribute('position', new THREE.BufferAttribute(positions2, 3))

    const material2 = new THREE.PointsMaterial({
      color: 0xc4b5fd,
      size: 0.24,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const points2 = new THREE.Points(geometry2, material2)
    points2.rotation.z = 0.4
    scene.add(points2)

    const nanoPositions = new Float32Array(nanoCount * 3)
    const nanoVelocities = new Float32Array(nanoCount * 3)
    const nanoOrigins = new Float32Array(nanoCount * 3)
    const nanoSpeeds = new Float32Array(nanoCount)

    for (let i = 0; i < nanoCount; i++) {
      const ix = i * 3
      nanoOrigins[ix] = (Math.random() - 0.5) * 180
      nanoOrigins[ix + 1] = -100 - Math.random() * 50
      nanoOrigins[ix + 2] = (Math.random() - 0.5) * 80
      nanoPositions[ix] = nanoOrigins[ix]
      nanoPositions[ix + 1] = nanoOrigins[ix + 1]
      nanoPositions[ix + 2] = nanoOrigins[ix + 2]
      nanoVelocities[ix] = (Math.random() - 0.5) * 0.08
      nanoVelocities[ix + 1] = 0.15 + Math.random() * 0.12
      nanoVelocities[ix + 2] = (Math.random() - 0.5) * 0.08
      nanoSpeeds[i] = 0.8 + Math.random() * 0.4
    }

    const nanoGeometry = new THREE.BufferGeometry()
    nanoGeometry.setAttribute('position', new THREE.BufferAttribute(nanoPositions, 3))

    const nanoMaterial = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.12,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const nanoPoints = new THREE.Points(nanoGeometry, nanoMaterial)
    scene.add(nanoPoints)

    const surgeGeometry = new THREE.BufferGeometry()
    const surgePositions = new Float32Array(600 * 3)
    const surgePhases = new Float32Array(600)

    for (let i = 0; i < 600; i++) {
      const ix = i * 3
      surgePositions[ix] = (Math.random() - 0.5) * 160
      surgePositions[ix + 1] = (Math.random() - 0.5) * 160
      surgePositions[ix + 2] = (Math.random() - 0.5) * 80
      surgePhases[i] = Math.random() * Math.PI * 2
    }

    surgeGeometry.setAttribute('position', new THREE.BufferAttribute(surgePositions, 3))

    const surgeMaterial = new THREE.PointsMaterial({
      color: 0xe9d5ff,
      size: 0.25,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })

    const surgePoints = new THREE.Points(surgeGeometry, surgeMaterial)
    scene.add(surgePoints)

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const setSize = () => {
      const w = el.clientWidth
      const h = el.clientHeight || 1
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    setSize()
    const ro = new ResizeObserver(setSize)
    ro.observe(el)

    let rafId = 0
    const clock = new THREE.Clock()

    const tick = () => {
      rafId = requestAnimationFrame(tick)
      const t = clock.getElapsedTime()
      const pos = geometry.attributes.position.array as Float32Array
      const pos2 = geometry2.attributes.position.array as Float32Array
      const nanoPos = nanoGeometry.attributes.position.array as Float32Array
      const surgePos = surgeGeometry.attributes.position.array as Float32Array
      const surgeMat = surgeMaterial as THREE.PointsMaterial

      const mx = mouseRef.current.x * 60
      const my = mouseRef.current.y * 60
      const converging = convergeRef.current
      const toCenter = converging ? 0.085 : 0.0035
      const mousePull = converging ? 0.01 : 0.04
      const damp = converging ? 0.86 : 0.955

      for (let i = 0; i < mainCount; i++) {
        const ix = i * 3
        const bx = base[ix]
        const by = base[ix + 1]
        const bz = base[ix + 2]
        let x = pos[ix]
        let y = pos[ix + 1]
        let z = pos[ix + 2]

        const dx = mx - x * 0.15
        const dy = my - y * 0.15
        const distToMouse = Math.sqrt(dx * dx + dy * dy)
        const forceMultiplier = distToMouse < 40 ? (40 - distToMouse) / 40 * 0.3 : 0

        velocity[ix] = velocity[ix] * damp + dx * mousePull * 0.001 + (Math.random() - 0.5) * 0.0015
        velocity[ix + 1] = velocity[ix + 1] * damp + dy * mousePull * 0.001 + (Math.random() - 0.5) * 0.0015
        
        if (distToMouse < 35) {
          const repulseX = (x - mx) * 0.008 * forceMultiplier
          const repulseY = (y - my) * 0.008 * forceMultiplier
          velocity[ix] += repulseX
          velocity[ix + 1] += repulseY
        }

        velocity[ix + 2] = velocity[ix + 2] * damp + (Math.random() - 0.5) * 0.0015

        x += velocity[ix]
        y += velocity[ix + 1]
        z += velocity[ix + 2]

        x += (bx - x) * (converging ? 0.018 : 0.015)
        y += (by - y) * (converging ? 0.018 : 0.015)
        z += (bz - z) * (converging ? 0.018 : 0.015)

        if (converging) {
          x += -x * toCenter
          y += -y * toCenter
          z += -z * toCenter
        }

        pos[ix] = x
        pos[ix + 1] = y
        pos[ix + 2] = z

        const waveOffset = Math.sin(t * 0.25 + phases[i]) * 0.35
        pos2[ix] = x * 1.015 + waveOffset
        pos2[ix + 1] = y * 1.015 + Math.cos(t * 0.22 + phases[i]) * 0.35
        pos2[ix + 2] = z * 1.015
      }

      for (let i = 0; i < nanoCount; i++) {
        const ix = i * 3
        nanoPos[ix] += nanoVelocities[ix] * nanoSpeeds[i]
        nanoPos[ix + 1] += nanoVelocities[ix + 1] * nanoSpeeds[i]
        nanoPos[ix + 2] += nanoVelocities[ix + 2] * nanoSpeeds[i]

        if (nanoPos[ix + 1] > 100) {
          nanoPos[ix] = nanoOrigins[ix]
          nanoPos[ix + 1] = -100 - Math.random() * 30
          nanoPos[ix + 2] = nanoOrigins[ix + 2]
        }
      }

      const surgeIntensity = Math.sin(t * 1.2) * 0.3 + 0.3
      for (let i = 0; i < 600; i++) {
        const ix = i * 3
        surgePos[ix] += Math.sin(t * 0.15 + surgePhases[i]) * 0.15
        surgePos[ix + 1] += Math.cos(t * 0.12 + surgePhases[i]) * 0.15
        surgePos[ix + 2] += (Math.random() - 0.5) * 0.05
      }
      surgeMat.opacity = surgeIntensity * 0.4

      geometry.attributes.position.needsUpdate = true
      geometry2.attributes.position.needsUpdate = true
      nanoGeometry.attributes.position.needsUpdate = true
      surgeGeometry.attributes.position.needsUpdate = true

      scene.rotation.y = t * 0.015
      scene.rotation.x = Math.sin(t * 0.06) * 0.035

      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      window.removeEventListener('mousemove', onMove)
      geometry.dispose()
      geometry2.dispose()
      nanoGeometry.dispose()
      surgeGeometry.dispose()
      material.dispose()
      material2.dispose()
      nanoMaterial.dispose()
      surgeMaterial.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === el) {
        el.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 -z-10 h-[100dvh] w-full"
      aria-hidden
    />
  )
}