import { create } from "zustand"

export type SelectionRole = "origin" | "destination"

export interface SelectionState {
  activeRole: SelectionRole
  originCountryCode: string | null
  destinationCountryCode: string | null
  originId: number | null
  destinationId: number | null
}

export interface SelectionActions {
  setActiveRole: (role: SelectionRole) => void
  setOriginCountry: (countryCode: string | null) => void
  setDestinationCountry: (countryCode: string | null) => void
  selectCountryFromMap: (countryCode: string) => void
  setOrigin: (originId: number | null) => void
  setDestination: (destinationId: number | null) => void
  resetSelection: () => void
}

type SelectionStore = SelectionState & SelectionActions

export const INITIAL_SELECTION_STATE: SelectionState = {
  activeRole: "origin",
  originCountryCode: null,
  destinationCountryCode: null,
  originId: null,
  destinationId: null,
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  ...INITIAL_SELECTION_STATE,

  setActiveRole(role) {
    set({ activeRole: role })
  },

  setOriginCountry(countryCode) {
    set((state) => ({
      originCountryCode: countryCode,
      originId:
        state.originCountryCode === countryCode ? state.originId : null,
    }))
  },

  setDestinationCountry(countryCode) {
    set((state) => ({
      destinationCountryCode: countryCode,
      destinationId:
        state.destinationCountryCode === countryCode
          ? state.destinationId
          : null,
    }))
  },

  selectCountryFromMap(countryCode) {
    set((state) => {
      if (state.activeRole === "origin") {
        return {
          originCountryCode: countryCode,
          originId:
            state.originCountryCode === countryCode ? state.originId : null,
        }
      }

      return {
        destinationCountryCode: countryCode,
        destinationId:
          state.destinationCountryCode === countryCode
            ? state.destinationId
            : null,
      }
    })
  },

  setOrigin(originId) {
    set(() => {
      return {
        originId,
      }
    })
  },

  setDestination(destinationId) {
    set(() => {
      return {
        destinationId,
      }
    })
  },

  resetSelection() {
    set(() => ({ ...INITIAL_SELECTION_STATE }))
  },
}))
