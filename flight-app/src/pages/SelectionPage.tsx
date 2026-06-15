import { useEffect } from "react"
import { SelectionConsole } from "@/components/selection/SelectionConsole"
import { useSelectionStore } from "@/stores/selection-store"
import { useRoutesStore } from "@/stores/routes-store"
import { useQDataset } from "@/lib/services/useQDataset"
import { useDataStore } from "@/stores/data-store"
import { useConsoleTransition } from "@/hooks/use-console-transition"

export function SelectionPage() {
  const seedData = useDataStore((s) => s.seedData)
  const originId = useSelectionStore((state) => state.originId)
  const destinationId = useSelectionStore((state) => state.destinationId)
  const primeContext = useRoutesStore((state) => state.primeContext)
  const clearResult = useRoutesStore((state) => state.clearResult)
  const { consoleRef, transitionTo } = useConsoleTransition<HTMLDivElement>()

  const { data: dataset, isLoading } = useQDataset().query

  const hasSelectedAirports =
    originId !== null && destinationId !== null && originId !== destinationId
  const validationMessage =
    originId !== null && destinationId !== null && originId === destinationId
      ? "Origin and destination must be different airports."
      : null

  const handleSubmit = () => {
    if (!hasSelectedAirports) {
      return
    }
    primeContext({ originId, destinationId })
    clearResult()
    transitionTo("/routes")
  }

  useEffect(() => {
    if (dataset) {
      seedData(dataset.routes, dataset.airports)
    }
  }, [dataset, seedData])

  return (
    <div ref={consoleRef} className="h-full min-h-0">
      <SelectionConsole
        isLoading={isLoading}
        validationMessage={validationMessage}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
