import { useEffect, useMemo, useState } from "react"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FlightStrip } from "./FlightStrip"
import { AirportPicker } from "./AirportPicker"
import { useSelectionStore } from "@/stores/selection-store"
import { useDataStore } from "@/stores/data-store"
import type { AirportResponseDTO } from "@/lib/services/interfaces/airports.interface"
import { useRevealSequence } from "@/hooks/use-reveal-sequence"

interface SelectionConsoleProps {
  isLoading?: boolean
  validationMessage?: string | null
  onSubmit: () => void
}

type Role = "origin" | "destination"

export function SelectionConsole({
  isLoading = false,
  validationMessage,
  onSubmit,
}: SelectionConsoleProps) {
  const airports = useDataStore((s) => s.airports)
  const originId = useSelectionStore((s) => s.originId)
  const destinationId = useSelectionStore((s) => s.destinationId)
  const originCountryCode = useSelectionStore((s) => s.originCountryCode)
  const destinationCountryCode = useSelectionStore((s) => s.destinationCountryCode)
  const setOrigin = useSelectionStore((s) => s.setOrigin)
  const setDestination = useSelectionStore((s) => s.setDestination)
  const setOriginCountry = useSelectionStore((s) => s.setOriginCountry)
  const setDestinationCountry = useSelectionStore((s) => s.setDestinationCountry)

  const [activeRole, setActiveRole] = useState<Role | null>(null)
  // Tracks which scope country the operator explicitly cleared. When the scope
  // changes (e.g. a new globe click) it no longer matches, so the filter
  // re-applies — no effect/setState needed.
  const [clearedScope, setClearedScope] = useState<string | null>(null)

  const rootRef = useRevealSequence<HTMLDivElement>()

  const airportById = useMemo(() => {
    const map = new Map<number, AirportResponseDTO>()
    for (const a of airports) map.set(Number(a.id), a)
    return map
  }, [airports])

  const originAirport = originId !== null ? airportById.get(originId) ?? null : null
  const destinationAirport =
    destinationId !== null ? airportById.get(destinationId) ?? null : null

  const ready =
    originId !== null && destinationId !== null && originId !== destinationId && !isLoading
  const submitDisabled = !ready || Boolean(validationMessage)

  // Keyboard shortcuts: O / D open the matching picker.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return
      }
      if (event.key === "o" || event.key === "O") {
        setActiveRole("origin")
      } else if (event.key === "d" || event.key === "D") {
        setActiveRole("destination")
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const openPicker = (role: Role) => {
    setActiveRole(role)
  }

  const handlePick = (airport: AirportResponseDTO) => {
    const id = Number(airport.id)
    if (activeRole === "origin") {
      setOriginCountry(airport.country_code)
      setOrigin(id)
    } else if (activeRole === "destination") {
      setDestinationCountry(airport.country_code)
      setDestination(id)
    }
    setActiveRole(null)
  }

  const scopeCountry =
    activeRole === "origin"
      ? originCountryCode
      : activeRole === "destination"
        ? destinationCountryCode
        : null
  const countryFilter = scopeCountry && clearedScope === scopeCountry ? null : scopeCountry

  return (
    <section
      ref={rootRef}
      aria-labelledby="selection-page-title"
      className="flex h-full min-h-0 flex-col gap-4 p-5"
    >
      <header data-reveal className="shrink-0">
        <h1 id="selection-page-title" className="text-lg text-primary [text-shadow:var(--shadow-glow-green)]">
          Route selection
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          Assign origin & destination, then engage routing
        </p>
      </header>

      <div data-reveal className="shrink-0">
        <FlightStrip
          role="origin"
          airport={originAirport}
          active={activeRole === "origin"}
          invalid={Boolean(validationMessage)}
          onActivate={() => openPicker("origin")}
        />
      </div>

      <div data-reveal className="flex items-center justify-center" aria-hidden>
        <span className="font-mono text-xs tracking-widest text-muted-foreground">▽ VECTOR ▽</span>
      </div>

      <div data-reveal className="shrink-0">
        <FlightStrip
          role="destination"
          airport={destinationAirport}
          active={activeRole === "destination"}
          invalid={Boolean(validationMessage)}
          onActivate={() => openPicker("destination")}
        />
      </div>

      {validationMessage ? (
        <p role="alert" aria-live="assertive" className="shrink-0 font-mono text-xs text-destructive">
          ⚠ {validationMessage}
        </p>
      ) : null}

      {activeRole ? (
        <div className="min-h-0 flex-1">
          <AirportPicker
            role={activeRole}
            airports={airports}
            countryFilter={countryFilter}
            onSelect={handlePick}
            onClearCountryFilter={() => setClearedScope(scopeCountry)}
            onClose={() => setActiveRole(null)}
          />
        </div>
      ) : (
        <div data-reveal className="min-h-0 flex-1 rounded-sm border border-dashed border-border p-3">
          <p className="font-mono text-[11px] uppercase leading-relaxed tracking-wider text-muted-foreground">
            Tip — click a strip, press{" "}
            <kbd className="rounded-xs border border-border px-1 text-primary">O</kbd> /{" "}
            <kbd className="rounded-xs border border-border px-1 text-accent">D</kbd>, or click a
            country on the scope to scope the search.
          </p>
        </div>
      )}

      <div data-reveal className="shrink-0">
        <Button
          type="button"
          onClick={() => !submitDisabled && onSubmit()}
          disabled={submitDisabled}
          className="h-11 w-full font-display text-sm tracking-[0.2em] shadow-glow-green disabled:shadow-none"
        >
          {isLoading ? "Loading datasets…" : "Initiate routing"}
          {!isLoading ? <ArrowRight className="size-4" /> : null}
        </Button>
      </div>
    </section>
  )
}

export type { SelectionConsoleProps }
