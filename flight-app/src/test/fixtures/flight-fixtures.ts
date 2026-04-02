import type { RouteDatasetRecord, WorldDataset } from "@/lib/data/datasets"
import { buildFlightGraph } from "@/lib/graph/build-graph"
import type { Airport } from "@/lib/types/flight"

export const FIXTURE_WORLD: WorldDataset = {
  type: "FeatureCollection",
  features: [
    {
      id: "PE",
      type: "Feature",
      properties: {
        name: "Peru",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-82, -18],
            [-68, -18],
            [-68, 0],
            [-82, 0],
            [-82, -18],
          ],
        ],
      },
    },
  ],
}

export const FIXTURE_AIRPORTS: Airport[] = [
  {
    id: 1,
    airport_name: "Jorge Chavez",
    city: "Lima",
    country_code: "PE",
    lat: -12.0219,
    lon: -77.1143,
  },
  {
    id: 2,
    airport_name: "Velasco Astete",
    city: "Cusco",
    country_code: "PE",
    lat: -13.5357,
    lon: -71.9388,
  },
  {
    id: 3,
    airport_name: "Rodriguez Ballon",
    city: "Arequipa",
    country_code: "PE",
    lat: -16.3411,
    lon: -71.583,
  },
]

export const FIXTURE_ROUTES: RouteDatasetRecord[] = [
  {
    id_origin: 1,
    id_destination: 2,
    origin_lat: -12.0219,
    origin_lon: -77.1143,
    destination_lat: -13.5357,
    destination_lon: -71.9388,
  },
  {
    id_origin: 2,
    id_destination: 3,
    origin_lat: -13.5357,
    origin_lon: -71.9388,
    destination_lat: -16.3411,
    destination_lon: -71.583,
  },
]

export function createFixtureGraph() {
  return buildFlightGraph(FIXTURE_AIRPORTS, FIXTURE_ROUTES)
}
