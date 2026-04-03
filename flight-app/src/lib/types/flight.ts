export type AlgorithmKey = "dijkstra" | "dfs" | "prim"

export interface RouteEdge {
  to: number
  distanceKm: number
}

export type FlightGraph = Record<number, RouteEdge[]>

// Canonical route computation outcomes consumed by routes UI and tests.
export type RouteStatus = "ok" | "no-route" | "error"

export interface RouteResult {
  algorithm: AlgorithmKey
  status: RouteStatus
  airportIds: number[]
  totalDistanceKm?: number
  message?: string
}
