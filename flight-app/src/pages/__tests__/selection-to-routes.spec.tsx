import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { MemoryRouter } from "react-router-dom"

import { App } from "@/App"
import { FIXTURE_AIRPORTS, FIXTURE_ROUTES, FIXTURE_WORLD } from "@/test/fixtures/flight-fixtures"
import { useRoutesStore } from "@/stores/routes-store"
import { INITIAL_SELECTION_STATE, useSelectionStore } from "@/stores/selection-store"
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

    useSelectionStore.setState(INITIAL_SELECTION_STATE)

    useDataStore.setState({
      graph: null,
      countries: [],
      airportsOptions: {},
      airports: [],
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

  it("computes selected routes in the single-page planner", async () => {
    const user = userEvent.setup()

    useSelectionStore.setState({
      activeRole: "origin",
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

    await screen.findByText("Flight planner")
    expect(screen.queryByText("Route computation")).not.toBeInTheDocument()

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

  it("selects airports from the active picker and computes without navigation", async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )

    await screen.findByText("Flight planner")

    await user.click(screen.getByRole("option", { name: /Jorge Chavez/i }))
    await waitFor(() => {
      expect(useSelectionStore.getState().activeRole).toBe("destination")
    })
    await user.click(screen.getByRole("option", { name: /Rodriguez Ballon/i }))

    expect(screen.queryByText("Route computation")).not.toBeInTheDocument()
    await waitFor(() => {
      expect(useRoutesStore.getState().result?.status).toBe("ok")
      expect(useRoutesStore.getState().lastInput).toEqual({
        originId: 1,
        destinationId: 3,
      })
    })
  })

  it("keeps the result empty when selected airports are invalid", async () => {
    useSelectionStore.setState({
      activeRole: "destination",
      originCountryCode: "PE",
      destinationCountryCode: "PE",
      originId: 1,
      destinationId: 1,
    })

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )

    await screen.findByText("Flight planner")
    expect(screen.getByText("Choose two different airports")).toBeInTheDocument()
    expect(useRoutesStore.getState().result).toBeNull()
  })

  it("redirects the old routes URL back into the single-page planner", async () => {
    render(
      <MemoryRouter initialEntries={["/routes"]}>
        <App />
      </MemoryRouter>
    )

    await screen.findByText("Flight planner")
    expect(screen.queryByText("Route computation")).not.toBeInTheDocument()
  })
})
