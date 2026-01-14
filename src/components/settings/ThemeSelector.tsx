import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useSettingsStore } from '@/stores'
import { THEME_CONFIGS, type ThemeType } from '@/types'
import { cn } from '@/utils'

export function ThemeSelector() {
  const { theme, setTheme } = useSettingsStore()

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {THEME_CONFIGS.map((config) => (
        <motion.button
          key={config.id}
          onClick={() => setTheme(config.id)}
          className={cn(
            'group relative overflow-hidden rounded-xl p-3 text-left transition-all',
            'border border-border-glass bg-surface hover:bg-surface-hover',
            theme === config.id && 'ring-2 ring-indigo-500'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Theme Preview Color */}
          <div
            className="mb-2 h-16 rounded-lg"
            style={{
              background: getThemePreviewGradient(config.id),
            }}
          />

          {/* Theme Info */}
          <div>
            <h4 className="font-medium text-white">{config.name}</h4>
            <p className="text-xs text-white/50">{config.description}</p>
          </div>

          {/* Selected Indicator */}
          {theme === config.id && (
            <motion.div
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Check className="h-4 w-4 text-white" />
            </motion.div>
          )}
        </motion.button>
      ))}
    </div>
  )
}

function getThemePreviewGradient(theme: ThemeType): string {
  switch (theme) {
    case 'sunset':
      return 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 50%, #ff6b6b 100%)'
    case 'starwars':
      return 'linear-gradient(135deg, #000000 0%, #0a1628 50%, #000000 100%)'
    case 'starfall':
      return 'linear-gradient(135deg, #0a0a1a 0%, #101428 50%, #0a0a1a 100%)'
    case 'stars':
      return 'linear-gradient(135deg, #0a0a15 0%, #05050d 50%, #020208 100%)'
    case 'stars2':
      return 'linear-gradient(135deg, #0f0f1a 0%, #0a0a14 50%, #020205 100%)'
    case 'aurora':
      return 'linear-gradient(135deg, #0a1628 0%, #1a4a3a 50%, #2a1a4a 100%)'
    case 'ocean':
      return 'linear-gradient(135deg, #0a1a2a 0%, #0a3a5a 50%, #0a1a2a 100%)'
    default:
      return 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
  }
}
