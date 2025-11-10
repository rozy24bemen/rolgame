# Wireframes Web (apps/web)

React + Vite + TypeScript wireframes for the Orchestrator UI. Uses Tailwind via CDN and the local SDK (packages/sdk).

## Run (dev)

```
cd apps/web
npm install
npm run dev
```

Dev server: http://localhost:5173/

We mock the backend via a Vite middleware that serves:
- GraphQL at /api/graphql (Factions, Faction, Cell, Settlement, Army, TickInfo)
- REST at /api/factions/:id/llm and /api/factions/:id/suggest

## Build

```
npm run build
npm run preview
```

## Lint

```
npm run lint
```

## Structure

- src/components/ FactionPanel and Inspector
- src/sdk.ts SDK bootstrap (config + queries + rest)
- vite.config.ts includes a dev-only mock API

To point the SDK to a real backend, change endpoints in src/sdk.ts or provide a reverse proxy.
