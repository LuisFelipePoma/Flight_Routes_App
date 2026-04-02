import { create } from "zustand"
import { dijkstra } from "@/lib/algorithms/dijkstra"
import { dfs } from "@/lib/algorithms/dfs"
import { primPath } from "@/lib/algorithms/prim"
import type { AlgorithmKey, FlightGraph, RouteResult } from "@/lib/types/flight"

type ComputeState = "idle" | "computing"

interface ComputeInput {
  originId: number | null
  destinationId: number | null
}

interface RoutesState {
  algorithm: AlgorithmKey
  computeState: ComputeState
  result: RouteResult | null
  lastInput: ComputeInput
  setAlgorithm: (algorithm: AlgorithmKey) => void
  primeContext: (input: ComputeInput) => void
  clearResult: () => void
  computeRoute: () => void
}

function isValidInput(input: ComputeInput): input is {
  graph: FlightGraph
  originId: number
  destinationId: number
} {
  return (
    input.originId !== null &&
    input.destinationId !== null &&
    input.originId !== input.destinationId
  )
}

function makeErrorResult(algorithm: AlgorithmKey, message: string): RouteResult {
  return {
    algorithm,
    status: "error",
    airportIds: [],
    message,
  }
}

function makeNoRouteResult(algorithm: AlgorithmKey): RouteResult {
  return {
    algorithm,
    status: "no-route",
    airportIds: [],
    message: "No route available for the selected airports.",
  }
}

export const useRoutesStore = create<RoutesState>((set, get) => ({
  algorithm: "dijkstra",
  computeState: "idle",
  result: null,
  lastInput: {
    graph: null,
    originId: null,
    destinationId: null,
  },

  setAlgorithm(algorithm) {
    set({ algorithm, result: null })
  },

  primeContext(input) {
    set((state) => {
      const hasInputChanged =
        state.lastInput.originId !== input.originId ||
        state.lastInput.destinationId !== input.destinationId

      return {
        lastInput: input,
        result: hasInputChanged ? null : state.result,
      }
    })
  },

  clearResult() {
    set({ result: null, computeState: "idle" })
  },

  computeRoute() {
    const { algorithm, lastInput } = get()

    if (!isValidInput(lastInput)) {
      set({
        result: makeErrorResult(
          algorithm,
          "Select two different airports before calculating a route."
        ),
        computeState: "idle",
      })
      return
    }

    const { graph, originId, destinationId } = lastInput

    set({
      computeState: "computing",
      result: null,
    })

    try {
      let routeIds: number[] = []
      let totalDistanceKm: number | undefined

      if (algorithm === "dijkstra") {
        const dijkstraResult = dijkstra(graph, originId, destinationId)
        routeIds = dijkstraResult.path
        totalDistanceKm = dijkstraResult.totalDistanceKm
      } else if (algorithm === "dfs") {
        routeIds = dfs(graph, originId, destinationId)
      } else {
        // NOTE: Prim is adapted to expose a destination path derived from the
        // growing MST frontier to preserve legacy parity with old behavior.
        routeIds = primPath(graph, originId, destinationId)
      }

      if (routeIds.length === 0) {
        set({
          computeState: "idle",
          result: makeNoRouteResult(algorithm),
        })
        return
      }

      set({
        computeState: "idle",
        result: {
          algorithm,
          status: "ok",
          airportIds: routeIds,
          totalDistanceKm,
        },
      })
    } catch (error) {
      set({
        computeState: "idle",
        result: makeErrorResult(
          algorithm,
          error instanceof Error
            ? error.message
            : "An unexpected error happened while computing the route."
        ),
      })
    }
  },
}))
