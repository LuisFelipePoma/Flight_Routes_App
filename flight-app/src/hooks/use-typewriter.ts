import { useEffect, useState } from "react"
import { animate, motionEnabled } from "@/lib/anim/motion"

/**
 * Types `text` out character by character when motion is enabled,
 * otherwise returns it immediately (reduced-motion / jsdom).
 */
export function useTypewriter(text: string, speed = 18): string {
  const [shown, setShown] = useState(text)

  useEffect(() => {
    if (!motionEnabled()) {
      return
    }
    const proxy = { n: 0 }
    const animation = animate(proxy, {
      n: text.length,
      duration: text.length * speed,
      ease: "linear",
      onUpdate: () => {
        setShown(text.slice(0, Math.round(proxy.n)))
      },
      onComplete: () => setShown(text),
    })
    return () => {
      animation.cancel()
    }
  }, [text, speed])

  // Reduced motion / jsdom: render the final text with no animation.
  return motionEnabled() ? shown : text
}
