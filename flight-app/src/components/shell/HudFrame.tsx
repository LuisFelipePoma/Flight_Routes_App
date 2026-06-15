import type { ReactNode } from "react"

/** Corner brackets + range-ring legend framing the radar scope. */
export function HudFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {children}

      {/* corner brackets */}
      <span className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l border-t border-primary/50" />
      <span className="pointer-events-none absolute right-2 top-2 h-5 w-5 border-r border-t border-primary/50" />
      <span className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 border-b border-l border-primary/50" />
      <span className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b border-r border-primary/50" />

      {/* legend */}
      <div className="pointer-events-none absolute left-3 top-3 font-mono text-[10px] uppercase tracking-widest text-primary/60">
        SCOPE 01
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        ORTHO · DRAG TO SLEW
      </div>
    </div>
  )
}
