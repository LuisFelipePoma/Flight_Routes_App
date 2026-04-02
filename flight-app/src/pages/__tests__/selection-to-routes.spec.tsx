import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import { App } from "@/App"
import { FIXTURE_AIRPORTS, FIXTURE_ROUTES, FIXTURE_WORLD, createFixtureGraph } from "@/test/fixtures/flight-fixtures"
import { RoutesPage } from "@/pages/RoutesPage"
import { useRoutesStore } from "@/stores/routes-store"
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

describe("selection to routes integration", () => {
  beforeEach(() => {
    loadFlightDatasetsMock.mockResolvedValue({
      world: FIXTURE_WORLD,
      airports: FIXTURE_AIRPORTS,
      routes: FIXTURE_ROUTES,
    })

    useSelectionStore.setState({
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
    })

    useRoutesStore.setState({
      algorithm: "dijkstra",
      computeState: "idle",
      result: null,
      lastInput: {
        graph: null,
        originId: null,
        destinationId: null,
      },
    })
  })

  it("hands off selection context and propagates active algorithm result", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )

    await screen.findByText("Flight route planner")

    useSelectionStore.getState().setOriginCountry("PE")
    useSelectionStore.getState().setDestinationCountry("PE")
    useSelectionStore.getState().setOrigin(1)
    useSelectionStore.getState().setDestination(3)

    await user.click(screen.getByRole("button", { name: "Calculate route" }))

    await screen.findByText("Route visualization")
    await waitFor(() => {
      expect(useRoutesStore.getState().result?.status).toBe("ok")
      expect(useRoutesStore.getState().result?.algorithm).toBe("dijkstra")
    })

    await user.click(screen.getByRole("button", { name: "Prim" }))

    await waitFor(() => {
      expect(useRoutesStore.getState().algorithm).toBe("prim")
      expect(useRoutesStore.getState().result?.algorithm).toBe("prim")
      expect(useRoutesStore.getState().result?.status).toBe("ok")
    })
  })

  it("shows routes empty guidance when prerequisites are missing", async () => {
    useSelectionStore.setState({
      datasets: {
        world: FIXTURE_WORLD,
        airports: FIXTURE_AIRPORTS,
        routes: FIXTURE_ROUTES,
      },
      graph: createFixtureGraph(),
      isLoading: false,
      error: null,
      originCountryCode: "PE",
      destinationCountryCode: "PE",
      originId: 1,
      destinationId: 1,
      validationMessage: "Origin and destination must be different airports.",
      canSubmit: false,
    })

    render(
      <MemoryRouter initialEntries={["/routes"]}>
        <Routes>
          <Route path="/routes" element={<RoutesPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText("No calculation yet. Choose an algorithm and run a calculation.")).toBeInTheDocument()
  })
})
