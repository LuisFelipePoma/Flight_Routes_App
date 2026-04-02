import { create } from "zustand"
import {
  DatasetError,
  loadFlightDatasets,
  type FlightDatasets,
} from "@/lib/data/datasets"
import { buildFlightGraph } from "@/lib/graph/build-graph"
import type { Airport, FlightGraph } from "@/lib/types/flight"

interface SelectionState {
  datasets: FlightDatasets | null
  graph: FlightGraph | null
  isLoading: boolean
  error: string | null
  originCountryCode: string | null
  destinationCountryCode: string | null
  originId: number | null
  destinationId: number | null
  validationMessage: string | null
  canSubmit: boolean
  loadDatasets: () => Promise<void>
  retryLoad: () => Promise<void>
  setOriginCountry: (countryCode: string | null) => void
  setDestinationCountry: (countryCode: string | null) => void
  selectCountryFromMap: (countryCode: string) => void
  setOrigin: (originId: number | null) => void
  setDestination: (destinationId: number | null) => void
  resetSelection: () => void
}

const SAME_AIRPORT_MESSAGE =
  "Origin and destination must be different airports."

function getCountryAirports(
  airports: Airport[],
  countryCode: string | null
): Airport[] {
  if (!countryCode) {
    return []
  }

  return airports
    .filter((airport) => airport.country_code === countryCode)
    .sort((a, b) => a.airport_name.localeCompare(b.airport_name))
}

function resolveAirportForCountry(
  airportId: number | null,
  airports: Airport[],
  countryCode: string | null
): number | null {
  if (airportId === null || !countryCode) {
    return null
  }

  return airports.some(
    (airport) => airport.id === airportId && airport.country_code === countryCode
  )
    ? airportId
    : null
}

