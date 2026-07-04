import { useEffect, useMemo, useRef } from "react"
import { PlaneLanding, PlaneTakeoff, RefreshCw, Search } from "lucide-react"
import { AlgorithmSelector } from "@/components/routes/AlgorithmSelector"
import { RouteSummary } from "@/components/routes/RouteSummary"
import { AirportPicker } from "@/components/selection/AirportPicker"
import { FlightStrip } from "@/components/selection/FlightStrip"
import { Button } from "@/components/ui/button"
import { useRevealSequence } from "@/hooks/use-reveal-sequence"
import { cn } from "@/lib/utils"
import type { AirportResponseDTO } from "@/lib/services/interfaces/airports.interface"
import { useQDataset } from "@/lib/services/useQDataset"
import type { FlightGraph } from "@/lib/types/flight"
import { useDataStore } from "@/stores/data-store"
import { useRoutesStore } from "@/stores/routes-store"
import { useSelectionStore, type SelectionRole } from "@/stores/selection-store"

const ROLE_COPY: Record<
  SelectionRole,
  { label: string; short: string; icon: typeof PlaneTakeoff; tone: string }
> = {
  origin: {
    label: "Origin",
    short: "From",
    icon: PlaneTakeoff,
    tone: "text-primary border-primary/60 bg-primary/10",
  },
  destination: {
    label: "Destination",
    short: "To",
    icon: PlaneLanding,
    tone: "text-accent border-accent/60 bg-accent/10",
  },
}

function buildAirportRecord(
  airports: AirportResponseDTO[]
): Record<number, AirportResponseDTO> {
  return airports.reduce<Record<number, AirportResponseDTO>>((acc, airport) => {
    acc[Number(airport.id)] = airport
    return acc
  }, {})
}

function buildCountryNameRecord(airports: AirportResponseDTO[]): Record<string, string> {
  return airports.reduce<Record<string, string>>((acc, airport) => {
    acc[airport.country_code] = airport.country
    return acc
  }, {})
}

function makeRouteKey(
  originId: number | null,
  destinationId: number | null,
  algorithm: string
): string {
  return `${originId ?? "x"}:${destinationId ?? "x"}:${algorithm}`
}

