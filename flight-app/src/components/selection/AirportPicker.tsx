import { useEffect, useMemo, useRef, useState } from "react"
import { X } from "lucide-react"
import { animate, motionEnabled } from "@/lib/anim/motion"
import { cn } from "@/lib/utils"
import type { AirportResponseDTO } from "@/lib/services/interfaces/airports.interface"

interface AirportPickerProps {
  role: "origin" | "destination"
  airports: AirportResponseDTO[]
  countryFilter: string | null
  countryFilterLabel?: string | null
  selectedAirportId?: number | null
  onSelect: (airport: AirportResponseDTO) => void
  onClearCountryFilter: () => void
  onClose?: () => void
}

const MAX_RESULTS = 60

export function AirportPicker({
  role,
  airports,
  countryFilter,
  countryFilterLabel,
  selectedAirportId = null,
  onSelect,
  onClearCountryFilter,
  onClose,
}: AirportPickerProps) {
  const [query, setQuery] = useState("")
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root || !motionEnabled()) {
      return
    }
    const animation = animate(root, {
      opacity: [0.72, 1],
      translateY: [8, 0],
      duration: 260,
      ease: "outExpo",
    })
    return () => {
      animation.cancel()
    }
  }, [countryFilter, role])

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
    if (typeof node?.scrollIntoView === "function") {
      node.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex])

  const accent = role === "origin" ? "text-primary" : "text-accent"

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (results.length === 0) {
      if (event.key === "Escape" && onClose) {
        event.preventDefault()
        onClose()
      }
      return
    }

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
      onClose?.()
    }
  }

  return (
    <div
      ref={rootRef}
      className="flex h-full min-h-0 overflow-hidden flex-col rounded-sm border border-primary/40 bg-card/80"
      data-role={role}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className={cn("font-mono text-[10px] uppercase tracking-widest", accent)}>
          {role === "origin" ? "Origin airports" : "Destination airports"}
        </span>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close picker"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
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
            {countryFilterLabel ?? countryFilter}
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
          results.map((airport, index) => {
            const isSelected = Number(airport.id) === selectedAirportId
            return (
              <button
                key={airport.id}
                type="button"
                data-index={index}
                role="option"
                aria-selected={isSelected || index === activeIndex}
                onMouseEnter={() => setHighlight(index)}
                onClick={() => onSelect(airport)}
                className={cn(
                  "flex w-full min-w-0 items-center gap-3 border-l-2 px-3 py-1.5 text-left font-mono text-xs transition-colors",
                  isSelected
                    ? "border-l-data bg-data/10"
                    : index === activeIndex
                      ? "border-l-primary bg-primary/10"
                      : "border-l-transparent hover:bg-secondary/40"
                )}
              >
                <span className="w-10 shrink-0 font-bold text-data">
                  {airport.code_airport}
                </span>
                <span className="min-w-0 flex-1 truncate text-foreground/90">
                  {airport.airport_name}
                </span>
                <span className="max-w-[9rem] shrink-0 truncate uppercase tracking-wider text-muted-foreground">
                  {airport.city}, {airport.country_code}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

export type { AirportPickerProps }
