import { cn } from "@/lib/utils"
import type { AlgorithmKey } from "@/lib/types/flight"
import { useTypewriter } from "@/hooks/use-typewriter"

interface AlgorithmSelectorProps {
  algorithm: AlgorithmKey
  onChange: (next: AlgorithmKey) => void
  disabled?: boolean
}

const ALGORITHMS: { key: AlgorithmKey; label: string; description: string }[] = [
  { key: "dijkstra", label: "Dijkstra", description: "Shortest weighted path" },
  { key: "dfs", label: "DFS", description: "Depth-first traversal path" },
  { key: "prim", label: "Prim", description: "MST frontier-derived path" },
]

export function AlgorithmSelector({ algorithm, onChange, disabled }: AlgorithmSelectorProps) {
  const active = ALGORITHMS.find((a) => a.key === algorithm) ?? ALGORITHMS[0]
  const typed = useTypewriter(active.description)

  return (
    <section className="flex flex-col gap-2" aria-label="Algorithm selector">
      <div className="flex flex-col gap-1.5" role="group">
        {ALGORITHMS.map((item, index) => {
          const isActive = item.key === algorithm
          return (
            <button
              key={item.key}
              type="button"
              aria-label={item.label}
              aria-pressed={isActive}
              disabled={disabled}
              onClick={() => onChange(item.key)}
              className={cn(
                "relative flex items-center gap-3 overflow-hidden rounded-sm border px-3 py-2 text-left transition-all outline-none",
                "focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                isActive
                  ? "border-primary/70 bg-primary/10 shadow-glow-green"
                  : "border-border hover:border-primary/40"
              )}
            >
              <span
                className={cn(
                  "absolute inset-y-0 left-0 w-1 transition-colors",
                  isActive ? "bg-primary" : "bg-transparent"
                )}
                aria-hidden
              />
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                MODE {index + 1}
              </span>
              <span
                className={cn(
                  "font-display text-xs tracking-[0.18em]",
                  isActive ? "text-primary" : "text-foreground/80"
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>

      <p className="min-h-[1.25rem] font-mono text-[11px] uppercase tracking-wider text-data">
        {typed}
        <span className="cursor-blink" aria-hidden />
      </p>
    </section>
  )
}

export type { AlgorithmSelectorProps }
