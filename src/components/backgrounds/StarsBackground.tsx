import { useEffect, useRef, memo } from 'react'

/**
 * Stars Background
 *
 * Beautiful twinkling starfield with depth layers
 * Connected constellation lines between nearby stars
 */

interface Star {
  x: number
  y: number
  size: number
  brightness: number
  twinkleSpeed: number
  twinkleOffset: number
  color: { r: number; g: number; b: number }
  vx: number
  vy: number
}

const StarColors = [
  { r: 255, g: 255, b: 255 }, // White
  { r: 200, g: 220, b: 255 }, // Blue-white
  { r: 255, g: 240, b: 220 }, // Warm white
  { r: 180, g: 200, b: 255 }, // Light blue
  { r: 255, g: 220, b: 200 }, // Warm
]

const StarsBackground = memo(function StarsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const starsRef = useRef<Star[]>([])
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const starCount = 200
    const connectionDistance = 100

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }

    const initStars = () => {
      starsRef.current = []
      for (let i = 0; i < starCount; i++) {
        const colorIndex = Math.floor(Math.random() * StarColors.length)
        const color = StarColors[colorIndex] ?? { r: 255, g: 255, b: 255 }
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          brightness: Math.random() * 0.5 + 0.5,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          twinkleOffset: Math.random() * Math.PI * 2,
          color,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
        })
      }
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const w = canvas.width
      const h = canvas.height
      timeRef.current += 0.016

      // Dark gradient background
      const bgGradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h))
      bgGradient.addColorStop(0, '#0a0a15')
      bgGradient.addColorStop(0.5, '#05050d')
      bgGradient.addColorStop(1, '#020208')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, w, h)

      // Subtle milky way
      const milkyWay = ctx.createLinearGradient(0, h * 0.3, w, h * 0.7)
      milkyWay.addColorStop(0, 'transparent')
      milkyWay.addColorStop(0.3, 'rgba(50, 50, 80, 0.03)')
      milkyWay.addColorStop(0.5, 'rgba(60, 60, 100, 0.05)')
      milkyWay.addColorStop(0.7, 'rgba(50, 50, 80, 0.03)')
      milkyWay.addColorStop(1, 'transparent')
      ctx.fillStyle = milkyWay
      ctx.fillRect(0, 0, w, h)

      // Draw constellation connections first (behind stars)
      ctx.strokeStyle = 'rgba(100, 150, 200, 0.1)'
      ctx.lineWidth = 0.5
      const stars = starsRef.current
      for (let i = 0; i < stars.length; i++) {
        const star1 = stars[i]
        if (!star1) continue
        for (let j = i + 1; j < stars.length; j++) {
          const star2 = stars[j]
          if (!star2) continue
          const dx = star1.x - star2.x
          const dy = star1.y - star2.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.15
            ctx.strokeStyle = `rgba(100, 150, 200, ${opacity})`
            ctx.beginPath()
            ctx.moveTo(star1.x, star1.y)
            ctx.lineTo(star2.x, star2.y)
            ctx.stroke()
          }
        }
      }

      // Update and draw stars
      for (const star of starsRef.current) {
        // Slow movement
        star.x += star.vx
        star.y += star.vy

        // Wrap around edges
        if (star.x < 0) star.x = w
        if (star.x > w) star.x = 0
        if (star.y < 0) star.y = h
        if (star.y > h) star.y = 0

        // Calculate twinkle
        const twinkle = Math.sin(timeRef.current * star.twinkleSpeed * 60 + star.twinkleOffset)
        const brightness = star.brightness * (0.7 + twinkle * 0.3)

        // Draw star glow
        const glowSize = star.size * 4
        const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowSize)
        glowGradient.addColorStop(0, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${brightness * 0.3})`)
        glowGradient.addColorStop(0.5, `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${brightness * 0.1})`)
        glowGradient.addColorStop(1, 'transparent')
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(star.x, star.y, glowSize, 0, Math.PI * 2)
        ctx.fill()

        // Draw star core
        ctx.fillStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${brightness})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fill()

        // Draw star cross/sparkle for brighter stars
        if (star.size > 1.3 && brightness > 0.7) {
          const sparkleSize = star.size * 3
          ctx.strokeStyle = `rgba(255, 255, 255, ${brightness * 0.5})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(star.x - sparkleSize, star.y)
          ctx.lineTo(star.x + sparkleSize, star.y)
          ctx.moveTo(star.x, star.y - sparkleSize)
          ctx.lineTo(star.x, star.y + sparkleSize)
          ctx.stroke()
        }
      }

      // Vignette
      const vignetteGradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.75)
      vignetteGradient.addColorStop(0, 'transparent')
      vignetteGradient.addColorStop(0.7, 'transparent')
      vignetteGradient.addColorStop(1, 'rgba(0, 0, 10, 0.5)')
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
      style={{ background: '#020208' }}
    />
  )
})

export default StarsBackground
