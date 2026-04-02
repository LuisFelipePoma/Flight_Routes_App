import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FieldLabel } from "../ui/field"
import type { SubmitEvent } from "react"
import { useSelectionStore } from "@/stores/selection-store"
import { useDataStore } from "@/stores/data-store"
import { useShallow } from "zustand/shallow"

interface SelectionFormProps {
  isLoading?: boolean
  isDisabled?: boolean
  loadError?: string | null
  validationMessage?: string | null
  onSubmit: () => void
}

function parseNullableNumber(value: string): number | null {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function SelectionForm({
  isLoading = false,
  isDisabled = false,
  loadError,
  validationMessage,
  onSubmit,
}: SelectionFormProps) {
  const { countries } = useDataStore(useShallow((s) => ({ countries: s.countries })))
  const originCountryCode = useSelectionStore((state) => state.originCountryCode)
  const destinationCountryCode = useSelectionStore((state) => state.destinationCountryCode)
  const setOriginCountry = useSelectionStore((state) => state.setOriginCountry)
  const setDestinationCountry = useSelectionStore((state) => state.setDestinationCountry)
  const originId = useSelectionStore((state) => state.originId)
  const destinationId = useSelectionStore((state) => state.destinationId)
  const setOrigin = useSelectionStore((state) => state.setOrigin)
  const setDestination = useSelectionStore((state) => state.setDestination)
  const controlsDisabled = isDisabled || isLoading || Boolean(loadError)
  const submitDisabled =
    controlsDisabled ||
    !originCountryCode ||
    !destinationCountryCode ||
    Boolean(validationMessage)

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!submitDisabled) {
      onSubmit()
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Flight route selection</CardTitle>
        <CardDescription>
          Choose origin and destination countries, then select distinct airports.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <fieldset className="space-y-5" disabled={controlsDisabled}>
            <legend className="sr-only">Flight route selection controls</legend>
            <section className="flex gap-2">
              <Field className="space-y-2">
                <FieldLabel htmlFor="origin-country-select">Origin country</FieldLabel>
                <Select
                  value={originCountryCode ?? ""}
                  aria-required="true"
                  onValueChange={(event) => {
                    setOriginCountry(event || null)
                  }}
                  aria-describedby={loadError ? "selection-load-error" : undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select origin country" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-72">
                    {countries.map((option) => (
                      <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field className="space-y-2">
                <FieldLabel htmlFor="destination-country-select">Destination country</FieldLabel>
                <Select
                  value={destinationCountryCode ?? ""}
                  aria-required="true"
                  onValueChange={(event) => {
                    setDestinationCountry(event || null)
                  }}
                  aria-describedby={loadError ? "selection-load-error" : undefined}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination country" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-72">
                    {countries.map((option) => (
                      <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

            </section>
            <section className="flex gap-2">
              <Field className="space-y-2">
                <FieldLabel>Origin airport</FieldLabel>
                <Select
                  value={originId !== null ? String(originId) : ""}
                  aria-required="true"
                  onValueChange={(event) => {
                    setOrigin(parseNullableNumber(event))
                  }}
                  disabled={controlsDisabled || !originCountryCode}
                  aria-describedby={validationMessage ? "selection-validation" : undefined}
                  aria-invalid={Boolean(validationMessage)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select origin airport" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-72">
                    {countries.filter((option) => option.value === originCountryCode).map((option) => (
                      <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field className="space-y-2">
                <FieldLabel htmlFor="destination-select">Destination airport</FieldLabel>
                <Select
                  value={destinationId !== null ? String(destinationId) : ""}
                  aria-required="true"
                  onValueChange={(event) => {
                    setDestination(parseNullableNumber(event))
                  }}
                  disabled={controlsDisabled || !destinationCountryCode}
                  aria-describedby={validationMessage ? "selection-validation" : undefined}
                  aria-invalid={Boolean(validationMessage)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination airport" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-72">
                    {countries.filter((option) => option.value === destinationCountryCode).map((option) => (
                      <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </section>
          </fieldset>

          {validationMessage ? (
            <p
              id="selection-validation"
              role="alert"
              aria-live="assertive"
              className="text-sm text-destructive"
            >
              {validationMessage}
            </p>
          ) : null}

          {loadError ? (
            <div
              id="selection-load-error"
              role="alert"
              className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm"
            >
              <p className="text-destructive">{loadError}</p>
            </div>
          ) : null}

          <div className="flex items-center justify-end">
            <Button type="submit" disabled={submitDisabled}>
              {isLoading ? "Loading datasets..." : "Calculate route"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export type { SelectionFormProps }
