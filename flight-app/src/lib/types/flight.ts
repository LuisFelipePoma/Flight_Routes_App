export type AlgorithmKey = "dijkstra" | "dfs" | "prim"

export interface Airport {
  code_airport: string
  country: string
  id: number
  airport_name: string
  city: string
  country_code: string
  lat: number
  lon: number
}

export interface RouteEdge {
  to: number
  distanceKm: number
}

export type FlightGraph = Record<number, RouteEdge[]>

export type RouteStatus = "ok" | "no-route" | "error"

export interface RouteResult {
  algorithm: AlgorithmKey
  status: RouteStatus
  airportIds: number[]
  totalDistanceKm?: number
  message?: string
}
