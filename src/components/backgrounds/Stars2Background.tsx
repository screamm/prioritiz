import { useEffect, useRef, memo } from 'react'

/**
 * Stars 2 Background
 *
 * Cosmic starry night with parallax depth layers
 * Shooting stars and nebula clouds
 */

interface Star {
  x: number
  y: number
  z: number // Depth layer
  size: number
  twinkle: number
  speed: number
}

interface ShootingStar {
  x: number
  y: number
  length: number
  speed: number
  opacity: number
  active: boolean
  delay: number
}

const Stars2Background = memo(function Stars2Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const starsRef = useRef<Star[]>([])
  const shootingStarsRef = useRef<ShootingStar[]>([])
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const starCount = 300

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }

    const initStars = () => {
      starsRef.current = []
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          z: Math.random() * 3, // 0 = far, 3 = close
          size: Math.random() * 2 + 0.3,
          twinkle: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.02 + 0.005,
        })
      }

      // Initialize shooting stars
      shootingStarsRef.current = []
      for (let i = 0; i < 3; i++) {
        shootingStarsRef.current.push({
          x: 0,
          y: 0,
          length: 100,
          speed: 5,
          opacity: 0,
          active: false,
          delay: Math.random() * 500 + i * 200,
        })
      }
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      timeRef.current++

      // Deep space gradient
      const bgGradient = ctx.createRadialGradient(w * 0.7, h * 0.3, 0, w * 0.5, h * 0.5, Math.max(w, h))
      bgGradient.addColorStop(0, '#0f0f1a')
      bgGradient.addColorStop(0.3, '#0a0a14')
      bgGradient.addColorStop(0.6, '#06060c')
      bgGradient.addColorStop(1, '#020205')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, w, h)

      // Nebula clouds
      const drawNebula = (cx: number, cy: number, radius: number, color: string, opacity: number) => {
        const nebulaGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
        nebulaGradient.addColorStop(0, color.replace(')', `, ${opacity})`).replace('rgb', 'rgba'))
        nebulaGradient.addColorStop(0.4, color.replace(')', `, ${opacity * 0.5})`).replace('rgb', 'rgba'))
        nebulaGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = nebulaGradient
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      // Subtle nebula colors
      drawNebula(w * 0.2, h * 0.3, w * 0.3, 'rgb(60, 40, 100)', 0.05)
      drawNebula(w * 0.8, h * 0.7, w * 0.25, 'rgb(40, 60, 100)', 0.04)
      drawNebula(w * 0.5, h * 0.5, w * 0.4, 'rgb(30, 30, 60)', 0.03)

      // Draw stars by depth layer
      const sortedStars = [...starsRef.current].sort((a, b) => a.z - b.z)

      for (const star of sortedStars) {
        star.twinkle += star.speed
        const twinkleFactor = 0.5 + Math.sin(star.twinkle) * 0.5

        // Depth-based properties
        const depthFactor = (star.z + 1) / 4
        const actualSize = star.size * depthFactor
        const brightness = twinkleFactor * depthFactor

        // Star color varies by depth
        const r = Math.floor(200 + star.z * 18)
        const g = Math.floor(210 + star.z * 15)
        const b = 255

        // Draw glow for larger/closer stars
        if (actualSize > 0.8) {
          const glowSize = actualSize * 5
          const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize)
          glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${brightness * 0.3})`)
          glowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${brightness * 0.1})`)
          glowGradient.addColorStop(1, 'transparent')
          ctx.fillStyle = glowGradient
          ctx.beginPath()
          ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2)
          ctx.fill()
        }

        // Draw star
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${brightness})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, actualSize, 0, Math.PI * 2)
        ctx.fill()
      }

      // Shooting stars
      for (const ss of shootingStarsRef.current) {
        if (ss.delay > 0) {
          ss.delay--
          continue
        }

        if (!ss.active) {
          // Start new shooting star
          ss.active = true
          ss.x = Math.random() * w * 0.8 + w * 0.1
          ss.y = Math.random() * h * 0.3
          ss.length = Math.random() * 100 + 80
          ss.speed = Math.random() * 8 + 5
          ss.opacity = 1
        }

        if (ss.active) {
          // Update position
          ss.x += ss.speed
          ss.y += ss.speed * 0.6
          ss.opacity -= 0.02

          // Draw shooting star
          if (ss.opacity > 0) {
            const gradient = ctx.createLinearGradient(
              ss.x - ss.length, ss.y - ss.length * 0.6,
              ss.x, ss.y
            )
            gradient.addColorStop(0, 'transparent')
            gradient.addColorStop(0.7, `rgba(255, 255, 255, ${ss.opacity * 0.3})`)
            gradient.addColorStop(1, `rgba(255, 255, 255, ${ss.opacity})`)

            ctx.strokeStyle = gradient
            ctx.lineWidth = 2
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(ss.x - ss.length, ss.y - ss.length * 0.6)
            ctx.lineTo(ss.x, ss.y)
            ctx.stroke()

            // Head glow
            ctx.fillStyle = `rgba(255, 255, 255, ${ss.opacity})`
            ctx.beginPath()
            ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2)
            ctx.fill()
          } else {
            // Reset shooting star
            ss.active = false
            ss.delay = Math.random() * 300 + 100
          }
        }
      }

      // Vignette
      const vignetteGradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.75)
      vignetteGradient.addColorStop(0, 'transparent')
      vignetteGradient.addColorStop(0.6, 'transparent')
      vignetteGradient.addColorStop(1, 'rgba(0, 0, 5, 0.6)')
      ctx.fillStyle = vignetteGradient
      ctx.fillRect(0, 0, w, h)

      animationRef.current = requestAnimationFrame(draw)
    }

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
      style={{ background: '#020205' }}
    />
  )
})

export default Stars2Background
