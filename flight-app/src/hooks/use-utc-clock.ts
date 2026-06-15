import { useEffect, useState } from "react"

function formatUtc(date: Date): string {
  const hh = String(date.getUTCHours()).padStart(2, "0")
  const mm = String(date.getUTCMinutes()).padStart(2, "0")
  const ss = String(date.getUTCSeconds()).padStart(2, "0")
  return `${hh}:${mm}:${ss}`
}

/** Live UTC wall clock, ticking once per second. */
export function useUtcClock(): string {
  const [now, setNow] = useState(() => formatUtc(new Date()))

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(formatUtc(new Date()))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  return now
}
