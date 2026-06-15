import { useEffect, useRef } from "react"
import { animate, motionEnabled } from "@/lib/anim/motion"

interface DistanceCounterProps {
  value: number
  className?: string
}

/**
 * Renders `{value} km` as real text content (so tests/jsdom see the final
 * value immediately) and, when motion is enabled, counts up to it on mount.
 */
export function DistanceCounter({ value, className }: DistanceCounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !motionEnabled()) {
      return
    }
    const proxy = { v: 0 }
    const animation = animate(proxy, {
      v: value,
      duration: 900,
      ease: "outExpo",
      onUpdate: () => {
        el.textContent = `${proxy.v.toFixed(2)} km`
      },
      onComplete: () => {
        el.textContent = `${value.toFixed(2)} km`
      },
    })
    return () => {
      animation.cancel()
    }
  }, [value])

  return (
    <span ref={ref} className={className}>
      {value.toFixed(2)} km
    </span>
  )
}

export type { DistanceCounterProps }
