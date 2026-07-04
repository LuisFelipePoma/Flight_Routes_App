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
import { useSelectionStore } from "@/stores/selection-store"
import type { SelectionRole } from "@/stores/selection-store"
import { useQDataset } from "@/lib/services/useQDataset"
import { useShallow } from "zustand/shallow"
import { animate, createDrawable, motionEnabled } from "@/lib/anim/motion"

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
  label?: string
}

interface GlobeCanvasProps {
  width?: number
  height?: number
  className?: string
  overlayArcs?: OverlayArc[]
  overlayEndpoints?: OverlayEndpoint[]
  /** Changes whenever the drawn route changes; drives the draw-on animation. */
  arcsSignature?: string
  /** Current side that receives map country clicks. */
  activeRole?: SelectionRole
  /** Reports the ISO code of the currently hovered country (or null). */
  onCountryHover?: (code: string | null) => void
}

const DEFAULT_WIDTH = 560
const DEFAULT_HEIGHT = 520
const DRAG_SENSITIVITY = 0.4
const DEG_TO_RAD = Math.PI / 180

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

function isCoordinateOnVisibleHemisphere(
  lon: number,
  lat: number,
  rotation: [number, number, number]
): boolean {
  const centerLon = -rotation[0] * DEG_TO_RAD
  const centerLat = -rotation[1] * DEG_TO_RAD
  const lonRad = lon * DEG_TO_RAD
  const latRad = lat * DEG_TO_RAD
  const cosDistance =
    Math.sin(centerLat) * Math.sin(latRad) +
    Math.cos(centerLat) * Math.cos(latRad) * Math.cos(lonRad - centerLon)

  return cosDistance > 0
}

