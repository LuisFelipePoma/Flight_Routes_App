import { useEffect, useMemo } from "react"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { RouteSummary } from "@/components/routes/RouteSummary"
import { AlgorithmSelector } from "@/components/routes/AlgorithmSelector"
import { Button } from "@/components/ui/button"
import type { AlgorithmKey } from "@/lib/types/flight"
import { useRoutesStore } from "@/stores/routes-store"
import { useSelectionStore } from "@/stores/selection-store"
import { useQDataset } from "@/lib/services/useQDataset"
import type { AirportResponseDTO } from "@/lib/services/interfaces/airports.interface"
import { useDataStore } from "@/stores/data-store"
import { useConsoleTransition } from "@/hooks/use-console-transition"
import { useRevealSequence } from "@/hooks/use-reveal-sequence"

export function RoutesPage() {
  const { data: datasets } = useQDataset().query
  const graph = useDataStore((s) => s.graph)
  const originId = useSelectionStore((state) => state.originId)
  const destinationId = useSelectionStore((state) => state.destinationId)
  const algorithm = useRoutesStore((state) => state.algorithm)
  const result = useRoutesStore((state) => state.result)
  const computeState = useRoutesStore((state) => state.computeState)
  const setAlgorithm = useRoutesStore((state) => state.setAlgorithm)
  const primeContext = useRoutesStore((state) => state.primeContext)
  const computeRoute = useRoutesStore((state) => state.computeRoute)
  const clearResult = useRoutesStore((state) => state.clearResult)

  const { consoleRef, transitionTo } = useConsoleTransition<HTMLDivElement>()
  const revealRef = useRevealSequence<HTMLDivElement>()

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

  const hasPrerequisites =
    graph !== null &&
    originId !== null &&
    destinationId !== null &&
    originId !== destinationId

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
    transitionTo("/")
  }

  return (
    <div ref={consoleRef} className="h-full min-h-0">
      <section
        ref={revealRef}
        aria-labelledby="routes-page-title"
        className="grid h-full min-h-0 grid-rows-[auto_auto_1fr_auto] gap-4 p-5"
      >
        <header data-reveal className="shrink-0">
          <h1 id="routes-page-title" className="text-lg text-primary [text-shadow:var(--shadow-glow-green)]">
            Route computation
          </h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            Select pathfinding mode · scope renders live
          </p>
        </header>

        <div data-reveal>
          <AlgorithmSelector
            algorithm={algorithm}
            onChange={handleAlgorithmChange}
            disabled={computeState === "computing"}
          />
        </div>

        <div data-reveal className="min-h-0 overflow-hidden rounded-sm border border-border bg-card/40 p-3">
          {result?.status === "no-route" ? (
            <p role="status" className="mb-2 font-mono text-[11px] text-accent">
              No route exists between the selected airports for the active algorithm.
            </p>
          ) : null}

          {!result ? (
            <p role="status" className="font-mono text-[11px] text-muted-foreground">
              No calculation yet. Choose an algorithm and run a calculation.
            </p>
          ) : (
            <RouteSummary result={result} airportsById={airportsRecord} />
          )}
        </div>

        <div data-reveal className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            onClick={handleRecalculate}
            disabled={!hasPrerequisites || computeState === "computing"}
            className="font-display text-xs tracking-[0.16em]"
          >
            <RefreshCw className="size-3.5" />
            {computeState === "computing" ? "Computing…" : "Recompute"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleBackToSelection}
            className="font-display text-xs tracking-[0.16em]"
          >
            <ArrowLeft className="size-3.5" />
            Back to selection
          </Button>
        </div>
      </section>
    </div>
  )
}
