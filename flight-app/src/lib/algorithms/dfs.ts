import type { FlightGraph } from "@/lib/types/flight"
import { reconstructRoute } from "@/lib/algorithms/reconstruct-route"

export function dfs(
  graph: FlightGraph,
  originId: number,
  destinationId: number
): number[] {
  if (originId === destinationId) {
    return [originId]
  }

  const visited = new Set<number>()
  const predecessors = new Map<number, number>()

  const visit = (airportId: number): boolean => {
    visited.add(airportId)

    if (airportId === destinationId) {
      return true
    }

    const neighbors = graph[airportId] ?? []
    for (const edge of neighbors) {
      if (visited.has(edge.to)) {
        continue
      }

      predecessors.set(edge.to, airportId)
      if (visit(edge.to)) {
        return true
      }
    }

    return false
  }

  visit(originId)
  return reconstructRoute(predecessors, originId, destinationId)
}
