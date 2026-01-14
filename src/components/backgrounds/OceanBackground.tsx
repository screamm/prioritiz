import { useCallback, useMemo, useEffect, useState, memo } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Container, ISourceOptions } from '@tsparticles/engine'

/**
 * Cinematic Deep Ocean Background
 *
 * Serene underwater atmosphere with volumetric light rays,
 * floating particles, and gentle caustic patterns
 */
const OceanBackground = memo(function OceanBackground() {
  const [init, setInit] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setInit(true)
    })
  }, [])

  const particlesLoaded = useCallback(async (_container: Container | undefined) => {}, [])

  // Floating plankton/marine snow
  const planktonOptions: ISourceOptions = useMemo(() => ({
    fullScreen: false,
    fpsLimit: 60,
    particles: {
      number: { value: 100, density: { enable: true, width: 1920, height: 1080 } },
      color: { value: ['#ffffff', '#e0f4ff', '#c8ecff', '#a8e0ff'] },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.15, max: 0.5 },
        animation: { enable: true, speed: 0.3, sync: false },
      },
      size: {
        value: { min: 0.5, max: 2.5 },
        animation: { enable: true, speed: 0.5, sync: false },
      },
      move: {
        enable: true,
        speed: { min: 0.1, max: 0.4 },
        direction: 'top' as const,
        straight: false,
        outModes: { default: 'out' as const },
        drift: { min: -0.3, max: 0.3 },
      },
      wobble: {
        enable: true,
        distance: 8,
        speed: { min: 1, max: 3 },
      },
    },
    detectRetina: true,
  }), [])

  // Rising bubbles
  const bubblesOptions: ISourceOptions = useMemo(() => ({
    fullScreen: false,
    fpsLimit: 60,
    particles: {
      number: { value: 35, density: { enable: true, width: 1920, height: 1080 } },
      color: { value: ['#ffffff', '#e8f8ff'] },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.2, max: 0.5 },
        animation: { enable: true, speed: 0.5, sync: false },
      },
      size: {
        value: { min: 2, max: 8 },
        animation: { enable: true, speed: 1, sync: false },
      },
      move: {
        enable: true,
        speed: { min: 0.5, max: 1.5 },
        direction: 'top' as const,
        straight: false,
        outModes: { default: 'out' as const },
      },
      wobble: {
        enable: true,
        distance: 15,
        speed: { min: 2, max: 5 },
      },
      stroke: {
        width: 1,
        color: { value: 'rgba(255, 255, 255, 0.3)' },
      },
    },
    detectRetina: true,
  }), [])

  // Light dust particles catching god rays
  const lightDustOptions: ISourceOptions = useMemo(() => ({
    fullScreen: false,
    fpsLimit: 30,
    particles: {
      number: { value: 60, density: { enable: true, width: 1920, height: 1080 } },
      color: { value: ['#ffffff', '#d4f0ff'] },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.05, max: 0.25 },
        animation: { enable: true, speed: 0.2, sync: false },
      },
      size: { value: { min: 1, max: 4 } },
      move: {
        enable: true,
        speed: { min: 0.05, max: 0.2 },
        direction: 'none' as const,
        random: true,
        outModes: { default: 'bounce' as const },
      },
      twinkle: {
        particles: { enable: true, frequency: 0.03, opacity: 0.6 },
      },
    },
    detectRetina: true,
  }), [])

  const gradientStyle = {
    background: `linear-gradient(180deg,
      #0a2a3a 0%,
      #083040 15%,
      #062838 30%,
      #052030 50%,
      #041828 70%,
      #031220 85%,
      #020a18 100%
    )`,
  }

  if (!init) {
    return <div className="fixed inset-0 z-0" style={gradientStyle} />
  }

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* Deep ocean gradient */}
      <div className="absolute inset-0" style={gradientStyle} />

      {/* Volumetric light rays from surface */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute top-0 origin-top"
            style={{
              left: `${15 + i * 18}%`,
              width: '8%',
              height: '100%',
              background: `linear-gradient(180deg,
                rgba(120, 200, 255, ${0.15 - i * 0.02}) 0%,
                rgba(80, 180, 255, ${0.08 - i * 0.01}) 30%,
                rgba(60, 160, 255, ${0.04 - i * 0.005}) 60%,
                transparent 100%
              )`,
              filter: 'blur(20px)',
              transform: `rotate(${-8 + i * 4}deg) scaleX(${1 + i * 0.2})`,
              animation: `lightRay ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Caustic light patterns */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-overlay"
        style={{
          background: `
            radial-gradient(ellipse 30% 20% at 25% 20%, rgba(100, 200, 255, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse 25% 15% at 55% 35%, rgba(80, 180, 255, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse 20% 18% at 75% 25%, rgba(120, 210, 255, 0.35) 0%, transparent 50%),
            radial-gradient(ellipse 28% 16% at 40% 50%, rgba(90, 190, 255, 0.25) 0%, transparent 50%)
          `,
          animation: 'caustics 15s ease-in-out infinite',
        }}
      />

      {/* Light dust particles */}
      <Particles
        id="light-dust"
        className="absolute inset-0"
        options={lightDustOptions}
        particlesLoaded={particlesLoaded}
      />

      {/* Plankton layer */}
      <Particles
        id="plankton"
        className="absolute inset-0"
        options={planktonOptions}
        particlesLoaded={particlesLoaded}
      />

      {/* Bubbles layer */}
      <Particles
        id="bubbles"
        className="absolute inset-0"
        options={bubblesOptions}
        particlesLoaded={particlesLoaded}
      />

      {/* Surface shimmer */}
      <div
        className="absolute top-0 left-0 right-0 h-[15%]"
        style={{
          background: `linear-gradient(180deg,
            rgba(100, 200, 255, 0.1) 0%,
            rgba(80, 180, 255, 0.05) 50%,
            transparent 100%
          )`,
          animation: 'shimmer 4s ease-in-out infinite',
        }}
      />

      {/* Depth fog */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(0deg,
            rgba(2, 10, 24, 0.8) 0%,
            rgba(3, 18, 32, 0.4) 30%,
            transparent 60%
          )`,
        }}
      />

      {/* Cinematic vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 30%, rgba(0, 5, 15, 0.6) 100%)',
        }}
      />

      {/* Animations */}
      <style>{`
        @keyframes lightRay {
          0%, 100% { opacity: 0.6; transform: rotate(var(--rotation, 0deg)) scaleX(var(--scale, 1)); }
          50% { opacity: 1; transform: rotate(calc(var(--rotation, 0deg) + 2deg)) scaleX(calc(var(--scale, 1) * 1.1)); }
        }
        @keyframes caustics {
          0%, 100% { transform: scale(1) translateX(0); }
          33% { transform: scale(1.05) translateX(2%); }
          66% { transform: scale(0.98) translateX(-2%); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
})

export default OceanBackground
