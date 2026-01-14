import { useEffect, useRef, memo } from 'react'

/**
 * Hyperspace Background
 *
 * Classic Star Wars-style hyperspace jump effect
 * Stars streak from center outward creating tunnel effect
 */

interface Star {
  x: number
  y: number
  z: number
  pz: number
}

const StarWarsBackground = memo(function StarWarsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const starsRef = useRef<Star[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const starCount = 800
    const speed = 1

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Initialize stars
    const initStars = () => {
      starsRef.current = []
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width - canvas.width / 2,
          y: Math.random() * canvas.height - canvas.height / 2,
          z: Math.random() * canvas.width,
          pz: 0,
        })
      }
    }
    initStars()

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      const cx = w / 2
      const cy = h / 2

      // Fade effect for trails
      ctx.fillStyle = 'rgba(0, 0, 10, 0.2)'
      ctx.fillRect(0, 0, w, h)

      // Center glow
      const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 150)
      centerGlow.addColorStop(0, 'rgba(100, 150, 255, 0.1)')
      centerGlow.addColorStop(0.5, 'rgba(50, 100, 200, 0.05)')
      centerGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = centerGlow
      ctx.fillRect(0, 0, w, h)

      // Draw and update stars
      for (const star of starsRef.current) {
        star.pz = star.z
        star.z -= speed

        if (star.z <= 0) {
          star.x = Math.random() * w - cx
          star.y = Math.random() * h - cy
          star.z = w
          star.pz = w
        }

        // Project to 2D
        const sx = (star.x / star.z) * w + cx
        const sy = (star.y / star.z) * h + cy
        const px = (star.x / star.pz) * w + cx
        const py = (star.y / star.pz) * h + cy

        // Calculate size and brightness based on depth
        const size = (1 - star.z / w) * 3
        const brightness = 1 - star.z / w

        // Star color (blue-white tint)
        const r = Math.floor(180 + brightness * 75)
        const g = Math.floor(200 + brightness * 55)
        const b = 255

        // Draw streak
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${brightness * 0.8})`
        ctx.lineWidth = size
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(sx, sy)
        ctx.stroke()

        // Draw star point
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`
        ctx.beginPath()
        ctx.arc(sx, sy, size * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }

      // Blue tint overlay
      const blueOverlay = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.8)
      blueOverlay.addColorStop(0, 'rgba(50, 100, 200, 0.05)')
      blueOverlay.addColorStop(0.5, 'rgba(30, 60, 150, 0.03)')
      blueOverlay.addColorStop(1, 'transparent')
      ctx.fillStyle = blueOverlay
      ctx.fillRect(0, 0, w, h)

      // Vignette
      const vignetteGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7)
      vignetteGradient.addColorStop(0, 'transparent')
      vignetteGradient.addColorStop(0.6, 'transparent')
      vignetteGradient.addColorStop(1, 'rgba(0, 0, 20, 0.6)')
      ctx.fillStyle = vignetteGradient
      ctx.fillRect(0, 0, w, h)

      animationRef.current = requestAnimationFrame(draw)
    }

    // Initial clear
    ctx.fillStyle = '#00000a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      style={{ background: '#00000a' }}
    />
  )
})

export default StarWarsBackground
