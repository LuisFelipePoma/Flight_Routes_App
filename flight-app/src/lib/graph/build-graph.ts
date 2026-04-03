import type { FlightGraph, RouteEdge } from "@/lib/types/flight"
import type { RoutesResponseDTO } from "../services/interfaces/routes.interface"
import type { AirportResponseDTO } from "../services/interfaces/airports.interface"

const EARTH_RADIUS_KM = 6371

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

export function haversine(
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number }
): number {
  const dLat = toRadians(destination.lat - origin.lat)
  const dLon = toRadians(destination.lon - origin.lon)

  const originLat = toRadians(origin.lat)
  const destinationLat = toRadians(destination.lat)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(originLat) * Math.cos(destinationLat) * Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

function addEdge(graph: FlightGraph, from: number, edge: RouteEdge) {
  if (!graph[from]) {
    graph[from] = []
  }

  graph[from].push(edge)
}

function isFiniteCoordinate(value: number): boolean {
  return Number.isFinite(value)
}

export function buildAdjacencyGraph(routes: RoutesResponseDTO[]): FlightGraph {
  const graph: FlightGraph = {}

  for (const route of routes) {
    const {
      id_origin: originId,
      id_destination: destinationId,
      origin_lat: originLat,
      origin_lon: originLon,
      destination_lat: destinationLat,
      destination_lon: destinationLon,
    } = route

    if (
      !isFiniteCoordinate(Number(originLat)) ||
      !isFiniteCoordinate(Number(originLon)) ||
      !isFiniteCoordinate(Number(destinationLat)) ||
      !isFiniteCoordinate(Number(destinationLon))
    ) {
      continue
    }

    const distanceKm = haversine(
      { lat: Number(originLat), lon: Number(originLon) },
      { lat: Number(destinationLat), lon: Number(destinationLon) }
    )

    addEdge(graph, Number(originId), {
      to: Number(destinationId),
      distanceKm,
    })

    if (!graph[Number(destinationId)]) {
      graph[Number(destinationId)] = []
    }
  }

  return graph
}

export function buildFlightGraph(
  airports: AirportResponseDTO[],
  routes: RoutesResponseDTO[]
): FlightGraph {
  const graph = buildAdjacencyGraph(routes)

  for (const airport of airports) {
    if (!graph[Number(airport.id)]) {
      graph[Number(airport.id)] = []
    }
  }

  return graph
}
