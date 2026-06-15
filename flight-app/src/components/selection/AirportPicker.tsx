import { useEffect, useMemo, useRef, useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AirportResponseDTO } from "@/lib/services/interfaces/airports.interface"

interface AirportPickerProps {
  role: "origin" | "destination"
  airports: AirportResponseDTO[]
  countryFilter: string | null
  onSelect: (airport: AirportResponseDTO) => void
  onClearCountryFilter: () => void
  onClose: () => void
}

const MAX_RESULTS = 60

export function AirportPicker({
  role,
  airports,
  countryFilter,
  onSelect,
  onClearCountryFilter,
  onClose,
}: AirportPickerProps) {
  const [query, setQuery] = useState("")
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const scoped = countryFilter
      ? airports.filter((a) => a.country_code === countryFilter)
      : airports
    const matched = q
      ? scoped.filter(
          (a) =>
            a.code_airport.toLowerCase().includes(q) ||
            a.airport_name.toLowerCase().includes(q) ||
            a.city.toLowerCase().includes(q) ||
            a.country.toLowerCase().includes(q)
        )
      : scoped
    return matched.slice(0, MAX_RESULTS)
  }, [airports, countryFilter, query])

  // Keep the highlight in range as results shrink, without a reset effect.
  const activeIndex = highlight < results.length ? highlight : 0

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    node?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  const accent = role === "origin" ? "text-primary" : "text-accent"

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setHighlight(Math.min(activeIndex + 1, results.length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlight(Math.max(activeIndex - 1, 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      const choice = results[activeIndex]
      if (choice) onSelect(choice)
    } else if (event.key === "Escape") {
      event.preventDefault()
      onClose()
    }
  }

  return (
    <div
      className="flex min-h-0 flex-col rounded-sm border border-primary/40 bg-card/80"
      data-role={role}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className={cn("font-mono text-[10px] uppercase tracking-widest", accent)}>
          {role === "origin" ? "Select origin" : "Select destination"}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close picker"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className={cn("font-mono text-sm", accent)} aria-hidden>
          &gt;
        </span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlight(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder="IATA / city / airport / country"
          aria-label="Search airports"
          className="w-full bg-transparent font-mono text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
        />
      </div>

      {countryFilter ? (
        <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Filter
          </span>
          <button
            type="button"
            onClick={onClearCountryFilter}
            className="flex items-center gap-1 rounded-xs border border-primary/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-primary transition-colors hover:bg-primary/10"
          >
            {countryFilter}
            <X className="size-3" />
          </button>
        </div>
      ) : null}

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto" role="listbox" aria-label="Airports">
        {results.length === 0 ? (
          <p className="px-3 py-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            No matching airports
          </p>
        ) : (
          results.map((airport, index) => (
            <button
              key={airport.id}
              type="button"
              data-index={index}
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setHighlight(index)}
              onClick={() => onSelect(airport)}
              className={cn(
                "flex w-full items-center gap-3 px-3 py-1.5 text-left font-mono text-xs transition-colors",
                index === activeIndex ? "bg-primary/10" : "hover:bg-secondary/40"
              )}
            >
              <span className="w-10 shrink-0 font-bold text-data">{airport.code_airport}</span>
              <span className="flex-1 truncate text-foreground/90">{airport.airport_name}</span>
              <span className="shrink-0 uppercase tracking-wider text-muted-foreground">
                {airport.city}, {airport.country_code}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

export type { AirportPickerProps }
