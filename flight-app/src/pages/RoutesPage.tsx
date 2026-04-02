import { useEffect, useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"

import { GlobeCanvas, type OverlayArc, type OverlayEndpoint } from "@/components/globe/GlobeCanvas"
import { RouteSummary } from "@/components/routes/RouteSummary"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Airport, AlgorithmKey } from "@/lib/types/flight"
import { useRoutesStore } from "@/stores/routes-store"
import { useSelectionStore } from "@/stores/selection-store"

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
    .filter((value): value is OverlayEndpoint => value !== null)

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

  const datasets = useSelectionStore((state) => state.datasets)
  const graph = useSelectionStore((state) => state.graph)
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
    primeContext({ graph, originId, destinationId })
  }, [destinationId, graph, originId, primeContext])

  useEffect(() => {
    if (!graph || originId === null || destinationId === null || originId === destinationId) {
      return
    }

    computeRoute()
    // intentionally compute only on page ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const airportsById = useMemo(
    () =>
      new Map(
        (datasets?.airports ?? []).map((airport) => [
          airport.id,
          airport,
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
      (datasets?.airports ?? []).reduce<Record<number, Airport>>(
        (acc, airport) => {
          acc[airport.id] = airport
          return acc
        },
        {}
      ),
    [datasets]
  )

  const hasPrerequisites = graph !== null && originId !== null && destinationId !== null && originId !== destinationId

  const handleAlgorithmChange = (next: AlgorithmKey) => {
    setAlgorithm(next)
    primeContext({ graph, originId, destinationId })
    if (hasPrerequisites) {
      computeRoute()
    }
  }

  const handleRecalculate = () => {
    primeContext({ graph, originId, destinationId })
    if (hasPrerequisites) {
      computeRoute()
    }
  }

  const handleBackToSelection = () => {
    clearResult()
    navigate("/")
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <section
        className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.2fr_1fr]"
        aria-labelledby="routes-page-title"
      >
        <Card>
          <CardHeader>
            <CardTitle id="routes-page-title">Route visualization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div className="h-[460px] overflow-hidden rounded-lg border border-border">
              <GlobeCanvas
                world={datasets?.world ?? null}
                overlayArcs={overlays.arcs}
                overlayEndpoints={overlays.endpoints}
                className="h-full"
              />
            </div>

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
              <Button asChild type="button" variant="ghost">
                <Link to="/">Open selection page</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accessible route details</CardTitle>
          </CardHeader>
          <CardContent>
            <RouteSummary result={result} airportsById={airportsRecord} />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
