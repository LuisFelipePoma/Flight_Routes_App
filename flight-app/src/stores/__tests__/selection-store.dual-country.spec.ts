import { beforeEach, describe, expect, it } from "vitest"

import { INITIAL_SELECTION_STATE, useSelectionStore } from "@/stores/selection-store"

describe("selection-store dual-country flows", () => {
  beforeEach(() => {
    useSelectionStore.setState(INITIAL_SELECTION_STATE)
  })

  it("assigns map clicks to the active role", () => {
    useSelectionStore.getState().selectCountryFromMap("PE")
    useSelectionStore.getState().setOrigin(1)

    useSelectionStore.getState().setActiveRole("destination")
    useSelectionStore.getState().selectCountryFromMap("CO")
    useSelectionStore.getState().setDestination(10)

    let state = useSelectionStore.getState()
    expect(state.activeRole).toBe("destination")
    expect(state.originCountryCode).toBe("PE")
    expect(state.destinationCountryCode).toBe("CO")
    expect(state.originId).toBe(1)
    expect(state.destinationId).toBe(10)

    useSelectionStore.getState().setActiveRole("origin")
    useSelectionStore.getState().selectCountryFromMap("AR")

    state = useSelectionStore.getState()
    expect(state.activeRole).toBe("origin")
    expect(state.originCountryCode).toBe("AR")
    expect(state.destinationCountryCode).toBe("CO")
    expect(state.originId).toBeNull()
    expect(state.destinationId).toBe(10)
  })

  it("keeps airport IDs when the country is unchanged and clears only the changed side", () => {
    useSelectionStore.getState().setOriginCountry("PE")
    useSelectionStore.getState().setDestinationCountry("CO")
    useSelectionStore.getState().setOrigin(1)
    useSelectionStore.getState().setDestination(10)

    useSelectionStore.getState().setOriginCountry("PE")

    let state = useSelectionStore.getState()
    expect(state.originId).toBe(1)
    expect(state.destinationId).toBe(10)

    useSelectionStore.getState().setDestinationCountry("AR")

    state = useSelectionStore.getState()
    expect(state.originCountryCode).toBe("PE")
    expect(state.destinationCountryCode).toBe("AR")
    expect(state.originId).toBe(1)
    expect(state.destinationId).toBeNull()
  })

  it("allows same country for both sides while keeping airport IDs distinct", () => {
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
})
