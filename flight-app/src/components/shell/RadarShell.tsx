import { useEffect, useRef, useState } from "react"
import { Outlet } from "react-router-dom"
import { GlobeCanvas } from "@/components/globe/GlobeCanvas"
import { HudHeader } from "./HudHeader"
import { HudFrame } from "./HudFrame"
import { StatusBar } from "./StatusBar"
import { useRouteOverlays } from "@/hooks/use-route-overlays"
import { useSelectionStore } from "@/stores/selection-store"

/**
 * Persistent app shell. The D3 globe lives here so map rotation and route
 * overlays stay stable while the planner panel updates.
 */
export function RadarShell() {
  const scopeRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 560, height: 520 })
  const [hoveredCode, setHoveredCode] = useState<string | null>(null)
  const overlays = useRouteOverlays()
  const activeRole = useSelectionStore((s) => s.activeRole)

  useEffect(() => {
    const node = scopeRef.current
    if (!node || typeof ResizeObserver === "undefined") {
      return
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) {
        setSize({ width: Math.round(width), height: Math.round(height) })
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="grid h-dvh w-screen grid-rows-[auto_1fr_auto] overflow-hidden bg-background text-foreground">
      <HudHeader />

      <div className="grid min-h-0 grid-rows-[minmax(0,0.58fr)_minmax(0,0.42fr)] lg:grid-cols-[520px_1fr] lg:grid-rows-1">
        {/* Planner panel */}
        <div className="min-h-0 overflow-hidden border-r border-border bg-card/30">
          <Outlet />
        </div>

        {/* Persistent map */}
        <div className="relative min-h-0 bg-background">
          <HudFrame>
            <div ref={scopeRef} className="h-full w-full">
              <GlobeCanvas
                width={size.width}
                height={size.height}
                overlayArcs={overlays.arcs}
                overlayEndpoints={overlays.endpoints}
                arcsSignature={overlays.signature}
                activeRole={activeRole}
                onCountryHover={setHoveredCode}
                className="h-full w-full"
              />
            </div>
          </HudFrame>
        </div>
      </div>

      <StatusBar hoveredCode={hoveredCode} />
    </div>
  )
}
