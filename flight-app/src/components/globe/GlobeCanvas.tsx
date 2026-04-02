import { useEffect, useMemo, useRef } from "react"
import {
  drag,
  geoGraticule,
  geoOrthographic,
  geoPath,
  select,
  type D3DragEvent,
} from "d3"
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson"

import type { WorldDataset } from "@/lib/data/datasets"

interface OverlayArc {
  id: string
  from: [number, number]
  to: [number, number]
}

interface OverlayEndpoint {
  id: string
  lon: number
  lat: number
  kind?: "origin" | "destination" | "stop"
}

interface GlobeCanvasProps {
  world: WorldDataset | null
  width?: number
  height?: number
  className?: string
  selectedCountryCode?: string | null
  overlayArcs?: OverlayArc[]
  overlayEndpoints?: OverlayEndpoint[]
  onCountrySelect?: (countryCode: string) => void
}

const DEFAULT_WIDTH = 860
const DEFAULT_HEIGHT = 520
const DRAG_SENSITIVITY = 0.4

const ENDPOINT_STYLE: Record<
  NonNullable<OverlayEndpoint["kind"]>,
  { fill: string; stroke: string }
> = {
  origin: {
    fill: "var(--color-primary)",
    stroke: "var(--color-primary-foreground)",
  },
  destination: {
    fill: "var(--color-chart-2)",
    stroke: "var(--color-primary-foreground)",
  },
  stop: {
    fill: "var(--color-muted-foreground)",
    stroke: "var(--color-background)",
  },
}

function getCountryCodeFromFeature(feature: unknown): string | null {
  if (!feature || typeof feature !== "object") {
    return null
  }

  const source = feature as Record<string, unknown>
  if (typeof source.id === "string" && source.id.length > 0) {
    return source.id
  }

  return null
}

