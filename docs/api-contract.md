# Contrato de API — REST + SSE (BFF)

Este contrato acompaña el esquema GraphQL y define las acciones de orquestación y eventos en tiempo real.

## REST — Acciones

- POST /world/tick
  - Body: { count?: number }
  - Efecto: avanza el simulador determinista N ticks.

- POST /factions/{id}/llm
  - Body: { enabled: boolean, decisionsPerEra?: number }
  - Efecto: controla el uso de LLM para la facción.

- POST /factions/{id}/suggest
  - Body: { text: string }
  - Efecto: añade una “sugerencia estratégica” al consejero LLM. No obliga al plan.

- POST /factions/{aId}/treaty/draft
  - Body: { bId: string, aims: string }
  - Efecto: inicia borrador de tratado (opcionalmente apoyado por LLM). Requiere validación humana.

- POST /relations/{aId}/{bId}/casus_belli
  - Body: { reason: string }
  - Efecto: registra una causa justificada de guerra (no fuerza acción militar inmediata).

- POST /world/event
  - Body: { type: string, payload: JSON }
  - Efecto: inyecta un evento sistémico (plague, disaster, discovery). El Core lo resuelve.

- POST /snapshots/faction
  - Body: { id: string }
  - Efecto: crea snapshot versionado del estado de una facción.

- POST /snapshots/world
  - Body: { label?: string }
  - Efecto: snapshot global para ramificar timelines.

## SSE / WebSocket — Temas

- /sse/world-updates?viewport=bbox
  - Payload: { type, ids, bbox?, tick }
  - Tipos: 'army-move' | 'battle' | 'demographic' | 'event'

- /sse/faction-updates
  - Payload: FactionSummary (parcial) para KPIs/alerts

- /sse/objectives-updates?factionId=...
  - Payload: ObjectiveNode[] (actualización del árbol)

## Notas de seguridad y costes

- Limitar acciones de orquestación con permisos (roles, tokens).
- Cuotas y rate limiting por usuario/facción para evitar abusos de LLM y estrés del simulador.
- Idempotencia en POST críticos (tick, event) y registro de auditoría.
