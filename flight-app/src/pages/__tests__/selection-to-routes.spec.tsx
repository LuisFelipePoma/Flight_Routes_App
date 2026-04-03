import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter, Route, Routes } from "react-router-dom"

import { App } from "@/App"
import { FIXTURE_AIRPORTS, FIXTURE_ROUTES, FIXTURE_WORLD } from "@/test/fixtures/flight-fixtures"
import { RoutesPage } from "@/pages/RoutesPage"
import { useRoutesStore } from "@/stores/routes-store"
import { useSelectionStore } from "@/stores/selection-store"
import { useDataStore } from "@/stores/data-store"

const { useQDatasetMock } = vi.hoisted(() => ({
  useQDatasetMock: vi.fn(),
}))

vi.mock("@/lib/services/useQDataset", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/useQDataset")>("@/lib/services/useQDataset")
  return {
    ...actual,
    useQDataset: useQDatasetMock,
  }
})

describe("selection to routes integration", () => {
  beforeEach(() => {
    useQDatasetMock.mockReturnValue({
      query: {
        data: {
          world: FIXTURE_WORLD,
          airports: FIXTURE_AIRPORTS,
          routes: FIXTURE_ROUTES,
        },
        isLoading: false,
      },
    })

    useSelectionStore.setState({
      originCountryCode: null,
      destinationCountryCode: null,
      originId: null,
      destinationId: null,
    })

    useDataStore.setState({
      graph: null,
      countries: [],
      airportsOptions: {},
    })
    useDataStore.getState().seedData(FIXTURE_ROUTES, FIXTURE_AIRPORTS)

    useRoutesStore.setState({
      algorithm: "dijkstra",
      computeState: "idle",
      result: null,
      lastInput: {
        originId: null,
        destinationId: null,
      },
    })
  })

  it("hands off selection context and propagates active algorithm result", async () => {
    const user = userEvent.setup()

    useSelectionStore.setState({
      originCountryCode: "PE",
      destinationCountryCode: "PE",
      originId: 1,
      destinationId: 3,
    })

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )

    await screen.findByText("Flight route selection")

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
    useDataStore.getState().seedData(FIXTURE_ROUTES, FIXTURE_AIRPORTS)

    useSelectionStore.setState({
      originCountryCode: "PE",
      destinationCountryCode: "PE",
      originId: 1,
      destinationId: 1,
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

  it("blocks transition when origin is null", async () => {
    const user = userEvent.setup()

    useSelectionStore.setState({
      originCountryCode: "PE",
      destinationCountryCode: "PE",
      originId: null,
      destinationId: 3,
    })

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )

    await screen.findByText("Flight route selection")

    const submitButton = screen.getByRole("button", { name: "Calculate route" })
    expect(submitButton).toBeDisabled()

    await user.click(submitButton)

    expect(screen.getByText("Flight route selection")).toBeInTheDocument()
    expect(screen.queryByText("Route visualization")).not.toBeInTheDocument()
    expect(useRoutesStore.getState().lastInput).toEqual({
      originId: null,
      destinationId: null,
    })
  })

  it("blocks transition when destination is null", async () => {
    const user = userEvent.setup()

    useSelectionStore.setState({
      originCountryCode: "PE",
      destinationCountryCode: "PE",
      originId: 1,
      destinationId: null,
    })

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )

    await screen.findByText("Flight route selection")

    const submitButton = screen.getByRole("button", { name: "Calculate route" })
    expect(submitButton).toBeDisabled()

    await user.click(submitButton)

    expect(screen.getByText("Flight route selection")).toBeInTheDocument()
    expect(screen.queryByText("Route visualization")).not.toBeInTheDocument()
    expect(useRoutesStore.getState().lastInput).toEqual({
      originId: null,
      destinationId: null,
    })
  })
})