export function GlobeCanvas({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  className,
  overlayArcs = [],
  overlayEndpoints = [],
  arcsSignature = "",
  activeRole = "origin",
  onCountryHover,
}: GlobeCanvasProps) {
  const { data: dataset } = useQDataset().query
  const onCountrySelect = useSelectionStore((s) => s.selectCountryFromMap)

  const { originCountryCode, destinationCountryCode } = useSelectionStore(
    useShallow((s) => ({
      originCountryCode: s.originCountryCode,
      destinationCountryCode: s.destinationCountryCode,
    }))
  )

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const rotationRef = useRef<[number, number, number]>([0, 0, 0])

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

    const originCode = originCountryCode
    const destinationCode = destinationCountryCode

    const root = select(wrapperRef.current)
    root.selectAll("*").remove()

    const svg = root
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr(
        "aria-label",
        `Radar scope. Country clicks assign the active ${activeRole}.`
      )
      .attr("data-active-role", activeRole)
      .attr("class", "block h-full w-full")

    if (!dataset?.world) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("class", "fill-muted-foreground text-sm")
        .text("World dataset unavailable")
      return
    }

    const geoWorld = dataset.world as unknown as FeatureCollection<
      Geometry,
      GeoJsonProperties
    >

    const cx = width / 2
    const cy = height / 2

    const projection = geoOrthographic()
      .fitSize([width * 0.92, height * 0.92], geoWorld)
      .translate([cx, cy])
      .rotate(rotationRef.current)

    const pathGenerator = geoPath(projection)
    const graticule = geoGraticule()
    let rotation = projection.rotate() as [number, number, number]

    const placeEndpoint = (endpoint: OverlayEndpoint) => {
      const projected = projection([endpoint.lon, endpoint.lat])
      const visible =
        projected !== null &&
        isCoordinateOnVisibleHemisphere(endpoint.lon, endpoint.lat, rotation) &&
        projected[0] >= -12 &&
        projected[0] <= width + 12 &&
        projected[1] >= -12 &&
        projected[1] <= height + 12

      return {
        transform: projected ? `translate(${projected[0]},${projected[1]})` : "translate(-999,-999)",
        visible,
      }
    }

    // ---- defs: ocean gradient, phosphor glow, sweep gradient, sphere clip ----
    const defs = svg.append("defs")

    const ocean = defs
      .append("radialGradient")
      .attr("id", "scope-ocean")
      .attr("cx", "50%")
      .attr("cy", "42%")
    ocean.append("stop").attr("offset", "0%").attr("stop-color", "var(--globe-ocean)")
    ocean
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#020806")

    const glow = defs
      .append("filter")
      .attr("id", "phosphor-glow")
      .attr("x", "-40%")
      .attr("y", "-40%")
      .attr("width", "180%")
      .attr("height", "180%")
    glow.append("feGaussianBlur").attr("stdDeviation", 2.4).attr("result", "blur")
    const glowMerge = glow.append("feMerge")
    glowMerge.append("feMergeNode").attr("in", "blur")
    glowMerge.append("feMergeNode").attr("in", "SourceGraphic")

    const scopeClip = defs.append("clipPath").attr("id", "scope-clip")
    scopeClip
      .append("path")
      .attr("d", pathGenerator({ type: "Sphere" } as never) ?? "")

    // ---- layers ----
    const sphereGroup = svg.append("g").attr("data-layer", "sphere")
    const globeGroup = svg.append("g").attr("data-layer", "globe")
    const arcGroup = svg
      .append("g")
      .attr("data-layer", "arcs")
      .attr("filter", "url(#phosphor-glow)")
    const endpointGroup = svg
      .append("g")
      .attr("data-layer", "endpoints")
      .attr("clip-path", "url(#scope-clip)")
      .attr("filter", "url(#phosphor-glow)")

    // Sphere (ocean) + rim
    sphereGroup
      .append("path")
      .attr("class", "scope-sphere")
      .attr("d", pathGenerator({ type: "Sphere" } as never) ?? "")
      .attr("fill", "url(#scope-ocean)")
      .attr("stroke", "var(--globe-rim)")
      .attr("stroke-width", 1)

    // Graticule
    globeGroup
      .append("path")
      .attr("class", "graticule")
      .attr("d", pathGenerator(graticule()) ?? "")
      .attr("fill", "none")
      .attr("stroke", "var(--globe-graticule)")
      .attr("stroke-dasharray", "2 3")
      .attr("stroke-width", 0.5)

    // Countries (no SVG filter here — ~250 paths re-render per drag frame)
    const fillForCountry = (feature: unknown): string => {
      const code = getCountryCodeFromFeature(feature)
      if (code && code === originCode) {
        return "rgb(52 255 109 / 0.22)"
      }
      if (code && code === destinationCode) {
        return "rgb(255 176 0 / 0.20)"
      }
      return "var(--globe-land-fill)"
    }
    const strokeForCountry = (feature: unknown): string => {
      const code = getCountryCodeFromFeature(feature)
      if (code && code === originCode) {
        return "var(--color-primary)"
      }
      if (code && code === destinationCode) {
        return "var(--color-accent)"
      }
      return "var(--globe-land-stroke)"
    }

    const countryPaths = globeGroup
      .selectAll<SVGPathElement, unknown>("path.country")
      .data(geoWorld.features)
      .join("path")
      .attr("class", (feature) => {
        const code = getCountryCodeFromFeature(feature)
        const isSelected = code === originCode || code === destinationCode
        return isSelected ? "country selected" : "country"
      })
      .attr("data-country-code", (feature) => getCountryCodeFromFeature(feature) ?? "")
      .attr("d", (feature) => pathGenerator(feature as never) ?? "")
      .attr("fill", fillForCountry)
      .attr("stroke", strokeForCountry)
      .attr("stroke-width", 0.5)
      .style("cursor", "pointer")

    countryPaths
      .on("click", (_event, feature) => {
        const code = getCountryCodeFromFeature(feature)
        if (code && onCountrySelect) {
          onCountrySelect(code)
        }
      })
      .on("mouseover", function (_event, feature) {
        globeGroup.selectAll(".country").classed("hoverPass", false).classed("hoverOff", true)
        select(this).classed("hoverOff", false).classed("hoverPass", true)
        onCountryHover?.(getCountryCodeFromFeature(feature))
      })
      .on("mouseout", function () {
        globeGroup.selectAll(".country").classed("hoverPass", false).classed("hoverOff", false)
        onCountryHover?.(null)
      })

    if (motionEnabled()) {
      const selectedCountries = countryPaths
        .filter((feature) => {
          const code = getCountryCodeFromFeature(feature)
          return code === originCode || code === destinationCode
        })
        .nodes()

      if (selectedCountries.length > 0) {
        animate(selectedCountries, {
          opacity: [0.55, 1],
          duration: 280,
          ease: "outExpo",
        })
      }
    }

    // Arcs
    const arcSelection = arcGroup
      .selectAll<SVGPathElement, (typeof normalizedArcs)[number]>("path.route-arc")
      .data(normalizedArcs, (arc) => arc.id)
      .join("path")
      .attr("class", "route-arc")
      .attr("fill", "none")
      .attr("stroke", "var(--route-arc)")
      .attr("stroke-width", 1.6)
      .attr("stroke-linecap", "round")
      .attr("stroke-opacity", 0.95)
      .attr("d", (arc) => pathGenerator(arc.geometry as never) ?? "")

    // Endpoints (origin dot+blip / destination diamond / stop cross + IATA)
    const endpoints = endpointGroup
      .selectAll<SVGGElement, OverlayEndpoint>("g.endpoint")
      .data(overlayEndpoints, (endpoint) => endpoint.id)
      .join("g")
      .attr("class", "endpoint")
      .attr("data-kind", (endpoint) => endpoint.kind ?? "stop")
      .attr("transform", (endpoint) => {
        return placeEndpoint(endpoint).transform
      })
      .style("display", (endpoint) => (placeEndpoint(endpoint).visible ? null : "none"))

    endpoints.each(function (endpoint) {
      const g = select(this)
      g.selectAll("*").remove()
      const kind = endpoint.kind ?? "stop"

      if (kind === "origin") {
        g.append("circle")
          .attr("class", "blip-ring")
          .attr("r", 5)
          .attr("fill", "none")
          .attr("stroke", "var(--color-primary)")
          .attr("stroke-width", 1.4)
        g.append("circle")
          .attr("class", "endpoint-dot endpoint-origin")
          .attr("r", 3.2)
          .attr("fill", "var(--color-primary)")
          .attr("stroke", "var(--color-primary-foreground)")
          .attr("stroke-width", 1)
      } else if (kind === "destination") {
        g.append("rect")
          .attr("class", "endpoint-dot endpoint-destination")
          .attr("x", -4.5)
          .attr("y", -4.5)
          .attr("width", 9)
          .attr("height", 9)
          .attr("transform", "rotate(45)")
          .attr("fill", "none")
          .attr("stroke", "var(--color-accent)")
          .attr("stroke-width", 1.6)
        g.append("circle")
          .attr("r", 1.6)
          .attr("fill", "var(--color-accent)")
      } else {
        const arm = 3
        g.append("path")
          .attr("class", "endpoint-dot endpoint-stop")
          .attr("d", `M ${-arm} 0 H ${arm} M 0 ${-arm} V ${arm}`)
          .attr("stroke", "var(--route-arc)")
          .attr("stroke-width", 1.4)
      }

      if (endpoint.label) {
        g.append("text")
          .attr("x", 9)
          .attr("y", 3)
          .attr("class", "endpoint-label")
          .attr("fill", kind === "destination" ? "var(--color-accent)" : "var(--route-arc)")
          .attr("font-size", 9)
          .attr("font-family", "var(--font-mono)")
          .attr("letter-spacing", "0.06em")
          .text(endpoint.label)
      }
    })

    // ---- draw-on animation (anime.js), behind motionEnabled ----
    let drawAnimation: { complete: () => void } | null = null
    const arcNodes = arcSelection.nodes()
    if (motionEnabled() && arcsSignature && arcNodes.length > 0) {
      const drawables = arcNodes.map((node) => createDrawable(node)).flat()
      drawAnimation = animate(drawables, {
        draw: ["0 0", "0 1"],
        duration: 900,
        delay: (_: unknown, index: number) => index * 140,
        ease: "inOutSine",
        onComplete: () => {
          // Release dash control so subsequent drag re-projections of `d`
          // (which change path length) can't desync the stroke.
          arcNodes.forEach((node) => {
            node.style.strokeDasharray = "none"
            node.style.strokeDashoffset = "0"
          })
        },
      }) as unknown as { complete: () => void }

      const endpointNodes = endpoints.nodes()
      animate(endpointNodes, {
        scale: [0, 1],
        opacity: [0, 1],
        duration: 360,
        delay: (_: unknown, index: number) => 300 + index * 90,
        ease: "outBack",
      })
    }

    const updateProjectedLayers = () => {
      const spherePath = pathGenerator({ type: "Sphere" } as never) ?? ""
      sphereGroup.select<SVGPathElement>("path.scope-sphere").attr("d", spherePath)
      scopeClip.select<SVGPathElement>("path").attr("d", spherePath)
      countryPaths.attr("d", (feature) => pathGenerator(feature as never) ?? "")
      globeGroup
        .select<SVGPathElement>("path.graticule")
        .attr("d", pathGenerator(graticule()) ?? "")
      arcGroup
        .selectAll<SVGPathElement, (typeof normalizedArcs)[number]>("path.route-arc")
        .attr("d", (arc) => pathGenerator(arc.geometry as never) ?? "")
      endpointGroup
        .selectAll<SVGGElement, OverlayEndpoint>("g.endpoint")
        .attr("transform", (endpoint) => {
          return placeEndpoint(endpoint).transform
        })
        .style("display", (endpoint) => (placeEndpoint(endpoint).visible ? null : "none"))
    }

    const dragBehavior = drag<SVGSVGElement, unknown>().on(
      "drag",
      (event: D3DragEvent<SVGSVGElement, unknown, unknown>) => {
        // Finalize any running draw-on so D3 fully owns `d` during drag.
        if (drawAnimation) {
          drawAnimation.complete()
          arcNodes.forEach((node) => {
            node.style.strokeDasharray = "none"
            node.style.strokeDashoffset = "0"
          })
          drawAnimation = null
        }
        const [currentX, currentY, currentZ] = rotation
        const nextRotation: [number, number, number] = [
          currentX + event.dx * DRAG_SENSITIVITY,
          Math.max(-90, Math.min(90, currentY - event.dy * DRAG_SENSITIVITY)),
          currentZ,
        ]
        rotation = nextRotation
        rotationRef.current = nextRotation
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
    dataset?.world,
    height,
    width,
    normalizedArcs,
    overlayEndpoints,
    arcsSignature,
    activeRole,
    originCountryCode,
    destinationCountryCode,
    onCountrySelect,
    onCountryHover,
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
