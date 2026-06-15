# PHOSPHOR TRACON — Flight Routes

An interactive flight-route pathfinder rendered as a control-tower radar console.
A persistent D3 orthographic globe (the "scope") shows airports and computed
routes, while ATC-style flight strips drive origin/destination selection.
Routes are computed client-side with Dijkstra, DFS, or Prim over a haversine
distance graph.

Stack: React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui · Zustand ·
TanStack Query · D3 · anime.js.

## Requirements

- Node 20+
- [pnpm](https://pnpm.io) 11+ (this repo is pinned via `packageManager`)

## Getting started

```bash
pnpm install
pnpm dev
```

## Scripts

```bash
pnpm dev         # start the dev server
pnpm build       # type-check (tsc -b) and build for production
pnpm preview     # preview the production build
pnpm test        # run tests in watch mode (Vitest)
pnpm test:run    # run tests once
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
```

## Adding shadcn/ui components

```bash
pnpm dlx shadcn@latest add button
```

Components land in `src/components/ui`.

## Notes

- Dark-only CRT theme. All animations are gated behind a reduced-motion check,
  so `prefers-reduced-motion: reduce` (and the test environment) get a static UI.
- Flight/airport/world data is fetched from external JSON datasets via
  TanStack Query; there is no backend service.
