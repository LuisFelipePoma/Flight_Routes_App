import { useNavigate } from "react-router-dom"
import { GlobeCanvas } from "@/components/globe/GlobeCanvas"
import { SelectionForm } from "@/components/selection/SelectionForm"
import { useSelectionStore } from "@/stores/selection-store"
import { useRoutesStore } from "@/stores/routes-store"
import { useQDataset } from "@/lib/services/useQDataset"
import { useDataStore } from "@/stores/data-store"
import { useEffect } from "react"

export function SelectionPage() {
  const navigate = useNavigate()
  const seedData = useDataStore(s => s.seedData)
  const originId = useSelectionStore((state) => state.originId)
  const destinationId = useSelectionStore((state) => state.destinationId)
  const primeContext = useRoutesStore((state) => state.primeContext)
  const clearResult = useRoutesStore((state) => state.clearResult)

  const { data: dataset, isLoading } = useQDataset().query


  const handleSubmit = () => {
    primeContext({
      originId,
      destinationId,
    })
    clearResult()
    navigate("/routes")
  }
  useEffect(() => {
    if (dataset) {
      seedData(dataset.routes, dataset.world, dataset.airports)
    }
  }, [dataset, seedData])

  return (
    <main className="h-screen w-screen bg-background px-6 py-8 text-foreground">
      <section
        aria-labelledby="selection-page-title"
        className="grid w-full gap-6 lg:grid-cols-[1.1fr_1fr] h-full"
      >

        <SelectionForm
          isLoading={isLoading}
          onSubmit={handleSubmit}
        />
        <GlobeCanvas
          className="h-full overflow-hidden rounded-lg border border-border"
        />
      </section>
    </main >
  )
}
