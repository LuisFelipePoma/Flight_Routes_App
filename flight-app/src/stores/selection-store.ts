import { create } from "zustand"

interface SelectionState {
  originCountryCode: string | null
  destinationCountryCode: string | null
  originId: number | null
  destinationId: number | null
  setOriginCountry: (countryCode: string | null) => void
  setDestinationCountry: (countryCode: string | null) => void
  selectCountryFromMap: (countryCode: string) => void
  setOrigin: (originId: number | null) => void
  setDestination: (destinationId: number | null) => void
  resetSelection: () => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  datasets: null,
  originCountryCode: null,
  destinationCountryCode: null,
  originId: null,
  destinationId: null,

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
			// SIMPLE WAY DEAHH
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
    set(() => ({
      originCountryCode: null,
      destinationCountryCode: null,
      originId: null,
      destinationId: null,
    }))
  },
}))
