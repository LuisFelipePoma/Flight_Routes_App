import { buildFlightGraph } from "@/lib/graph/build-graph"
import type { AirportResponseDTO } from "@/lib/services/interfaces/airports.interface"
import type { RoutesResponseDTO } from "@/lib/services/interfaces/routes.interface"
import type { SelectionOption } from "@/lib/services/interfaces/types"
import type { FlightGraph } from "@/lib/types/flight"
import { create } from "zustand"

interface DataState {
  graph: FlightGraph | null
  countries: SelectionOption[]
  airportsOptions: { [key: string]: SelectionOption[] }

  seedData: (
    routes: RoutesResponseDTO[],
    airports: AirportResponseDTO[]
  ) => void
}

export const useDataStore = create<DataState>((set) => ({
  graph: null,
  countries: [],
  airportsOptions: {},
  seedData: (routes, airports) =>
    set(() => {
      return {
        graph: buildFlightGraph(airports, routes),
        countries: airports.reduce((acc, airport) => {
          if (!acc.some((c) => c.value === airport.country_code)) {
            acc.push({
              label: airport.country + " (" + airport.country_code + ")",
              value: airport.country_code,
            })
          }
          return acc
        }, [] as SelectionOption[]),
        airportsOptions: airports.reduce(
          (acc, airport) => {
            if (!acc[airport.country_code]) {
              acc[airport.country_code] = []
            }
            acc[airport.country_code].push({
              value: airport.id,
              label: `${airport.airport_name} (${airport.city})`,
            })
            return acc
          },
          {} as { [key: string]: SelectionOption[] }
        ),
      }
    }),
}))
