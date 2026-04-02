import { useQuery } from "@tanstack/react-query"
import { DATASET_URLS } from "./consts/endpoints"
import type { AirportResponseDTO } from "./interfaces/airports.interface"
import type { WorlResponseDTO } from "./interfaces/world.interface"
import type { RoutesResponseDTO } from "./interfaces/routes.interface"

interface Response {
  airports: AirportResponseDTO[]
  world: WorlResponseDTO
  routes: RoutesResponseDTO[]
}
export const useQDataset = () => {
  const query = useQuery({
    queryKey: ["dataset-data"],
    queryFn: async () => {
      const [airportsResponse, worldResponse, routesResponse] =
        await Promise.all([
          fetch(DATASET_URLS.airports),
          fetch(DATASET_URLS.world),
          fetch(DATASET_URLS.routes),
        ])
      const airports = await airportsResponse.json()
      const world = await worldResponse.json()
      const routes = await routesResponse.json()
      return { airports, world, routes } as Response
    },
  })
  return { query }
}
