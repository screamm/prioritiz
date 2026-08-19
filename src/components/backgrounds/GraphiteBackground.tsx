import { memo } from 'react'

/**
 * Graphite Background
 *
 * Fixed dark gradient with no animation, canvas, or JS work after mount.
 * For users who want a low-CPU background option.
 */
const GraphiteBackground = memo(function GraphiteBackground() {
  return (
    <div
      className="fixed inset-0 z-0"
      style={{
        background:
          'radial-gradient(120% 100% at 50% 0%, #2a2a2e 0%, #1a1a1d 55%, #0d0d0f 100%)',
      }}
    />
  )
})

export default GraphiteBackground
