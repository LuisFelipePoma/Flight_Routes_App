import type { RouteResult } from "@/lib/types/flight"
import { ScrollArea } from "../ui/scroll-area"
import type { AirportResponseDTO } from "@/lib/services/interfaces/airports.interface"

interface RouteSummaryProps {
  result: RouteResult | null
  airportsById?: Record<number, AirportResponseDTO>
}

function formatAlgorithmLabel(result: RouteResult | null): string {
  if (!result) {
    return "Not selected"
  }

  if (result.algorithm === "dijkstra") {
    return "Dijkstra"
  }

  if (result.algorithm === "dfs") {
    return "Depth-first search"
  }

  return "Prim"
}

function formatStatusLabel(result: RouteResult | null): string {
  if (!result) {
    return "No calculation yet"
  }

  if (result.status === "ok") {
    return "Route found"
  }

  if (result.status === "no-route") {
    return "No route available"
  }

  return "Calculation error"
}

function resolveAirportLabel(id: number, airportsById?: Record<number, AirportResponseDTO>): string {
  const airport = airportsById?.[id]
  if (!airport) {
    return `Airport #${id}`
  }

  return `${airport.airport_name} (${airport.city}, ${airport.country_code})`
}

export function RouteSummary({ result, airportsById }: RouteSummaryProps) {
  const stops = result?.airportIds ?? []
  const stopLabels = stops.map((id) => resolveAirportLabel(id, airportsById))
  const statusText = formatStatusLabel(result)

  return (
    <ScrollArea
      className="h-full"
      aria-labelledby="route-summary-title"
      aria-live="polite"
      role="status"
    >
      <h2 id="route-summary-title" className="text-lg font-semibold tracking-tight">
        Route summary
      </h2>

      <dl className="mt-3 grid gap-2 text-sm">
        <div className="grid gap-1">
          <dt className="font-medium text-muted-foreground">Algorithm</dt>
          <dd>{formatAlgorithmLabel(result)}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-medium text-muted-foreground">Status</dt>
          <dd>
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
          </dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-medium text-muted-foreground">Stops</dt>
          <dd>{stops.length}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="font-medium text-muted-foreground">Total distance</dt>
          <dd>
            {result?.totalDistanceKm !== undefined
              ? `${result.totalDistanceKm.toFixed(2)} km`
              : "Not available"}
          </dd>
        </div>
      </dl>

      {result?.message ? <p className="mt-3 text-sm text-muted-foreground">{result.message}</p> : null}

      <div className="mt-4">
        <h3 className="text-sm font-medium">Route sequence</h3>
        {stopLabels.length > 0 ? (
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm">
            {stopLabels.map((label, index) => (
              <li key={`${label}-${index}`}>{label}</li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No stops to display. Run a calculation to view route details.
          </p>
        )}
      </div>
    </ScrollArea>
  )
}

export type { RouteSummaryProps }
