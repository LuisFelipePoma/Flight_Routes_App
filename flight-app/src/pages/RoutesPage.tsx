import { useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { GlobeCanvas, type OverlayArc, type OverlayEndpoint } from "@/components/globe/GlobeCanvas"
import { RouteSummary } from "@/components/routes/RouteSummary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AlgorithmKey } from "@/lib/types/flight"
import { useRoutesStore } from "@/stores/routes-store"
import { useSelectionStore } from "@/stores/selection-store"
import { useQDataset } from "@/lib/services/useQDataset"
import type { AirportResponseDTO } from "@/lib/services/interfaces/airports.interface"
import { useDataStore } from "@/stores/data-store"

const ALGORITHMS: { key: AlgorithmKey; label: string; description: string }[] = [
  {
    key: "dijkstra",
    label: "Dijkstra",
    description: "Shortest weighted path",
  },
  {
    key: "dfs",
    label: "DFS",
    description: "Depth-first traversal path",
  },
  {
    key: "prim",
    label: "Prim",
    description: "MST frontier-derived path",
  },
]

function toOverlayData(
  airportIds: number[],
  airportsById: Map<number, { id: number; lat: number; lon: number }>
): { arcs: OverlayArc[]; endpoints: OverlayEndpoint[] } {
  const endpoints = airportIds
    .map((id, index) => {
      const airport = airportsById.get(id)
      if (!airport) {
        return null
      }

      const kind =
        index === 0
          ? "origin"
          : index === airportIds.length - 1
            ? "destination"
            : "stop"

      return {
        id: `endpoint-${id}-${index}`,
        lon: airport.lon,
        lat: airport.lat,
        kind,
      } satisfies OverlayEndpoint
    })
    .filter((value) => value !== null)

  const arcs: OverlayArc[] = []
  for (let index = 0; index < airportIds.length - 1; index += 1) {
    const from = airportsById.get(airportIds[index])
    const to = airportsById.get(airportIds[index + 1])
    if (!from || !to) {
      continue
    }

    arcs.push({
      id: `arc-${from.id}-${to.id}-${index}`,
      from: [from.lon, from.lat],
      to: [to.lon, to.lat],
    })
  }

  return { arcs, endpoints }
}

export function RoutesPage() {
  const navigate = useNavigate()
  const { data: datasets } = useQDataset().query
  const graph = useDataStore(s => s.graph)
  const originId = useSelectionStore((state) => state.originId)
  const destinationId = useSelectionStore((state) => state.destinationId)
  const algorithm = useRoutesStore((state) => state.algorithm)
  const result = useRoutesStore((state) => state.result)
  const computeState = useRoutesStore((state) => state.computeState)
  const setAlgorithm = useRoutesStore((state) => state.setAlgorithm)
  const primeContext = useRoutesStore((state) => state.primeContext)
  const computeRoute = useRoutesStore((state) => state.computeRoute)
  const clearResult = useRoutesStore((state) => state.clearResult)
  useEffect(() => {
    primeContext({ originId, destinationId })
  }, [destinationId, originId, primeContext])

  useEffect(() => {
    if (originId === null || destinationId === null || originId === destinationId) {
      return
    }
    primeContext({ originId, destinationId })
    if (graph) {
      computeRoute(graph)
    }
    // intentionally compute only on page ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const airportsById = useMemo(
    () =>
      new Map(
        (datasets?.airports ?? []).map((airport) => [
          Number(airport.id),
          {
            id: Number(airport.id),
            lat: parseFloat(airport.lat),
            lon: parseFloat(airport.lon),
          },
        ])
      ),
    [datasets]
  )

  const overlays = useMemo(() => {
    if (!result || result.status !== "ok" || result.airportIds.length === 0) {
      return {
        arcs: [],
        endpoints: [],
      }
    }

    return toOverlayData(result.airportIds, airportsById)
  }, [airportsById, result])

  const airportsRecord = useMemo(
    () =>
      (datasets?.airports ?? []).reduce<Record<number, AirportResponseDTO>>(
        (acc, airport) => {
          acc[Number(airport.id)] = airport
          return acc
        },
        {}
      ),
    [datasets]
  )

  const hasPrerequisites = graph !== null && originId !== null && destinationId !== null && originId !== destinationId

  const handleAlgorithmChange = (next: AlgorithmKey) => {
    setAlgorithm(next)
    primeContext({ originId, destinationId })
    if (hasPrerequisites) {
      computeRoute(graph)
    }
  }

  const handleRecalculate = () => {
    primeContext({ originId, destinationId })
    if (hasPrerequisites) {
      computeRoute(graph)
    }
  }

  const handleBackToSelection = () => {
    clearResult()
    navigate("/")
  }

  return (
    <main className="h-screen w-screen bg-background px-6 py-8 text-foreground">
      <section
        className="grid w-full gap-6 lg:grid-cols-[1.2fr_1fr] h-full"
        aria-labelledby="routes-page-title"
      >
        <Card>
          <CardHeader>
            <CardTitle id="routes-page-title">Route visualization</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-rows-[1fr_8fr_1fr] gap-4 h-full">
            <section className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Algorithm selector">
                {ALGORITHMS.map((item) => (
                  <Button
                    key={item.key}
                    type="button"
                    variant={algorithm === item.key ? "default" : "outline"}
                    onClick={() => handleAlgorithmChange(item.key)}
                    aria-pressed={algorithm === item.key}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              <p className="text-sm text-muted-foreground">
                {ALGORITHMS.find((item) => item.key === algorithm)?.description}
              </p>
            </section>

            <section className="h-full overflow-hidden rounded-lg border border-border bg-background">
              <GlobeCanvas
                overlayArcs={overlays.arcs}
                overlayEndpoints={overlays.endpoints}
                className="h-full"
              />
            </section>

            <section className="flex flex-col">
              {result?.status === "no-route" ? (
                <p role="status" className="text-sm text-muted-foreground">
                  No route exists between the selected airports for the active algorithm.
                </p>
              ) : null}

              {!result ? (
                <p role="status" className="text-sm text-muted-foreground">
                  No calculation yet. Choose an algorithm and run a calculation.
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={handleRecalculate}
                  disabled={!hasPrerequisites || computeState === "computing"}
                >
                  {computeState === "computing" ? "Calculating..." : "Recalculate route"}
                </Button>
                <Button type="button" variant="outline" onClick={handleBackToSelection}>
                  Back to selection
                </Button>

              </div>
            </section>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Accessible route details</CardTitle>
          </CardHeader>
          <CardContent className="h-full">
            <RouteSummary result={result} airportsById={airportsRecord} />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
