import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only mock API for GraphQL and REST
function mockApi() {
  return {
    name: 'mock-api',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url: string = req.url || '';
        const method: string = (req.method || 'GET').toUpperCase();

        // Helpers
        const sendJson = (obj: any, status = 200) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
        };
        const readBody = async () => {
          const chunks: any[] = [];
          for await (const chunk of req) chunks.push(chunk);
          const raw = Buffer.concat(chunks).toString('utf8');
          try { return JSON.parse(raw); } catch { return {}; }
        };

        // GraphQL mock
        if (url === '/api/graphql' && method === 'POST') {
          const body = await readBody();
          const q: string = body?.query || '';
          const v = body?.variables || {};

          // Minimal mock data (aligned with packages/schema)
          const mockFaction = {
            id: 'F1',
            name: 'Imperio de Azgaar',
            cultureId: 'C1',
            treasury: 53000,
            stability: 78.5,
            territories: 120,
            militaryStrength: 45000,
            relations: [
              { stateId: 'F2', attitude: -45, tradeVolume: 1200 },
              { stateId: 'F3', attitude: 85, tradeVolume: 5000 },
            ],
            objectives: [
              { id: 'o1', title: 'Asegurar el Paso del Dragón', status: 'active' },
              {
                id: 'o2', title: 'Equilibrar Balanza Comercial (Norte)', status: 'blocked',
                children: [
                  { id: 'o2a', title: 'Abrir nueva ruta a Montaña', status: 'planned' },
                  { id: 'o2b', title: 'Negociar tratado con Reino del Sol', status: 'blocked' },
                ],
              },
              { id: 'o3', title: 'Reforma Agraria y Tributaria', status: 'done' },
            ],
            llmStatus: { enabled: true, decisionsPerEra: 3, remainingQuota: 2 },
            alerts: [
              { type: 'war', severity: 'high', message: '¡Guerra abierta con la Federación Costera!' },
              { type: 'bankrupt', severity: 'med', message: 'Tesoro bajo. Posible crisis de suministro.' },
            ],
            armies: [
              { id: 'A01', stateId: 'F1', locationCellId: 1024, strength: 8000, supply: 65, stance: 'move', composition: { inf: 5000, cav: 2000, arty: 1000 }, orders: [{ kind: 'move', etaTick: 250, pathLen: 12 }] },
            ],
            settlements: [
              { id: 'S01', name: 'Puerto Imperial', cellId: 205, pop: 15000, marketTier: 3, garrison: 500, ownerStateId: 'F1', tradeLinks: [{ toSettlementId: 'S02', volume: 800 }] },
            ],
          };

          if (q.includes('query TickInfo')) {
            return sendJson({ data: { tickInfo: { tick: 123, season: 'spring' } } });
          }
          if (q.includes('query Factions')) {
            return sendJson({ data: { factions: [mockFaction] } });
          }
          if (q.includes('query Faction')) {
            const id = v?.id || 'F1';
            return sendJson({ data: { faction: { ...mockFaction, id } } });
          }
          if (q.includes('query Cell')) {
            const id = Number(v?.id ?? 1);
            const mockCell = { id, q: 5, r: 8, biome: 3, height: 120, passable: true, movementCost: 2, stateId: 'F1', provinceId: 'P1', cultureId: 'C1' };
            return sendJson({ data: { cell: mockCell } });
          }
          if (q.includes('query Settlement')) {
            const id = v?.id || 'S01';
            const s = { id, name: 'Puerto Imperial', cellId: 205, pop: 15000, marketTier: 3, garrison: 500, ownerStateId: 'F1', tradeLinks: [{ toSettlementId: 'S02', volume: 800 }] };
            return sendJson({ data: { settlement: s } });
          }
          if (q.includes('query Army')) {
            const id = v?.id || 'A01';
            const a = { id, stateId: 'F1', locationCellId: 1024, strength: 8000, supply: 65, stance: 'move', composition: { inf: 5000, cav: 2000, arty: 1000 }, orders: [{ kind: 'move', etaTick: 250, pathLen: 12 }] };
            return sendJson({ data: { army: a } });
          }

          return sendJson({ errors: [{ message: 'Query no soportada por el mock' }] }, 400);
        }

        // REST mocks
        if (url?.startsWith('/api/factions/') && url?.endsWith('/llm') && method === 'POST') {
          return sendJson({ ok: true });
        }
        if (url?.startsWith('/api/factions/') && url?.endsWith('/suggest') && method === 'POST') {
          return sendJson({ ok: true });
        }

        if (url === '/api/world/tick' && method === 'POST') {
          return sendJson({ ok: true, tick: 124 });
        }

        next();
      });
    },
  };
}

const useMock = process.env.VITE_USE_MOCK === 'true';

export default defineConfig({
  plugins: [react(), ...(useMock ? [mockApi()] : [])],
});
