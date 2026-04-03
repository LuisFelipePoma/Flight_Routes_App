import { describe, expectTypeOf, it } from "vitest"

import type { SelectionActions, SelectionState } from "@/stores/selection-store"

type HasLegacySelectionStateKeys =
  "canSubmit" extends keyof SelectionState
    ? true
    : "validationMessage" extends keyof SelectionState
      ? true
      : false

type HasLegacySelectionActionKeys =
  "loadDatasets" extends keyof SelectionActions
    ? true
    : "retryLoad" extends keyof SelectionActions
      ? true
      : false

describe("selection-store contract guard", () => {
  it("exposes current selection state/actions and no legacy API", () => {
    expectTypeOf<SelectionState>().toMatchTypeOf<{
      originCountryCode: string | null
      destinationCountryCode: string | null
      originId: number | null
      destinationId: number | null
    }>()

    expectTypeOf<SelectionActions>().toMatchTypeOf<{
      setOriginCountry: (countryCode: string | null) => void
      setDestinationCountry: (countryCode: string | null) => void
      selectCountryFromMap: (countryCode: string) => void
      setOrigin: (originId: number | null) => void
      setDestination: (destinationId: number | null) => void
      resetSelection: () => void
    }>()

    expectTypeOf<HasLegacySelectionStateKeys>().toEqualTypeOf<false>()
    expectTypeOf<HasLegacySelectionActionKeys>().toEqualTypeOf<false>()
  })
})
