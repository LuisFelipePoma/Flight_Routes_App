import { useMemo } from "react"
import { useSelectionStore } from "@/stores/selection-store"
import { useRoutesStore } from "@/stores/routes-store"
import { useQDataset } from "@/lib/services/useQDataset"
import { motionEnabled } from "@/lib/anim/motion"

interface StatusBarProps {
  hoveredCode: string | null
}

export function StatusBar({ hoveredCode }: StatusBarProps) {
  const { data: dataset } = useQDataset().query
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

  const track = hoveredCode
    ? `${hoveredCode} — ${(countryByCode.get(hoveredCode) ?? "UNKNOWN").toUpperCase()}`
    : "—"
  const orig = originId !== null ? airportById.get(originId)?.code ?? "···" : "····"
  const dest = destinationId !== null ? airportById.get(destinationId)?.code ?? "···" : "····"

  return (
    <footer className="flex items-center gap-6 overflow-hidden border-t border-border bg-card/40 px-5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
      <span>
        TRK <span className="text-data">{track}</span>
      </span>
      <span className="hidden sm:inline">
        ORIG <span className="text-primary">{orig}</span>
      </span>
      <span className="hidden sm:inline">
        DEST <span className="text-accent">{dest}</span>
      </span>
      <span className="hidden md:inline">
        MODE <span className="text-foreground">{algorithm.toUpperCase()}</span>
      </span>
      <span className="ml-auto flex items-center gap-4">
        <span className="hidden lg:inline">
          MOTION{" "}
          <span className={motionEnabled() ? "text-primary" : "text-muted-foreground"}>
            {motionEnabled() ? "ON" : "OFF"}
          </span>
        </span>
        <span>TRACON v2.0</span>
      </span>
    </footer>
  )
}
