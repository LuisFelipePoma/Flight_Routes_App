import { describe, expectTypeOf, it } from "vitest"

import type { FlightGraph } from "@/lib/types/flight"
import type { ComputeInput } from "@/stores/routes-store"
import { useRoutesStore } from "@/stores/routes-store"

type RoutesStoreApi = ReturnType<typeof useRoutesStore.getState>

type HasLegacyRouteActionKeys =
  "computeRouteLegacy" extends keyof RoutesStoreApi
    ? true
    : "calculateRoute" extends keyof RoutesStoreApi
      ? true
      : false

type AllowsLegacyZeroArgComputeRoute = [] extends Parameters<
  RoutesStoreApi["computeRoute"]
>
  ? true
  : false

describe("routes-store contract guard", () => {
  it("enforces primeContext + computeRoute(graph) active API", () => {
    expectTypeOf<Parameters<RoutesStoreApi["primeContext"]>>().toEqualTypeOf<[
      ComputeInput,
    ]>()

    expectTypeOf<Parameters<RoutesStoreApi["computeRoute"]>>().toEqualTypeOf<[
      FlightGraph,
    ]>()

    expectTypeOf<AllowsLegacyZeroArgComputeRoute>().toEqualTypeOf<false>()
    expectTypeOf<HasLegacyRouteActionKeys>().toEqualTypeOf<false>()
  })
})
