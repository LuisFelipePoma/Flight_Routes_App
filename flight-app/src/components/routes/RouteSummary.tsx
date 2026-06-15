import type { RouteResult } from "@/lib/types/flight"
import { ScrollArea } from "../ui/scroll-area"
import type { AirportResponseDTO } from "@/lib/services/interfaces/airports.interface"
import { haversine } from "@/lib/graph/build-graph"
import { DistanceCounter } from "./DistanceCounter"
import { cn } from "@/lib/utils"

interface RouteSummaryProps {
  result: RouteResult | null
  airportsById?: Record<number, AirportResponseDTO>
}

function formatAlgorithmLabel(result: RouteResult | null): string {
  if (!result) return "Not selected"
  if (result.algorithm === "dijkstra") return "Dijkstra"
  if (result.algorithm === "dfs") return "Depth-first search"
  return "Prim"
}

function formatStatusLabel(result: RouteResult | null): string {
  if (!result) return "No calculation yet"
  if (result.status === "ok") return "Route found"
  if (result.status === "no-route") return "No route available"
  return "Calculation error"
}

function statusTone(result: RouteResult | null): string {
  if (result?.status === "ok") return "text-primary"
  if (result?.status === "no-route" || result?.status === "error") return "text-accent"
  return "text-muted-foreground"
}

function resolveAirportLabel(
  id: number,
  airportsById?: Record<number, AirportResponseDTO>
): string {
  const airport = airportsById?.[id]
  if (!airport) return `Airport #${id}`
  return `${airport.airport_name} (${airport.city}, ${airport.country_code})`
}

function legDistance(
  fromId: number,
  toId: number,
  airportsById?: Record<number, AirportResponseDTO>
): number | null {
  const from = airportsById?.[fromId]
  const to = airportsById?.[toId]
  if (!from || !to) return null
  return haversine(
    { lat: parseFloat(from.lat), lon: parseFloat(from.lon) },
    { lat: parseFloat(to.lat), lon: parseFloat(to.lon) }
  )
}

export function RouteSummary({ result, airportsById }: RouteSummaryProps) {
  const stops = result?.airportIds ?? []
  const statusText = formatStatusLabel(result)

  return (
    <ScrollArea
      className="h-full"
      aria-labelledby="route-summary-title"
      aria-live="polite"
      role="status"
    >
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h2 id="route-summary-title" className="font-display text-sm tracking-[0.18em] text-foreground">
          Route summary
        </h2>
        <span className={cn("flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest", statusTone(result))}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          {statusText}
          <span className="sr-only">
            {result?.status === "ok"
              ? ". Route is available."
              : result?.status === "no-route"
                ? ". No connection could be found."
                : result?.status === "error"
                  ? ". Calculation could not be completed."
                  : "."}
          </span>
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 font-mono text-xs">
        <div className="rounded-sm border border-border bg-secondary/30 p-2">
          <dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Algorithm</dt>
          <dd className="mt-1 text-foreground">{formatAlgorithmLabel(result)}</dd>
        </div>
        <div className="rounded-sm border border-border bg-secondary/30 p-2">
          <dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Stops</dt>
          <dd className="mt-1 text-data">{stops.length}</dd>
        </div>
        <div className="rounded-sm border border-border bg-secondary/30 p-2">
          <dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Total distance</dt>
          <dd className="mt-1 text-data">
            {result?.totalDistanceKm !== undefined ? (
              <DistanceCounter value={result.totalDistanceKm} />
            ) : (
              "Not available"
            )}
          </dd>
        </div>
      </dl>

      {result?.message ? (
        <p className="mt-3 font-mono text-[11px] text-muted-foreground">{result.message}</p>
      ) : null}

      <div className="mt-4">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Route sequence
        </h3>
        {stops.length > 0 ? (
          <ol className="mt-2 flex flex-col gap-1">
            {stops.map((id, index) => {
              const airport = airportsById?.[id]
              const leg = index > 0 ? legDistance(stops[index - 1], id, airportsById) : null
              return (
                <li
                  key={`${id}-${index}`}
                  className="flex items-center gap-3 rounded-sm border border-border bg-card/60 px-2.5 py-1.5"
                >
                  <span className="w-5 shrink-0 text-center font-mono text-[10px] text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="w-10 shrink-0 font-mono text-sm font-bold text-data">
                    {airport?.code_airport ?? "···"}
                  </span>
                  <span className="flex-1 truncate font-mono text-[11px] text-foreground/90">
                    {resolveAirportLabel(id, airportsById)}
                  </span>
                  {leg !== null ? (
                    <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                      +{leg.toFixed(0)}km
                    </span>
                  ) : null}
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="mt-2 font-mono text-[11px] text-muted-foreground">
            No stops to display. Run a calculation to view route details.
          </p>
        )}
      </div>
    </ScrollArea>
  )
}

export type { RouteSummaryProps }
