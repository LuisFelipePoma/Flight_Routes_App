import { beforeEach, describe, expect, it } from "vitest"

import { INITIAL_SELECTION_STATE, useSelectionStore } from "@/stores/selection-store"

describe("selection-store scenarios", () => {
  beforeEach(() => {
    useSelectionStore.setState(INITIAL_SELECTION_STATE)
  })

  it("supports direct selection with distinct airports", () => {
    useSelectionStore.getState().setOriginCountry("PE")
    useSelectionStore.getState().setDestinationCountry("PE")
    useSelectionStore.getState().setOrigin(1)
    useSelectionStore.getState().setDestination(2)

    const state = useSelectionStore.getState()
    expect(state.originCountryCode).toBe("PE")
    expect(state.destinationCountryCode).toBe("PE")
    expect(state.originId).toBe(1)
    expect(state.destinationId).toBe(2)
  })

  it("allows same-airport selection without store-level validation flags", () => {
    useSelectionStore.getState().setOriginCountry("PE")
    useSelectionStore.getState().setDestinationCountry("PE")
    useSelectionStore.getState().setOrigin(1)
    useSelectionStore.getState().setDestination(1)

    const state = useSelectionStore.getState()
    expect(state.originId).toBe(1)
    expect(state.destinationId).toBe(1)
  })

  it("resets to canonical initial selection state", () => {
    useSelectionStore.getState().setOriginCountry("PE")
    useSelectionStore.getState().setDestinationCountry("CO")
    useSelectionStore.getState().setOrigin(1)
    useSelectionStore.getState().setDestination(10)

    useSelectionStore.getState().resetSelection()

    expect(useSelectionStore.getState()).toMatchObject(INITIAL_SELECTION_STATE)
  })
})
