# SDK de Cliente (TypeScript)

Cliente ligero para consumir el GraphQL, REST y SSE del BFF.

## Uso rápido

```ts
import { createConfig, createQueries, createRest, connectSSE } from "../sdk/src";

const cfg = createConfig({
  graphQLEndpoint: "/api/graphql",
  restBaseUrl: "/api",
  getHeaders: () => ({ Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` }),
});

const q = createQueries(cfg);
const rest = createRest(cfg);

// GraphQL
const factions = await q.getFactions();
const one = await q.getFaction("F1");

// REST
await rest.postWorldTick(1);
await rest.postFactionLLM("F1", { enabled: true, decisionsPerEra: 3 });

// SSE
const sub = connectSSE("/sse/world-updates?viewport=...", msg => console.log("update", msg));
// sub.close();
```

Ajusta los endpoints según tu despliegue. Este SDK asume que el servidor expone contratos definidos en `docs/api-contract.md` y `packages/schema/graphql/schema.graphql`.
