import { memo } from 'react'

/**
 * Deep Forest Background
 *
 * Fixed dark gradient with no animation, canvas, or JS work after mount.
 * For users who want a low-CPU background option.
 */
const ForestBackground = memo(function ForestBackground() {
  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        background:
          'radial-gradient(120% 100% at 50% 0%, #10251a 0%, #0a1510 55%, #050a07 100%)',
      }}
    />
  )
})

export default ForestBackground
