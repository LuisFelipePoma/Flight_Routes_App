import { useQDataset } from "@/lib/services/useQDataset"
import { useUtcClock } from "@/hooks/use-utc-clock"

export function HudHeader() {
  const clock = useUtcClock()
  const { data, isLoading } = useQDataset().query
  const linked = Boolean(data) && !isLoading

  return (
    <header className="flex items-center justify-between border-b border-border bg-card/40 px-5 py-2.5 backdrop-blur-sm">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-base tracking-[0.22em] text-primary [text-shadow:var(--shadow-glow-green)]">
          PHOSPHOR
        </span>
        <span className="font-display text-base tracking-[0.22em] text-foreground">
          // TRACON
        </span>
        <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          flight route control
        </span>
      </div>

      <div className="flex items-center gap-6 font-mono text-[11px] uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">SECTOR</span>
          <span className="text-data">GLOBAL-01</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">UTC</span>
          <span className="tabular-nums text-foreground">{clock}</span>
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
          <span className={linked ? "text-primary" : "text-accent"}>
            {linked ? "LINK ESTABLISHED" : "ACQUIRING…"}
          </span>
        </div>
      </div>
    </header>
  )
}
