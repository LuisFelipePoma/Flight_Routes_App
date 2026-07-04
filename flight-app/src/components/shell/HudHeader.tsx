import { useQDataset } from "@/lib/services/useQDataset"
import { useUtcClock } from "@/hooks/use-utc-clock"

export function HudHeader() {
  const clock = useUtcClock()
  const { data, isLoading } = useQDataset().query
  const linked = Boolean(data) && !isLoading

  return (
    <header className="flex min-w-0 items-center justify-between gap-3 border-b border-border bg-card/40 px-4 py-2.5 backdrop-blur-sm sm:px-5">
      <div className="flex min-w-0 items-baseline gap-3">
        <span className="font-display text-base tracking-[0.08em] text-foreground">
          Flight Routes
        </span>
        <span className="hidden font-mono text-[10px] tracking-widest text-muted-foreground uppercase sm:inline">
          route planner
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-3 font-mono text-[10px] tracking-widest uppercase sm:gap-5 sm:text-[11px]">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-muted-foreground">UTC</span>
          <span className="text-foreground tabular-nums">{clock}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={
              linked
                ? "h-2 w-2 rounded-full bg-primary shadow-[var(--shadow-glow-green)]"
                : "lamp-pulse h-2 w-2 rounded-full bg-accent shadow-[var(--shadow-glow-amber)]"
            }
            aria-hidden
          />
        </div>
      </div>
    </header>
  )
}
