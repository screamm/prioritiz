import { Suspense, lazy, useMemo, memo } from 'react'
import type { ReactNode, ComponentType } from 'react'
import { useSettingsStore } from '@/stores'
import type { ThemeType } from '@/types'

const SunsetBackground = lazy(() => import('./SunsetBackground'))
const StarWarsBackground = lazy(() => import('./StarWarsBackground'))
const StarfallBackground = lazy(() => import('./StarfallBackground'))
const StarsBackground = lazy(() => import('./StarsBackground'))
const Stars2Background = lazy(() => import('./Stars2Background'))
const AuroraBackground = lazy(() => import('./AuroraBackground'))
const OceanBackground = lazy(() => import('./OceanBackground'))

const backgroundComponents: Record<ThemeType, ComponentType> = {
  sunset: SunsetBackground,
  starwars: StarWarsBackground,
  starfall: StarfallBackground,
  stars: StarsBackground,
  stars2: Stars2Background,
  aurora: AuroraBackground,
  ocean: OceanBackground,
}

interface BackgroundProviderProps {
  children: ReactNode
}

const BackgroundFallback = memo(function BackgroundFallback() {
  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        background: 'linear-gradient(180deg, #0f0720 0%, #1a0a2e 50%, #000000 100%)',
      }}
    />
  )
})

const BackgroundProvider = memo(function BackgroundProvider({ children }: BackgroundProviderProps) {
  const theme = useSettingsStore((state) => state.theme)

  const BackgroundComponent = useMemo(() => {
    return backgroundComponents[theme] || backgroundComponents.starfall
  }, [theme])

  return (
    <>
      <Suspense fallback={<BackgroundFallback />}>
        <BackgroundComponent />
      </Suspense>
      <div className="relative z-10">{children}</div>
    </>
  )
})

export default BackgroundProvider
