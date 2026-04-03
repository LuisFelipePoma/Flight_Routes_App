import { create } from "zustand"

export interface SelectionState {
  originCountryCode: string | null
  destinationCountryCode: string | null
  originId: number | null
  destinationId: number | null
}

export interface SelectionActions {
  setOriginCountry: (countryCode: string | null) => void
  setDestinationCountry: (countryCode: string | null) => void
  selectCountryFromMap: (countryCode: string) => void
  setOrigin: (originId: number | null) => void
  setDestination: (destinationId: number | null) => void
  resetSelection: () => void
}

type SelectionStore = SelectionState & SelectionActions

export const INITIAL_SELECTION_STATE: SelectionState = {
  originCountryCode: null,
  destinationCountryCode: null,
  originId: null,
  destinationId: null,
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  ...INITIAL_SELECTION_STATE,

  setOriginCountry(countryCode) {
    set(() => ({
      originCountryCode: countryCode,
    }))
  },

  setDestinationCountry(countryCode) {
    set(() => ({
      destinationCountryCode: countryCode,
    }))
  },

  selectCountryFromMap(countryCode) {
    set((state) => {
      if (!state.originCountryCode) {
        return {
          originCountryCode: countryCode,
        }
      }

      if (!state.destinationCountryCode) {
        return {
          destinationCountryCode: countryCode,
        }
      }
      return {
        originCountryCode: countryCode,
        destinationCountryCode: null,
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
