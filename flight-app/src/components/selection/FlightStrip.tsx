import { cn } from "@/lib/utils"
import type { AirportResponseDTO } from "@/lib/services/interfaces/airports.interface"

interface FlightStripProps {
  role: "origin" | "destination"
  airport: AirportResponseDTO | null
  active: boolean
  invalid?: boolean
  onActivate: () => void
}

const ROLE_META = {
  origin: { tag: "ORIG", hint: "O", accent: "text-primary", bar: "bg-primary", glow: "shadow-glow-green" },
  destination: { tag: "DEST", hint: "D", accent: "text-accent", bar: "bg-accent", glow: "shadow-glow-amber" },
} as const

function fmtCoord(value: string, axis: "lat" | "lon"): string {
  const n = parseFloat(value)
  if (!Number.isFinite(n)) return "––"
  const hemi = axis === "lat" ? (n >= 0 ? "N" : "S") : n >= 0 ? "E" : "W"
  return `${Math.abs(n).toFixed(2)}°${hemi}`
}

export function FlightStrip({ role, airport, active, invalid, onActivate }: FlightStripProps) {
  const meta = ROLE_META[role]

  return (
    <button
      type="button"
      onClick={onActivate}
      aria-pressed={active}
      aria-invalid={invalid}
      className={cn(
        "group relative flex w-full items-stretch gap-3 overflow-hidden rounded-sm border bg-secondary/40 px-3 py-3 text-left transition-all outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring",
        active ? cn("border-current", meta.accent, meta.glow) : "border-border hover:border-primary/40",
        invalid && "border-destructive"
      )}
    >
      {/* role edge bar */}
      <span className={cn("absolute inset-y-0 left-0 w-1", meta.bar)} aria-hidden />

      <div className="flex w-full flex-col gap-1 pl-1">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className={meta.accent}>{meta.tag}</span>
          <span className="rounded-xs border border-border px-1 text-muted-foreground">
            KEY {meta.hint}
          </span>
        </div>

        {airport ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold leading-none tracking-tight text-data">
                {airport.code_airport}
              </span>
              <span className="truncate font-mono text-xs text-foreground/90">
                {airport.airport_name}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
              <span className="truncate uppercase tracking-wider">
                {airport.city}, {airport.country_code}
              </span>
              <span className="tabular-nums">
                {fmtCoord(airport.lat, "lat")} {fmtCoord(airport.lon, "lon")}
              </span>
            </div>
          </>
        ) : (
          <div className="flex h-[2.6rem] items-center">
            <span className="cursor-blink font-mono text-sm uppercase tracking-widest text-muted-foreground">
              Awaiting input
            </span>
          </div>
        )}
      </div>
    </button>
  )
}

export type { FlightStripProps }
