import { useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"

import { GlobeCanvas, type OverlayEndpoint } from "@/components/globe/GlobeCanvas"
import { SelectionForm } from "@/components/selection/SelectionForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSelectionStore } from "@/stores/selection-store"
import { useRoutesStore } from "@/stores/routes-store"

function toAirportOption(airport: { id: number; airport_name: string; city: string }) {
  return {
    value: String(airport.id),
    label: `${airport.airport_name} (${airport.city})`,
  }
}

export function SelectionPage() {
  const navigate = useNavigate()

  const datasets = useSelectionStore((state) => state.datasets)
  const graph = useSelectionStore((state) => state.graph)
  const isLoading = useSelectionStore((state) => state.isLoading)
  const error = useSelectionStore((state) => state.error)
  const originCountryCode = useSelectionStore((state) => state.originCountryCode)
  const destinationCountryCode = useSelectionStore((state) => state.destinationCountryCode)
  const originId = useSelectionStore((state) => state.originId)
  const destinationId = useSelectionStore((state) => state.destinationId)
  const validationMessage = useSelectionStore((state) => state.validationMessage)
  const canSubmit = useSelectionStore((state) => state.canSubmit)
  const loadDatasets = useSelectionStore((state) => state.loadDatasets)
  const retryLoad = useSelectionStore((state) => state.retryLoad)
  const setOriginCountry = useSelectionStore((state) => state.setOriginCountry)
  const setDestinationCountry = useSelectionStore((state) => state.setDestinationCountry)
  const selectCountryFromMap = useSelectionStore((state) => state.selectCountryFromMap)
  const setOrigin = useSelectionStore((state) => state.setOrigin)
  const setDestination = useSelectionStore((state) => state.setDestination)

  const primeContext = useRoutesStore((state) => state.primeContext)
  const clearResult = useRoutesStore((state) => state.clearResult)

  useEffect(() => {
    if (!datasets && !isLoading) {
      void loadDatasets()
    }
  }, [datasets, isLoading, loadDatasets])

  const countries = useMemo(
    () =>
      [...new Set((datasets?.airports ?? []).map((airport) => airport.country_code))]
        .sort((a, b) => a.localeCompare(b))
        .map((code) => ({ value: code, label: datasets?.airports.find((a) => a.country_code === code)?.country + " (" + code + ")" })),
    [datasets]
  )

  const originCountryAirports = useMemo(
    () =>
      (datasets?.airports ?? [])
        .filter((airport) => airport.country_code === originCountryCode)
        .sort((a, b) => a.airport_name.localeCompare(b.airport_name)),
    [datasets, originCountryCode]
  )

  const destinationCountryAirports = useMemo(
    () =>
      (datasets?.airports ?? [])
        .filter((airport) => airport.country_code === destinationCountryCode)
        .sort((a, b) => a.airport_name.localeCompare(b.airport_name)),
    [datasets, destinationCountryCode]
  )

  const airportsById = useMemo(
    () =>
      new Map(
        (datasets?.airports ?? []).map((airport) => [
          airport.id,
          airport,
        ])
      ),
    [datasets]
  )

  const endpoints = useMemo<OverlayEndpoint[]>(() => {
    const overlays: OverlayEndpoint[] = []

    if (originId !== null) {
      const origin = airportsById.get(originId)
      if (origin) {
        overlays.push({ id: `origin-${origin.id}`, kind: "origin", lon: origin.lon, lat: origin.lat })
      }
    }

    if (destinationId !== null) {
      const destination = airportsById.get(destinationId)
      if (destination) {
        overlays.push({
          id: `destination-${destination.id}`,
          kind: "destination",
          lon: destination.lon,
          lat: destination.lat,
        })
      }
    }

    return overlays
  }, [airportsById, destinationId, originId])

  const options = useMemo(() => {
    return {
      origins: originCountryAirports.map(toAirportOption),
      destinations: destinationCountryAirports.map(toAirportOption),
    }
  }, [destinationCountryAirports, originCountryAirports])

  const handleSubmit = () => {
    primeContext({
      graph,
      originId,
      destinationId,
    })
    clearResult()
    navigate("/routes")
  }

  return (
    <main className="h-screen w-screen bg-background px-6 py-8 text-foreground">
      <section
        aria-labelledby="selection-page-title"
        className="grid w-full gap-6 lg:grid-cols-[1.1fr_1fr] h-full"
      >
        <Card>
          <CardHeader>
            <CardTitle id="selection-page-title">Flight route planner</CardTitle>
          </CardHeader>
          <CardContent>
            <SelectionForm
              countries={countries}
              origins={options.origins}
              destinations={options.destinations}
              originCountryCode={originCountryCode}
              destinationCountryCode={destinationCountryCode}
              originId={originId}
              destinationId={destinationId}
              isLoading={isLoading}
              isDisabled={!datasets && !error}
              loadError={error}
              validationMessage={validationMessage}
              onOriginCountryChange={setOriginCountry}
              onDestinationCountryChange={setDestinationCountry}
              onOriginChange={setOrigin}
              onDestinationChange={setDestination}
              onSubmit={handleSubmit}
              onRetry={retryLoad}
            />
            {!canSubmit ? (
              <p className="mt-4 text-sm text-muted-foreground" role="status" aria-live="polite">
                Select origin and destination countries plus two different airports to enable route calculation.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <GlobeCanvas
          world={datasets?.world ?? null}
          selectedCountryCode={originCountryCode}
          onCountrySelect={selectCountryFromMap}
          overlayEndpoints={endpoints}
          className="h-full overflow-hidden rounded-lg border border-border"
        />
      </section>
    </main >
  )
}
