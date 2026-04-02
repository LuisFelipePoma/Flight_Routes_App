import { beforeEach, describe, expect, it, vi } from "vitest"

import { FIXTURE_AIRPORTS, FIXTURE_ROUTES, FIXTURE_WORLD } from "@/test/fixtures/flight-fixtures"
import { useSelectionStore } from "@/stores/selection-store"

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

describe("selection-store scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSelectionStore.setState(INITIAL_STATE)
  })

  it("supports happy path selection with distinct airports", async () => {
    loadFlightDatasetsMock.mockResolvedValue({
      world: FIXTURE_WORLD,
      airports: FIXTURE_AIRPORTS,
      routes: FIXTURE_ROUTES,
    })

    await useSelectionStore.getState().loadDatasets()
    useSelectionStore.getState().setOriginCountry("PE")
    useSelectionStore.getState().setDestinationCountry("PE")
    useSelectionStore.getState().setOrigin(1)
    useSelectionStore.getState().setDestination(2)

    const state = useSelectionStore.getState()
    expect(state.error).toBeNull()
    expect(state.originCountryCode).toBe("PE")
    expect(state.destinationCountryCode).toBe("PE")
    expect(state.originId).toBe(1)
    expect(state.destinationId).toBe(2)
    expect(state.validationMessage).toBeNull()
    expect(state.canSubmit).toBe(true)
  })

  it("blocks same-airport selection and exposes validation message", async () => {
    loadFlightDatasetsMock.mockResolvedValue({
      world: FIXTURE_WORLD,
      airports: FIXTURE_AIRPORTS,
      routes: FIXTURE_ROUTES,
    })

    await useSelectionStore.getState().loadDatasets()
    useSelectionStore.getState().setOriginCountry("PE")
    useSelectionStore.getState().setDestinationCountry("PE")
    useSelectionStore.getState().setOrigin(1)
    useSelectionStore.getState().setDestination(1)

    const state = useSelectionStore.getState()
    expect(state.validationMessage).toContain("must be different")
    expect(state.canSubmit).toBe(false)
  })

  it("handles dataset failure and allows retry", async () => {
    loadFlightDatasetsMock
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValueOnce({
        world: FIXTURE_WORLD,
        airports: FIXTURE_AIRPORTS,
        routes: FIXTURE_ROUTES,
      })

    await useSelectionStore.getState().loadDatasets()
    expect(useSelectionStore.getState().error).toContain("Network unavailable")
    expect(useSelectionStore.getState().datasets).toBeNull()

    await useSelectionStore.getState().retryLoad()
    expect(useSelectionStore.getState().error).toBeNull()
    expect(useSelectionStore.getState().datasets?.airports.length).toBeGreaterThan(0)
  })

})
