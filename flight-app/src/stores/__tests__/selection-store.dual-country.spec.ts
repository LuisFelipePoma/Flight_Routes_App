import { beforeEach, describe, expect, it } from "vitest"

import { INITIAL_SELECTION_STATE, useSelectionStore } from "@/stores/selection-store"

describe("selection-store dual-country flows", () => {
  beforeEach(() => {
    useSelectionStore.setState(INITIAL_SELECTION_STATE)
  })

  it("applies map click cycle: first=origin, second=destination, third resets destination", () => {
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
    expect(state.originCountryCode).toBe("AR")
    expect(state.destinationCountryCode).toBeNull()
    expect(state.originId).toBe(1)
    expect(state.destinationId).toBe(10)
  })

  it("retains selected airport IDs across country changes until explicitly reset", () => {
    useSelectionStore.getState().setOriginCountry("PE")
    useSelectionStore.getState().setDestinationCountry("CO")
    useSelectionStore.getState().setOrigin(1)
    useSelectionStore.getState().setDestination(10)

    useSelectionStore.getState().setOriginCountry("AR")

    let state = useSelectionStore.getState()
    expect(state.originId).toBe(1)
    expect(state.destinationId).toBe(10)

    useSelectionStore.getState().setDestinationCountry("PE")

    state = useSelectionStore.getState()
    expect(state.destinationId).toBe(10)
  })
})
