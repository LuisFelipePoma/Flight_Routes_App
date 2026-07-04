import { useMemo } from "react"
import type { OverlayArc, OverlayEndpoint } from "@/components/globe/GlobeCanvas"
import type { AirportResponseDTO } from "@/lib/services/interfaces/airports.interface"
import { useQDataset } from "@/lib/services/useQDataset"
import { useRoutesStore } from "@/stores/routes-store"

interface RouteOverlays {
  arcs: OverlayArc[]
  endpoints: OverlayEndpoint[]
  /** Stable signature of the drawn route, for triggering draw-on animation. */
  signature: string
}

const EMPTY: RouteOverlays = { arcs: [], endpoints: [], signature: "" }

function buildOverlays(
  airportIds: number[],
  airportsById: Map<number, AirportResponseDTO>
): RouteOverlays {
  const endpoints: OverlayEndpoint[] = []
  for (let index = 0; index < airportIds.length; index += 1) {
    const airport = airportsById.get(airportIds[index])
    if (!airport) {
      continue
    }
    const kind =
      index === 0
        ? "origin"
        : index === airportIds.length - 1
          ? "destination"
          : "stop"
    endpoints.push({
      id: `endpoint-${airport.id}-${index}`,
      lon: parseFloat(airport.lon),
      lat: parseFloat(airport.lat),
      kind,
      label: kind === "stop" ? undefined : airport.code_airport,
    })
  }

  const arcs: OverlayArc[] = []
  for (let index = 0; index < airportIds.length - 1; index += 1) {
    const from = airportsById.get(airportIds[index])
    const to = airportsById.get(airportIds[index + 1])
    if (!from || !to) {
      continue
    }
    arcs.push({
      id: `arc-${from.id}-${to.id}-${index}`,
      from: [parseFloat(from.lon), parseFloat(from.lat)],
      to: [parseFloat(to.lon), parseFloat(to.lat)],
    })
  }

  return { arcs, endpoints, signature: airportIds.join("-") }
}

/**
 * Derives globe overlay geometry from the active route result.
 * Single-page flow: result presence owns the scope overlays.
 */
export function useRouteOverlays(): RouteOverlays {
  const { data: dataset } = useQDataset().query
  const result = useRoutesStore((state) => state.result)

  const airportsById = useMemo(
    () =>
      new Map(
        (dataset?.airports ?? []).map((airport) => [Number(airport.id), airport])
      ),
    [dataset]
  )

  return useMemo(() => {
    if (!result || result.status !== "ok" || result.airportIds.length === 0) {
      return EMPTY
    }
    return buildOverlays(result.airportIds, airportsById)
  }, [result, airportsById])
}