export function FlightPlannerPage() {
  const query = useQDataset().query
  const { data: dataset, isLoading } = query
  const isError = Boolean(query.isError)

  const seedData = useDataStore((s) => s.seedData)
  const graph = useDataStore((s) => s.graph)
  const airports = useDataStore((s) => s.airports)

  const activeRole = useSelectionStore((s) => s.activeRole)
  const originId = useSelectionStore((s) => s.originId)
  const destinationId = useSelectionStore((s) => s.destinationId)
  const originCountryCode = useSelectionStore((s) => s.originCountryCode)
  const destinationCountryCode = useSelectionStore((s) => s.destinationCountryCode)
  const setActiveRole = useSelectionStore((s) => s.setActiveRole)
  const setOrigin = useSelectionStore((s) => s.setOrigin)
  const setDestination = useSelectionStore((s) => s.setDestination)
  const setOriginCountry = useSelectionStore((s) => s.setOriginCountry)
  const setDestinationCountry = useSelectionStore((s) => s.setDestinationCountry)

  const algorithm = useRoutesStore((s) => s.algorithm)
  const result = useRoutesStore((s) => s.result)
  const computeState = useRoutesStore((s) => s.computeState)
  const setAlgorithm = useRoutesStore((s) => s.setAlgorithm)
  const primeContext = useRoutesStore((s) => s.primeContext)
  const computeRoute = useRoutesStore((s) => s.computeRoute)

  const revealRef = useRevealSequence<HTMLDivElement>()
  const lastAutoRun = useRef<{ key: string; graph: FlightGraph } | null>(null)

  useEffect(() => {
    if (dataset) {
      seedData(dataset.routes, dataset.airports)
    }
  }, [dataset, seedData])

  const airportsById = useMemo(() => buildAirportRecord(airports), [airports])
  const countryNameByCode = useMemo(() => buildCountryNameRecord(airports), [airports])

  const originAirport = originId !== null ? airportsById[originId] ?? null : null
  const destinationAirport =
    destinationId !== null ? airportsById[destinationId] ?? null : null

  const activeCountryCode =
    activeRole === "origin" ? originCountryCode : destinationCountryCode
  const activeAirportId = activeRole === "origin" ? originId : destinationId
  const activeCountryName =
    activeCountryCode !== null ? countryNameByCode[activeCountryCode] : null

  const hasRouteInput =
    originId !== null && destinationId !== null && originId !== destinationId
  const sameAirport =
    originId !== null && destinationId !== null && originId === destinationId

  useEffect(() => {
    if (!hasRouteInput) {
      lastAutoRun.current = null
      primeContext({ originId, destinationId })
      return
    }

    if (!graph) {
      return
    }

    const key = makeRouteKey(originId, destinationId, algorithm)
    if (
      lastAutoRun.current?.key === key &&
      lastAutoRun.current.graph === graph
    ) {
      return
    }

    lastAutoRun.current = { key, graph }
    primeContext({ originId, destinationId })
    computeRoute(graph)
  }, [
    algorithm,
    computeRoute,
    destinationId,
    graph,
    hasRouteInput,
    originId,
    primeContext,
  ])

  const handlePickAirport = (airport: AirportResponseDTO) => {
    const id = Number(airport.id)

    if (activeRole === "origin") {
      setOriginCountry(airport.country_code)
      setOrigin(id)
      if (destinationId === null || destinationId === id) {
        setActiveRole("destination")
      }
      return
    }

    setDestinationCountry(airport.country_code)
    setDestination(id)
    if (originId === null || originId === id) {
      setActiveRole("origin")
    }
  }

  const handleClearCountryFilter = () => {
    if (activeRole === "origin") {
      setOriginCountry(null)
    } else {
      setDestinationCountry(null)
    }
  }

  const handleRecompute = () => {
    if (!hasRouteInput || !graph) {
      return
    }
    lastAutoRun.current = { key: makeRouteKey(originId, destinationId, algorithm), graph }
    primeContext({ originId, destinationId })
    computeRoute(graph)
  }

  const statusText = isError
    ? "Dataset link unavailable"
    : isLoading
      ? "Loading flight data"
      : sameAirport
        ? "Choose two different airports"
        : result?.status === "ok"
          ? "Route ready"
          : result?.status === "no-route"
            ? "No route for active mode"
            : result?.status === "error"
              ? "Calculation failed"
              : hasRouteInput
                ? "Solving route"
                : "Awaiting complete route"

  return (
    <div
      ref={revealRef}
      className="grid h-full min-h-0 grid-rows-[auto_auto_auto_minmax(0,1fr)_auto] gap-3 overflow-hidden p-4 lg:p-5"
    >
      <header data-reveal className="shrink-0">
        <h1 className="text-base text-primary [text-shadow:var(--shadow-glow-green)]">
          Flight planner
        </h1>
        <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <Search className="size-3 text-data" />
          <span>{statusText}</span>
        </div>
      </header>

      <div
        data-reveal
        className="grid grid-cols-2 gap-1 rounded-sm border border-border bg-secondary/20 p-1"
        role="tablist"
        aria-label="Active selection side"
      >
        {(["origin", "destination"] as const).map((role) => {
          const meta = ROLE_COPY[role]
          const Icon = meta.icon
          const isActive = activeRole === role
          return (
            <button
              key={role}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveRole(role)}
              className={cn(
                "flex h-9 items-center justify-center gap-2 rounded-sm border px-2 font-mono text-[10px] uppercase tracking-widest transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? meta.tone
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" />
              <span>{meta.label}</span>
            </button>
          )
        })}
      </div>

      <div data-reveal className="grid gap-2">
        <FlightStrip
          role="origin"
          airport={originAirport}
          active={activeRole === "origin"}
          invalid={sameAirport}
          onActivate={() => setActiveRole("origin")}
        />
        <FlightStrip
          role="destination"
          airport={destinationAirport}
          active={activeRole === "destination"}
          invalid={sameAirport}
          onActivate={() => setActiveRole("destination")}
        />
      </div>

      <div
        data-reveal
        className="grid min-h-0 grid-rows-[minmax(118px,0.44fr)_auto_minmax(0,0.56fr)] gap-3 overflow-hidden"
      >
        <div className="min-h-0 overflow-hidden">
          <AirportPicker
            role={activeRole}
            airports={airports}
            countryFilter={activeCountryCode}
            countryFilterLabel={
              activeCountryCode && activeCountryName
                ? `${activeCountryName} (${activeCountryCode})`
                : activeCountryCode
            }
            selectedAirportId={activeAirportId}
            onSelect={handlePickAirport}
            onClearCountryFilter={handleClearCountryFilter}
          />
        </div>

        <AlgorithmSelector
          algorithm={algorithm}
          onChange={setAlgorithm}
          disabled={computeState === "computing"}
        />

        <div className="min-h-0 overflow-hidden rounded-sm border border-border bg-card/40 p-3">
          <RouteSummary result={result} airportsById={airportsById} />
        </div>
      </div>

      <footer data-reveal className="flex shrink-0 items-center gap-2">
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-sm border px-2 py-2 font-mono text-[10px] uppercase tracking-widest",
            ROLE_COPY[activeRole].tone
          )}
        >
          <span className="shrink-0">{ROLE_COPY[activeRole].short}</span>
          <span className="truncate text-foreground/80">
            {activeCountryCode
              ? activeCountryName ?? activeCountryCode
              : "Global search"}
          </span>
        </div>
        <Button
          type="button"
          onClick={handleRecompute}
          disabled={!hasRouteInput || !graph || computeState === "computing"}
          className="h-9 font-display text-[10px] tracking-[0.16em]"
        >
          <RefreshCw className={cn("size-3.5", computeState === "computing" && "animate-spin")} />
          Recompute
        </Button>
      </footer>
    </div>
  )
}
