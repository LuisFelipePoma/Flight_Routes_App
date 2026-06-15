import { useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { animate, durations, easing, motionEnabled } from "@/lib/anim/motion"

/**
 * Exit choreography: slides the active console out before navigating,
 * leaving the persistent radar scope untouched. Navigation is synchronous
 * when motion is disabled (reduced-motion / jsdom), so tests don't flake.
 */
export function useConsoleTransition<T extends HTMLElement = HTMLDivElement>() {
  const consoleRef = useRef<T | null>(null)
  const navigate = useNavigate()

  const transitionTo = useCallback(
    (path: string) => {
      const node = consoleRef.current
      if (!node || !motionEnabled()) {
        navigate(path)
        return
      }
      animate(node, {
        opacity: [1, 0],
        translateX: [0, -28],
        duration: durations.fast,
        ease: easing.exit,
        onComplete: () => navigate(path),
      })
    },
    [navigate]
  )

  return { consoleRef, transitionTo }
}
