import { memo } from 'react'

/**
 * Midnight Background
 *
 * Fixed dark gradient with no animation, canvas, or JS work after mount.
 * For users who want a low-CPU background option.
 */
const MidnightBackground = memo(function MidnightBackground() {
  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        background:
          'radial-gradient(120% 100% at 50% 0%, #131a2e 0%, #0a0e1a 55%, #05070d 100%)',
      }}
    />
  )
})

export default MidnightBackground
