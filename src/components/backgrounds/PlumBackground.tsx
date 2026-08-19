import { memo } from 'react'

/**
 * Plum Night Background
 *
 * Fixed dark gradient with no animation, canvas, or JS work after mount.
 * For users who want a low-CPU background option.
 */
const PlumBackground = memo(function PlumBackground() {
  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        background:
          'radial-gradient(120% 100% at 50% 0%, #2a1030 0%, #150a1f 55%, #08040c 100%)',
      }}
    />
  )
})

export default PlumBackground
