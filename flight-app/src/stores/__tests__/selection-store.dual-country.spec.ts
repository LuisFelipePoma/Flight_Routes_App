import { beforeEach, describe, expect, it, vi } from "vitest"

import { useSelectionStore } from "@/stores/selection-store"
import { FIXTURE_AIRPORTS, FIXTURE_ROUTES, FIXTURE_WORLD } from "@/test/fixtures/flight-fixtures"

const { loadFlightDatasetsMock } = vi.hoisted(() => ({
  loadFlightDatasetsMock: vi.fn(),
}))

vi.mock("@/lib/data/datasets", async () => {
  const actual = await vi.importActual<typeof import("@/lib/data/datasets")>("@/lib/data/datasets")
  return {
    ...actual,
    loadFlightDatasets: loadFlightDatasetsMock,
  }
})

const INITIAL_STATE = {
  datasets: null,
  graph: null,
  isLoading: false,
  error: null,
  originCountryCode: null,
  destinationCountryCode: null,
  originId: null,
  destinationId: null,
  validationMessage: null,
  canSubmit: false,
} as const

describe("selection-store dual-country flows", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSelectionStore.setState(INITIAL_STATE)
  })

  it("applies map click cycle: first=origin, second=destination, later replaces destination", async () => {
    const airports = [
      ...FIXTURE_AIRPORTS,
      {
        id: 10,
        airport_name: "El Dorado",
        city: "Bogota",
        country_code: "CO",
        lat: 4.7016,
        lon: -74.1469,
      },
      {
        id: 11,
        airport_name: "Ministro Pistarini",
        city: "Buenos Aires",
        country_code: "AR",
        lat: -34.8222,
        lon: -58.5358,
      },
    ]

    loadFlightDatasetsMock.mockResolvedValue({
      world: FIXTURE_WORLD,
      airports,
      routes: FIXTURE_ROUTES,
    })

    await useSelectionStore.getState().loadDatasets()

    useSelectionStore.getState().selectCountryFromMap("PE")
    useSelectionStore.getState().selectCountryFromMap("CO")
    useSelectionStore.getState().setOrigin(1)
    useSelectionStore.getState().setDestination(10)

    let state = useSelectionStore.getState()
    expect(state.originCountryCode).toBe("PE")
    expect(state.destinationCountryCode).toBe("CO")
    expect(state.originId).toBe(1)
    expect(state.destinationId).toBe(10)

    useSelectionStore.getState().selectCountryFromMap("AR")

    state = useSelectionStore.getState()
    expect(state.originCountryCode).toBe("PE")
    expect(state.destinationCountryCode).toBe("AR")
    expect(state.originId).toBe(1)
    expect(state.destinationId).toBeNull()
    expect(state.canSubmit).toBe(false)
  })

  it("clears airports that no longer belong to selected countries", async () => {
    const airports = [
      ...FIXTURE_AIRPORTS,
      {
        id: 10,
        airport_name: "El Dorado",
        city: "Bogota",
        country_code: "CO",
        lat: 4.7016,
        lon: -74.1469,
      },
      {
        id: 11,
        airport_name: "Ministro Pistarini",
        city: "Buenos Aires",
        country_code: "AR",
        lat: -34.8222,
        lon: -58.5358,
      },
    ]

    loadFlightDatasetsMock.mockResolvedValue({
      world: FIXTURE_WORLD,
      airports,
      routes: FIXTURE_ROUTES,
    })

    await useSelectionStore.getState().loadDatasets()
    useSelectionStore.getState().setOriginCountry("PE")
    useSelectionStore.getState().setDestinationCountry("CO")
    useSelectionStore.getState().setOrigin(1)
    useSelectionStore.getState().setDestination(10)
    expect(useSelectionStore.getState().canSubmit).toBe(true)

    useSelectionStore.getState().setOriginCountry("AR")

    let state = useSelectionStore.getState()
    expect(state.originId).toBeNull()
    expect(state.destinationId).toBe(10)
    expect(state.canSubmit).toBe(false)

    useSelectionStore.getState().setDestinationCountry("PE")

    state = useSelectionStore.getState()
    expect(state.destinationId).toBeNull()
    expect(state.validationMessage).toBeNull()
    expect(state.canSubmit).toBe(false)
  })
})
