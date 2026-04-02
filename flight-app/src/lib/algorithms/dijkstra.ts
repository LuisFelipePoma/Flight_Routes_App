import type { FlightGraph } from "@/lib/types/flight"
import { reconstructRoute } from "@/lib/algorithms/reconstruct-route"

interface QueueNode {
  airportId: number
  distance: number
}

function sortQueue(queue: QueueNode[]) {
  queue.sort((a, b) => a.distance - b.distance || a.airportId - b.airportId)
}

export interface DijkstraResult {
  path: number[]
  totalDistanceKm?: number
}

export function dijkstra(
  graph: FlightGraph,
  originId: number,
  destinationId: number
): DijkstraResult {
  const distances = new Map<number, number>()
  const predecessors = new Map<number, number>()
  const visited = new Set<number>()
  const queue: QueueNode[] = [{ airportId: originId, distance: 0 }]

  distances.set(originId, 0)

  while (queue.length > 0) {
    sortQueue(queue)
    const current = queue.shift()

    if (!current) {
      break
    }

    if (visited.has(current.airportId)) {
      continue
    }

    visited.add(current.airportId)

    if (current.airportId === destinationId) {
      break
    }

    const neighbors = graph[current.airportId] ?? []
    for (const edge of neighbors) {
      if (visited.has(edge.to)) {
        continue
      }

      const candidate = current.distance + edge.distanceKm
      const knownDistance = distances.get(edge.to)

      if (knownDistance === undefined || candidate < knownDistance) {
        distances.set(edge.to, candidate)
        predecessors.set(edge.to, current.airportId)
        queue.push({ airportId: edge.to, distance: candidate })
      }
    }
  }

  const path = reconstructRoute(predecessors, originId, destinationId)
  const totalDistanceKm = distances.get(destinationId)

  return {
    path,
    totalDistanceKm,
  }
}
