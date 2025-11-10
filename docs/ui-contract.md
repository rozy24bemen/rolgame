# Contrato de UI — Panel de Facciones e Inspector Contextual

Este documento define el contrato de datos, eventos y consultas para implementar el Frontend (React/Vue/Svelte) que consume el API Gateway (GraphQL/REST) y SSE/WebSocket.

## Panel de Facciones

Objetivo: vista macro de cada facción (recursos, estabilidad, relaciones, objetivos) y detalle con orquestación (sugerir estrategia LLM, límites, snapshots).

Props (entrada):
- factions: FactionSummary[]
- selection: { factionId?: string }
- tickInfo: { tick: number; season?: string }

Callbacks (salida):
- onSelectFaction(factionId: string)
- onToggleLLM(factionId: string, enabled: boolean)
- onAdjustLLMLimit(factionId: string, decisionsPerEra: number)
- onSuggestStrategy(factionId: string, text: string)
- onOpenTreatyDraft(aId: string, bId: string)
- onSnapshotFaction(factionId: string)

Tipos (resumen):
- FactionSummary
  - id, name, cultureId?
  - treasury: number
  - stability: number
  - territories: number
  - militaryStrength: number
  - relations: { stateId: string; attitude: number; tradeVolume?: number }[]
  - objectives: ObjectiveNode[]
  - llmStatus: { enabled: boolean; decisionsPerEra: number; remainingQuota: number }
  - alerts?: Alert[]
- ObjectiveNode: { id, title, status: 'planned'|'active'|'blocked'|'done', children? }
- Alert: { type: 'war'|'unrest'|'bankrupt'|'famine', severity: 'low'|'med'|'high', message: string }

GraphQL (lectura):
- query Factions(filter, page, pageSize) { factions { ...FactionSummary } }
- query Faction(id) { faction(id: ID!) { detalle + armies + settlements } }

REST (acciones):
- POST /factions/{id}/llm { enabled, decisionsPerEra? }
- POST /factions/{id}/suggest { text }
- POST /factions/{aId}/treaty/draft { bId, aims }
- POST /snapshots/faction { id }

SSE/WebSocket (tiempo real):
- topic: faction-updates → KPIs/alerts minimalistas
- topic: objectives-updates → cambios de árbol de objetivos

Edge cases:
- Muchas facciones → paginación + virtualización
- Relaciones N×N → mostrar top-N y botón “ver todas”
- LLM apagado → deshabilitar controles dependientes, mostrar quotas

## Inspector Contextual

Objetivo: mostrar datos y acciones contextuales al seleccionar una entidad del mapa.

Selección:
- { kind: 'cell'|'settlement'|'army'|'state'; id: string|number }

Vistas:
- Cell: { id, q, r, biome, height, passable, movementCost, stateId, provinceId, cultureId, neighbors?, overlays? }
- Settlement: { id, name, cellId, pop, marketTier, garrison, ownerStateId, tradeLinks[] }
- Army: { id, stateId, locationCellId, strength, supply, stance, composition, orders? }
- State: (como FactionSummary reducido)

Callbacks:
- onFocusEntity({ kind, id })
- onRequestRoutesFrom(cellId)
- onPinEntity({ kind, id })
- onOpenMarket(settlementId)
- onOpenOrders(armyId)

GraphQL (lectura):
- query Cell(id)
- query Settlement(id)
- query Army(id)
- query Faction(id)

SSE/WebSocket:
- world-updates by viewport → { type: 'army-move'|'battle'|'demographic', ids[], bbox?, tick }
- entity-updates → cambios por id

Rendimiento:
- Cargas mínimas y expandibles (lazy)
- Cache por id + refresh por tick
- Centrado de cámara si entidad sale del viewport

Accesibilidad:
- Navegación por teclado, roles ARIA, contraste configurable

---

Para tipos detallados y SDL GraphQL, ver `packages/schema/ts/types.ts` y `packages/schema/graphql/schema.graphql`.
