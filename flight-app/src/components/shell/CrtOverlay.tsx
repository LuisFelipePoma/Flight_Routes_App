/**
 * Fixed, non-interactive CRT atmosphere: scanlines, vignette, a faint
 * turbulence grain, and a slow phosphor flicker. Sits above everything.
 */
const NOISE_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
  )

export function CrtOverlay() {
  return (
    <div className="crt-flicker pointer-events-none fixed inset-0 z-50">
      <div className="crt-scanlines absolute inset-0" />
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-screen"
        style={{ backgroundImage: `url("${NOISE_DATA_URI}")`, backgroundSize: "120px 120px" }}
      />
      <div className="crt-vignette absolute inset-0" />
    </div>
  )
}
