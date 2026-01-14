import { useCallback, useMemo, useEffect, useState, memo } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Container, ISourceOptions } from '@tsparticles/engine'

/**
 * Cinematic Aurora Borealis Background
 *
 * Realistic northern lights with flowing light curtains,
 * atmospheric depth, and twinkling arctic stars
 */
const AuroraBackground = memo(function AuroraBackground() {
  const [init, setInit] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setInit(true)
    })
  }, [])

  const particlesLoaded = useCallback(async (_container: Container | undefined) => {}, [])

  // Arctic stars - cold, crisp, twinkling
  const starsOptions: ISourceOptions = useMemo(() => ({
    fullScreen: false,
    fpsLimit: 30,
    particles: {
      number: { value: 180, density: { enable: true, width: 1920, height: 1080 } },
      color: { value: ['#ffffff', '#f0f8ff', '#e6f2ff', '#cce5ff'] },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.1, max: 0.9 },
        animation: { enable: true, speed: 0.5, sync: false },
      },
      size: { value: { min: 0.3, max: 2 } },
      move: {
        enable: true,
        speed: 0.02,
        direction: 'none' as const,
        random: true,
        outModes: { default: 'bounce' as const },
      },
      twinkle: {
        particles: { enable: true, frequency: 0.08, opacity: 1 },
      },
    },
    detectRetina: true,
  }), [])

  // Aurora particles - large, blurred, flowing (toned down)
  const auroraOptions: ISourceOptions = useMemo(() => ({
    fullScreen: false,
    fpsLimit: 60,
    particles: {
      number: { value: 25, density: { enable: true, width: 1920, height: 1080 } },
      color: { value: ['#40c090', '#30a080', '#209070', '#50b0a0'] },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.08, max: 0.2 },
        animation: { enable: true, speed: 0.2, sync: false },
      },
      size: {
        value: { min: 60, max: 150 },
        animation: { enable: true, speed: 1.5, sync: false },
      },
      move: {
        enable: true,
        speed: { min: 0.2, max: 0.5 },
        direction: 'right' as const,
        straight: false,
        outModes: { default: 'out' as const, top: 'bounce' as const, bottom: 'bounce' as const },
      },
    },
    detectRetina: true,
  }), [])

  // Secondary aurora - purple/pink accents (toned down)
  const auroraAccentOptions: ISourceOptions = useMemo(() => ({
    fullScreen: false,
    fpsLimit: 60,
    particles: {
      number: { value: 15, density: { enable: true, width: 1920, height: 1080 } },
      color: { value: ['#9060c0', '#8050b0', '#7040a0'] },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.05, max: 0.15 },
        animation: { enable: true, speed: 0.3, sync: false },
      },
      size: {
        value: { min: 50, max: 120 },
        animation: { enable: true, speed: 1, sync: false },
      },
      move: {
        enable: true,
        speed: { min: 0.15, max: 0.4 },
        direction: 'left' as const,
        straight: false,
        outModes: { default: 'out' as const },
      },
    },
    detectRetina: true,
  }), [])

  const gradientStyle = {
    background: `linear-gradient(180deg,
      #000510 0%,
      #010818 20%,
      #020c22 40%,
      #051228 60%,
      #081830 80%,
      #0a1a28 100%
    )`,
  }

  if (!init) {
    return <div className="fixed inset-0 z-0" style={gradientStyle} />
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Night sky base */}
      <div className="absolute inset-0" style={gradientStyle} />

      {/* Atmospheric haze at horizon */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(0deg,
              rgba(10, 30, 50, 0.9) 0%,
              rgba(8, 25, 45, 0.6) 15%,
              rgba(5, 20, 40, 0.3) 30%,
              transparent 50%
            )
          `,
        }}
      />

      {/* Stars layer */}
      <Particles
        id="aurora-stars"
        className="absolute inset-0"
        style={{ height: '80%' }}
        options={starsOptions}
        particlesLoaded={particlesLoaded}
      />

      {/* Main aurora - green/cyan (toned down) */}
      <div
        className="absolute inset-0"
        style={{ filter: 'blur(80px)', opacity: 0.4, top: '-10%', height: '70%' }}
      >
        <Particles
          id="aurora-main"
          className="absolute inset-0"
          options={auroraOptions}
          particlesLoaded={particlesLoaded}
        />
      </div>

      {/* Secondary aurora - purple/pink (toned down) */}
      <div
        className="absolute inset-0"
        style={{ filter: 'blur(100px)', opacity: 0.3, top: '5%', height: '50%' }}
      >
        <Particles
          id="aurora-accent"
          className="absolute inset-0"
          options={auroraAccentOptions}
          particlesLoaded={particlesLoaded}
        />
      </div>

      {/* Aurora glow overlay (subtle) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 120% 50% at 50% 20%, rgba(60, 180, 120, 0.04) 0%, transparent 50%),
            radial-gradient(ellipse 80% 40% at 30% 30%, rgba(50, 160, 130, 0.03) 0%, transparent 40%),
            radial-gradient(ellipse 60% 35% at 70% 25%, rgba(120, 80, 180, 0.03) 0%, transparent 40%)
          `,
        }}
      />

      {/* Horizon silhouette - mountains/trees */}
      <svg
        className="absolute bottom-0 left-0 right-0 h-[12%] w-full"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a1520" />
            <stop offset="100%" stopColor="#050a10" />
          </linearGradient>
        </defs>
        {/* Mountain range */}
        <path
          d="M0,120 L0,80 Q60,70 120,75 T240,65 Q300,55 360,60 T480,50 Q540,45 600,48 T720,42 Q780,38 840,45 T960,40 Q1020,35 1080,42 T1200,38 Q1260,45 1320,50 T1440,55 L1440,120 Z"
          fill="url(#mountainGrad)"
        />
        {/* Foreground trees */}
        <path
          d="M0,120 L0,95 L20,95 L30,70 L40,95 L60,95 L75,60 L90,95 L110,95 L110,120 Z"
          fill="#030810"
        />
        <path
          d="M1350,120 L1350,90 L1370,90 L1385,55 L1400,90 L1420,90 L1430,70 L1440,90 L1440,120 Z"
          fill="#030810"
        />
      </svg>

      {/* Cinematic vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 85% 85% at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.5) 100%)',
        }}
      />

      {/* Subtle film grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
})

export default AuroraBackground
