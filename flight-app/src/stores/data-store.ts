import { buildFlightGraph } from "@/lib/graph/build-graph"
import type { AirportResponseDTO } from "@/lib/services/interfaces/airports.interface"
import type { RoutesResponseDTO } from "@/lib/services/interfaces/routes.interface"
import type { SelectionOption } from "@/lib/services/interfaces/types"
import type { WorlResponseDTO } from "@/lib/services/interfaces/world.interface"
import type { FlightGraph } from "@/lib/types/flight"
import { create } from "zustand"

interface DataState {
  graph: FlightGraph | null
  countries: SelectionOption[]
  airportsOptions: SelectionOption[]

  seedData: (
    routes: RoutesResponseDTO[],
    world: WorlResponseDTO,
    airports: AirportResponseDTO[]
  ) => void
}

export const useDataStore = create<DataState>((set) => ({
  graph: null,
  countries: [],
  airportsOptions: [],
  seedData: (routes, world, airports) =>
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
        airportsOptions: airports.map((airport) => ({
          value: airport.id,
          label: `${airport.airport_name} (${airport.city})`,
        })) as SelectionOption[],
      }
    }),
}))
