/**
 * Single entry point for anime.js across the app.
 *
 * Every animation must sit behind `motionEnabled()` so that:
 *  - users with `prefers-reduced-motion: reduce` get instant, static UI, and
 *  - jsdom (which has no `matchMedia`) runs tests synchronously with no flake.
 */
export {
  animate,
  createTimeline,
  createScope,
  stagger,
  svg,
  utils,
  createDrawable,
} from "animejs"

export type EaseName =
  | "linear"
  | "outExpo"
  | "outQuad"
  | "inQuad"
  | "inOutSine"
  | "outCubic"
  | "inOutQuad"

/** Returns false in jsdom (no matchMedia) and under reduced-motion. */
export function motionEnabled(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false
  }
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export const durations = {
  fast: 180,
  base: 320,
  reveal: 560,
  draw: 900,
} as const

export const easing = {
  reveal: "outExpo" as EaseName,
  exit: "inQuad" as EaseName,
  draw: "inOutSine" as EaseName,
}