export function GlobeCanvas({
  world,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  className,
  selectedCountryCode,
  overlayArcs = [],
  overlayEndpoints = [],
  onCountrySelect,
}: GlobeCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const normalizedArcs = useMemo(
    () =>
      overlayArcs.map((arc) => ({
        ...arc,
        geometry: {
          type: "LineString" as const,
          coordinates: [arc.from, arc.to],
        },
      })),
    [overlayArcs]
  )

  useEffect(() => {
    if (!wrapperRef.current) {
      return
    }

    const root = select(wrapperRef.current)
    root.selectAll("*").remove()

    const svg = root
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "Interactive globe for country and route visualization")
      .attr("class", "block h-full w-full")

    if (!world) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("class", "fill-muted-foreground text-sm")
        .text("World dataset unavailable")
      return
    }

    const geoWorld = world as unknown as FeatureCollection<Geometry, GeoJsonProperties>

    const projection = geoOrthographic()
      .fitSize([width * 0.9, height * 0.9], geoWorld)
      .translate([width / 2, height / 2])
      .rotate([0, 0])

    const pathGenerator = geoPath(projection)
    const graticule = geoGraticule()
    let rotation = projection.rotate() as [number, number, number]

    const globeGroup = svg.append("g").attr("data-layer", "globe")
    const arcGroup = svg.append("g").attr("data-layer", "arcs")
    const endpointGroup = svg.append("g").attr("data-layer", "endpoints")

    const countryPaths = globeGroup
      .selectAll<SVGPathElement, unknown>("path.country")
      .data(geoWorld.features)
      .join("path")
      .attr("class", (feature) => {
        const code = getCountryCodeFromFeature(feature)
        const isSelected = code !== null && selectedCountryCode === code
        return isSelected ? "country selected" : "country"
      })
      .attr("data-country-code", (feature) => getCountryCodeFromFeature(feature) ?? "")
      .attr("d", (feature) => pathGenerator(feature as never) ?? "")
      .attr("fill", "var(--color-secondary)")
      .attr("stroke", "var(--color-border)")
      .attr("stroke-width", 0.6)
      .style("cursor", onCountrySelect ? "pointer" : "default")

    countryPaths
      .filter((feature) => getCountryCodeFromFeature(feature) === selectedCountryCode)
      .attr("fill", "var(--color-primary)")

    if (onCountrySelect) {
      countryPaths.on("click", (_event, feature) => {
        const countryCode = getCountryCodeFromFeature(feature)
        if (countryCode) {
          onCountrySelect(countryCode)
        }
      })
    }

    globeGroup
      .append("path")
      .attr("class", "graticule")
      .attr("d", pathGenerator(graticule()) ?? "")
      .attr("fill", "none")
      .attr("stroke", "var(--color-muted-foreground)")
      .attr("stroke-opacity", 0.35)
      .attr("stroke-width", 0.5)

    countryPaths
      .on("mouseover", function () {
        globeGroup.selectAll(".country").classed("hoverPass", false).classed("hoverOff", true)
        select(this).classed("hoverOff", false).classed("hoverPass", true)
      })
      .on("mouseout", function () {
        globeGroup.selectAll(".country").classed("hoverPass", false).classed("hoverOff", false)
      })

    const updateProjectedLayers = () => {
      countryPaths.attr("d", (feature) => pathGenerator(feature as never) ?? "")

      globeGroup
        .selectAll<SVGPathElement, unknown>("path.graticule")
        .attr("d", pathGenerator(graticule()) ?? "")

      arcGroup
        .selectAll<SVGPathElement, (typeof normalizedArcs)[number]>("path.route-arc")
        .attr("d", (arc) => pathGenerator(arc.geometry as never) ?? "")

      endpointGroup
        .selectAll<SVGGElement, OverlayEndpoint>("g.endpoint")
        .attr("transform", (endpoint) => {
          const projected = projection([endpoint.lon, endpoint.lat])
          return projected ? `translate(${projected[0]},${projected[1]})` : "translate(-999,-999)"
        })
    }

    arcGroup
      .selectAll<SVGPathElement, (typeof normalizedArcs)[number]>("path.route-arc")
      .data(normalizedArcs, (arc) => arc.id)
      .join("path")
      .attr("class", "route-arc")
      .attr("fill", "none")
      .attr("stroke", "var(--color-chart-3)")
      .attr("stroke-width", 1.8)
      .attr("stroke-linecap", "round")
      .attr("stroke-opacity", 0.95)
      .attr("d", (arc) => pathGenerator(arc.geometry as never) ?? "")

    const endpoints = endpointGroup
      .selectAll<SVGGElement, OverlayEndpoint>("g.endpoint")
      .data(overlayEndpoints, (endpoint) => endpoint.id)
      .join((enter) => {
        const endpoint = enter.append("g").attr("class", "endpoint")
        endpoint.append("circle").attr("class", "endpoint-dot")
        return endpoint
      })

    endpoints
      .attr("transform", (endpoint) => {
        const projected = projection([endpoint.lon, endpoint.lat])
        return projected ? `translate(${projected[0]},${projected[1]})` : "translate(-999,-999)"
      })
      .attr("data-kind", (endpoint) => endpoint.kind ?? "stop")

    endpoints
      .select<SVGCircleElement>("circle.endpoint-dot")
      .attr("r", (endpoint) => (endpoint.kind === "origin" || endpoint.kind === "destination" ? 6 : 4))
      .attr("class", (endpoint) => {
        const kind = endpoint.kind ?? "stop"
        return `endpoint-dot endpoint-${kind}`
      })
      .attr("fill", (endpoint) => ENDPOINT_STYLE[endpoint.kind ?? "stop"].fill)
      .attr("stroke", (endpoint) => ENDPOINT_STYLE[endpoint.kind ?? "stop"].stroke)
      .attr("stroke-width", 1.5)

    const dragBehavior = drag<SVGSVGElement, unknown>().on(
      "drag",
      (event: D3DragEvent<SVGSVGElement, unknown, unknown>) => {
        const [currentX, currentY, currentZ] = rotation
        const nextRotation: [number, number, number] = [
          currentX + event.dx * DRAG_SENSITIVITY,
          Math.max(-90, Math.min(90, currentY - event.dy * DRAG_SENSITIVITY)),
          currentZ,
        ]

        rotation = nextRotation
        projection.rotate(nextRotation)
        updateProjectedLayers()
      }
    )

    svg.call(dragBehavior)

    return () => {
      svg.on(".drag", null)
      root.selectAll("*").remove()
    }
  }, [
    className,
    height,
    normalizedArcs,
    onCountrySelect,
    overlayEndpoints,
    selectedCountryCode,
    width,
    world,
  ])

  return (
    <div
      ref={wrapperRef}
      className={className}
      data-testid="globe-canvas"
      aria-live="polite"
    />
  )
}

export type { GlobeCanvasProps, OverlayArc, OverlayEndpoint }
