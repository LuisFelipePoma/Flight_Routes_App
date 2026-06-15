import { useEffect, useRef, useState } from "react"
import { Outlet } from "react-router-dom"
import { GlobeCanvas } from "@/components/globe/GlobeCanvas"
import { HudHeader } from "./HudHeader"
import { HudFrame } from "./HudFrame"
import { StatusBar } from "./StatusBar"
import { CrtOverlay } from "./CrtOverlay"
import { useRouteOverlays } from "@/hooks/use-route-overlays"

/**
 * Persistent cockpit shell. The radar scope (D3 globe) lives here so it
 * survives navigation between the selection and routes consoles — its
 * rotation and the radar sweep never reset. The left column swaps content
 * via <Outlet/>.
 */
export function RadarShell() {
  const scopeRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState({ width: 560, height: 520 })
  const [hoveredCode, setHoveredCode] = useState<string | null>(null)
  const overlays = useRouteOverlays()

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

      <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[420px_1fr]">
        {/* Operator console (per-view) */}
        <div className="min-h-0 overflow-hidden border-r border-border bg-card/30">
          <Outlet />
        </div>

        {/* Persistent radar scope */}
        <div className="relative min-h-0 bg-background">
          <HudFrame>
            <div ref={scopeRef} className="h-full w-full">
              <GlobeCanvas
                width={size.width}
                height={size.height}
                overlayArcs={overlays.arcs}
                overlayEndpoints={overlays.endpoints}
                arcsSignature={overlays.signature}
                onCountryHover={setHoveredCode}
                className="h-full w-full"
              />
            </div>
          </HudFrame>
        </div>
      </div>

      <StatusBar hoveredCode={hoveredCode} />

      <CrtOverlay />
    </div>
  )
}
