import { useMemo } from "react"
import { useSelectionStore } from "@/stores/selection-store"
import { useRoutesStore } from "@/stores/routes-store"
import { useQDataset } from "@/lib/services/useQDataset"

interface StatusBarProps {
  hoveredCode: string | null
}

export function StatusBar({ hoveredCode }: StatusBarProps) {
  const { data: dataset } = useQDataset().query
  const activeRole = useSelectionStore((s) => s.activeRole)
  const originId = useSelectionStore((s) => s.originId)
  const destinationId = useSelectionStore((s) => s.destinationId)
  const algorithm = useRoutesStore((s) => s.algorithm)

  const { countryByCode, airportById } = useMemo(() => {
    const countryByCode = new Map<string, string>()
    const airportById = new Map<number, { code: string }>()
    for (const a of dataset?.airports ?? []) {
      if (!countryByCode.has(a.country_code)) {
        countryByCode.set(a.country_code, a.country)
      }
      airportById.set(Number(a.id), { code: a.code_airport })
    }
    return { countryByCode, airportById }
  }, [dataset])

  const hoveredCountry = hoveredCode
    ? `${countryByCode.get(hoveredCode) ?? "Unknown"} (${hoveredCode})`
    : "None"
  const orig = originId !== null ? airportById.get(originId)?.code ?? "---" : "----"
  const dest = destinationId !== null ? airportById.get(destinationId)?.code ?? "---" : "----"
  const activeLabel = activeRole === "origin" ? "From" : "To"
  const algorithmLabel =
    algorithm === "dijkstra" ? "Dijkstra" : algorithm === "dfs" ? "DFS" : "Prim"

  return (
    <footer className="flex items-center gap-4 overflow-hidden border-t border-border bg-card/40 px-4 py-1.5 font-mono text-[10px] text-muted-foreground backdrop-blur-sm sm:px-5">
      <span className="min-w-0 truncate">
        Hover <span className="text-data">{hoveredCountry}</span>
      </span>
      <span className="hidden sm:inline">
        From <span className="text-primary">{orig}</span>
      </span>
      <span className="hidden sm:inline">
        To <span className="text-accent">{dest}</span>
      </span>
      <span className="hidden md:inline">
        Mode <span className="text-foreground">{algorithmLabel}</span>
      </span>
      <span className="ml-auto shrink-0">
        Editing{" "}
        <span className={activeRole === "origin" ? "text-primary" : "text-accent"}>
          {activeLabel}
        </span>
      </span>
    </footer>
  )
}
