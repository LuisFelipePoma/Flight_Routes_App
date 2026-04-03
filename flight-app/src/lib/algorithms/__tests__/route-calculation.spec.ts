import { beforeEach, describe, expect, it } from "vitest"

import { dfs } from "@/lib/algorithms/dfs"
import { dijkstra } from "@/lib/algorithms/dijkstra"
import { primPath } from "@/lib/algorithms/prim"
import type { FlightGraph } from "@/lib/types/flight"
import { useRoutesStore } from "@/stores/routes-store"

const CONNECTED_GRAPH: FlightGraph = {
  1: [
    { to: 2, distanceKm: 3 },
    { to: 3, distanceKm: 10 },
  ],
  2: [{ to: 3, distanceKm: 4 }],
  3: [{ to: 4, distanceKm: 1 }],
  4: [],
}

const DISCONNECTED_GRAPH: FlightGraph = {
  1: [{ to: 2, distanceKm: 2 }],
  2: [],
  3: [{ to: 4, distanceKm: 1 }],
  4: [],
}

describe("route-calculation scenarios", () => {
  beforeEach(() => {
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

  it("runs Dijkstra/DFS/Prim on valid prerequisites", () => {
    const dijkstraResult = dijkstra(CONNECTED_GRAPH, 1, 4)
    const dfsResult = dfs(CONNECTED_GRAPH, 1, 4)
    const primResult = primPath(CONNECTED_GRAPH, 1, 4)

    expect(dijkstraResult.path).toEqual([1, 2, 3, 4])
    expect(dijkstraResult.totalDistanceKm).toBe(8)
    expect(dfsResult).toEqual([1, 2, 3, 4])
    expect(primResult).toEqual([1, 2, 3, 4])
  })

  it("returns no-route result for unreachable destination", () => {
    expect(dijkstra(DISCONNECTED_GRAPH, 1, 4).path).toEqual([])
    expect(dfs(DISCONNECTED_GRAPH, 1, 4)).toEqual([])
    expect(primPath(DISCONNECTED_GRAPH, 1, 4)).toEqual([])
  })

  it("rejects missing prerequisites through store compute gateway", () => {
    useRoutesStore.getState().computeRoute(CONNECTED_GRAPH)

    const result = useRoutesStore.getState().result
    expect(result?.status).toBe("error")
    expect(result?.message).toContain("Select two different airports")
  })

  it("computes route after priming context with active signature", () => {
    useRoutesStore.getState().primeContext({
      originId: 1,
      destinationId: 4,
    })

    useRoutesStore.getState().computeRoute(CONNECTED_GRAPH)

    const result = useRoutesStore.getState().result
    expect(result?.status).toBe("ok")
    expect(result?.airportIds).toEqual([1, 2, 3, 4])
  })
})
