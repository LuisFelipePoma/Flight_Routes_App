import { render, screen } from "@testing-library/react"
import { waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { App } from "@/App"
import { RouteSummary } from "@/components/routes/RouteSummary"
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

describe("route-visualization scenarios", () => {
  it("renders route details equivalent to arc/node visual data", () => {
    render(
      <RouteSummary
        result={{
          algorithm: "dijkstra",
          status: "ok",
          airportIds: [1, 2, 3],
          totalDistanceKm: 10,
        }}
        airportsById={{
          1: FIXTURE_AIRPORTS[0],
          2: FIXTURE_AIRPORTS[1],
          3: FIXTURE_AIRPORTS[2],
        }}
      />
    )

    expect(screen.getByText("Route found")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("10.00 km")).toBeInTheDocument()
    expect(screen.getByText(/Jorge Chavez/)).toBeInTheDocument()
    expect(screen.getByText(/Velasco Astete/)).toBeInTheDocument()
    expect(screen.getByText(/Rodriguez Ballon/)).toBeInTheDocument()
  })

  it("shows stale-clear empty state for no-route results", () => {
    render(
      <RouteSummary
        result={{
          algorithm: "dfs",
          status: "no-route",
          airportIds: [],
          message: "No route available for the selected airports.",
        }}
      />
    )

    expect(screen.getByText("No route available")).toBeInTheDocument()
    expect(screen.getByText("No route available for the selected airports.")).toBeInTheDocument()
    expect(screen.getByText("No stops to display. Run a calculation to view route details.")).toBeInTheDocument()
  })

  it("publishes non-visual route confirmation via status region", () => {
    render(
      <RouteSummary
        result={{
          algorithm: "prim",
          status: "ok",
          airportIds: [1, 2],
          message: "Computed with Prim",
        }}
        airportsById={{
          1: FIXTURE_AIRPORTS[0],
          2: FIXTURE_AIRPORTS[1],
        }}
      />
    )

    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.getByText("Computed with Prim")).toBeInTheDocument()
    expect(screen.getByText("Route found")).toBeInTheDocument()
  })
})

describe("single-page overlay synchronization", () => {
  it("draws route arcs and endpoint nodes for successful results", async () => {
    useSelectionStore.setState({
      activeRole: "origin",
      originCountryCode: "PE",
      destinationCountryCode: "PE",
      originId: 1,
      destinationId: 3,
    })

    useRoutesStore.setState({
      algorithm: "dijkstra",
      computeState: "idle",
      result: null,
      lastInput: {
        originId: 1,
        destinationId: 3,
      },
    })

    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(container.querySelectorAll("path.route-arc").length).toBeGreaterThan(0)
      expect(container.querySelectorAll("g.endpoint").length).toBeGreaterThan(0)
    })
  })

  it("clears stale overlays when no route is available", async () => {
    useQDatasetMock.mockReturnValue({
      query: {
        data: {
          world: FIXTURE_WORLD,
          airports: FIXTURE_AIRPORTS,
          routes: [FIXTURE_ROUTES[0]],
        },
        isLoading: false,
      },
    })

    useSelectionStore.setState({
      activeRole: "origin",
      originCountryCode: "PE",
      destinationCountryCode: "PE",
      originId: 1,
      destinationId: 3,
    })

    useRoutesStore.setState({
      algorithm: "dijkstra",
      computeState: "idle",
      result: null,
      lastInput: {
        originId: 1,
        destinationId: 3,
      },
    })

    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText("No route available for the selected airports.")).toBeInTheDocument()
      expect(container.querySelectorAll("path.route-arc").length).toBe(0)
    })
  })
})
