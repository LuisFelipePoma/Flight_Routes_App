import { useEffect, useRef } from "react"
import {
  createScope,
  createTimeline,
  stagger,
  durations,
  easing,
  motionEnabled,
} from "@/lib/anim/motion"

/**
 * Entrance choreography for a console panel. Elements tagged with
 * `data-reveal` translate/fade in with a staggered "power-on".
 *
 * Re-runs whenever `key` changes (used to replay on view switch).
 * No-ops under reduced motion / jsdom, leaving elements fully visible.
 */
export function useRevealSequence<T extends HTMLElement = HTMLDivElement>(
  key?: unknown
) {
  const rootRef = useRef<T | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root || !motionEnabled()) {
      return
    }

    const scope = createScope({ root }).add(() => {
      const targets = root.querySelectorAll<HTMLElement>("[data-reveal]")
      if (targets.length === 0) {
        return
      }
      createTimeline({
        defaults: { ease: easing.reveal, duration: durations.reveal },
      }).add(targets, {
        opacity: [0, 1],
        translateY: [14, 0],
        scaleY: [0.96, 1],
        delay: stagger(70),
      })
    })

    return () => scope.revert()
  }, [key])

  return rootRef
}
