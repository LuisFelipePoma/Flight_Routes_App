import type { FlightGraph } from "@/lib/types/flight"
import { reconstructRoute } from "@/lib/algorithms/reconstruct-route"

interface CandidateEdge {
  from: number
  to: number
  distanceKm: number
}

function sortCandidates(candidates: CandidateEdge[]) {
  candidates.sort(
    (a, b) =>
      a.distanceKm - b.distanceKm ||
      a.from - b.from ||
      a.to - b.to
  )
}

export function primPath(
  graph: FlightGraph,
  originId: number,
  destinationId: number
): number[] {
  if (originId === destinationId) {
    return [originId]
  }

  const visited = new Set<number>([originId])
  const predecessors = new Map<number, number>()
  const candidates: CandidateEdge[] = []

  for (const edge of graph[originId] ?? []) {
    candidates.push({
      from: originId,
      to: edge.to,
      distanceKm: edge.distanceKm,
    })
  }

  while (candidates.length > 0) {
    sortCandidates(candidates)
    const nextEdge = candidates.shift()

    if (!nextEdge) {
      break
    }

    if (visited.has(nextEdge.to)) {
      continue
    }

    visited.add(nextEdge.to)
    predecessors.set(nextEdge.to, nextEdge.from)

    if (nextEdge.to === destinationId) {
      break
    }

    for (const edge of graph[nextEdge.to] ?? []) {
      if (!visited.has(edge.to)) {
        candidates.push({
          from: nextEdge.to,
          to: edge.to,
          distanceKm: edge.distanceKm,
        })
      }
    }
  }

  return reconstructRoute(predecessors, originId, destinationId)
}