function computeSelectionState(
  state: Pick<
    SelectionState,
    | "datasets"
    | "isLoading"
    | "error"
    | "originCountryCode"
    | "destinationCountryCode"
    | "originId"
    | "destinationId"
  >
): Pick<SelectionState, "originId" | "destinationId" | "validationMessage" | "canSubmit"> {
  const airports = state.datasets?.airports ?? []
  const originId = resolveAirportForCountry(state.originId, airports, state.originCountryCode)
  const destinationId = resolveAirportForCountry(
    state.destinationId,
    airports,
    state.destinationCountryCode
  )
  const validationMessage = resolveValidationMessage(originId, destinationId)

  return {
    originId,
    destinationId,
    validationMessage,
    canSubmit: resolveCanSubmit({
      isLoading: state.isLoading,
      error: state.error,
      originId,
      destinationId,
      validationMessage,
    }),
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof DatasetError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Unable to load datasets. Please try again."
}

function resolveValidationMessage(
  originId: number | null,
  destinationId: number | null
): string | null {
  if (originId !== null && destinationId !== null && originId === destinationId) {
    return SAME_AIRPORT_MESSAGE
  }

  return null
}

function resolveCanSubmit(
  state: Pick<
    SelectionState,
    "isLoading" | "error" | "originId" | "destinationId" | "validationMessage"
  >
): boolean {
  return (
    !state.isLoading &&
    !state.error &&
    state.originId !== null &&
    state.destinationId !== null &&
    state.validationMessage === null
  )
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  datasets: null,
  graph: null,
  isLoading: false,
  error: null,
  originCountryCode: null,
  destinationCountryCode: null,
  originId: null,
  destinationId: null,
  validationMessage: null,
  canSubmit: false,

  async loadDatasets() {
    set({
      isLoading: true,
      error: null,
      canSubmit: false,
    })

    try {
      const datasets = await loadFlightDatasets()
      const graph = buildFlightGraph(datasets.airports, datasets.routes)

      set((state) => {
        const selectionState = computeSelectionState({
          datasets,
          isLoading: false,
          error: null,
          originCountryCode: state.originCountryCode,
          destinationCountryCode: state.destinationCountryCode,
          originId: state.originId,
          destinationId: state.destinationId,
        })

        return {
          datasets,
          graph,
          isLoading: false,
          error: null,
          ...selectionState,
        }
      })
    } catch (error) {
      set({
        datasets: null,
        graph: null,
        isLoading: false,
        error: toErrorMessage(error),
        originId: null,
        destinationId: null,
        validationMessage: null,
        canSubmit: false,
      })
    }
  },

  async retryLoad() {
    await get().loadDatasets()
  },

  setOriginCountry(countryCode) {
    set((state) => ({
      originCountryCode: countryCode,
      ...computeSelectionState({
        datasets: state.datasets,
        isLoading: state.isLoading,
        error: state.error,
        originCountryCode: countryCode,
        destinationCountryCode: state.destinationCountryCode,
        originId: state.originId,
        destinationId: state.destinationId,
      }),
    }))
  },

  setDestinationCountry(countryCode) {
    set((state) => ({
      destinationCountryCode: countryCode,
      ...computeSelectionState({
        datasets: state.datasets,
        isLoading: state.isLoading,
        error: state.error,
        originCountryCode: state.originCountryCode,
        destinationCountryCode: countryCode,
        originId: state.originId,
        destinationId: state.destinationId,
      }),
    }))
  },

  selectCountryFromMap(countryCode) {
    set((state) => {
      let nextOriginCountry = state.originCountryCode
      let nextDestinationCountry = state.destinationCountryCode

      // Deterministic cycle:
      // 1) First click picks origin.
      // 2) Second distinct click picks destination.
      // 3) Later distinct clicks replace destination.
      // Clicking the current origin does not mutate selection.
      if (!state.originCountryCode) {
        nextOriginCountry = countryCode
      } else if (!state.destinationCountryCode) {
        if (countryCode !== state.originCountryCode) {
          nextDestinationCountry = countryCode
        }
      } else if (countryCode !== state.originCountryCode) {
        nextDestinationCountry = countryCode
      }

      return {
        originCountryCode: nextOriginCountry,
        destinationCountryCode: nextDestinationCountry,
        ...computeSelectionState({
          datasets: state.datasets,
          isLoading: state.isLoading,
          error: state.error,
          originCountryCode: nextOriginCountry,
          destinationCountryCode: nextDestinationCountry,
          originId: state.originId,
          destinationId: state.destinationId,
        }),
      }
    })
  },

  setOrigin(originId) {
    set((state) => {
      const validationMessage = resolveValidationMessage(originId, state.destinationId)

      return {
        originId,
        validationMessage,
        canSubmit: resolveCanSubmit({
          isLoading: state.isLoading,
          error: state.error,
          originId,
          destinationId: state.destinationId,
          validationMessage,
        }),
      }
    })
  },

  setDestination(destinationId) {
    set((state) => {
      const validationMessage = resolveValidationMessage(state.originId, destinationId)

      return {
        destinationId,
        validationMessage,
        canSubmit: resolveCanSubmit({
          isLoading: state.isLoading,
          error: state.error,
          originId: state.originId,
          destinationId,
          validationMessage,
        }),
      }
    })
  },

  resetSelection() {
    set((state) => ({
      originCountryCode: null,
      destinationCountryCode: null,
      originId: null,
      destinationId: null,
      validationMessage: null,
      canSubmit: resolveCanSubmit({
        isLoading: state.isLoading,
        error: state.error,
        originId: null,
        destinationId: null,
        validationMessage: null,
      }),
    }))
  },
}))

export function selectCountries(state: SelectionState): string[] {
  const airports = state.datasets?.airports ?? []
  return [...new Set(airports.map((airport) => airport.country_code))].sort((a, b) =>
    a.localeCompare(b)
  )
}

export function selectOriginCountryAirports(state: SelectionState): Airport[] {
  return getCountryAirports(state.datasets?.airports ?? [], state.originCountryCode)
}

export function selectDestinationCountryAirports(state: SelectionState): Airport[] {
  return getCountryAirports(state.datasets?.airports ?? [], state.destinationCountryCode)
}
