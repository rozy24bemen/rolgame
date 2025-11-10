export type EtlMode = 'replace' | 'upsert';

export interface EtlOptions {
  mode?: EtlMode; // default 'replace' for dev
  batchSize?: number; // default 1000
  minBurgPop?: number; // default 100
}

type Prisma = any;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function tierFromPop(pop: number): number {
  if (pop >= 20000) return 4;
  if (pop >= 10000) return 3;
  if (pop >= 5000) return 2;
  return 1;
}

export async function runEtl(prisma: Prisma, json: any, options: EtlOptions = {}) {
  const mode: EtlMode = options.mode ?? 'replace';
  const batchSize = options.batchSize ?? 1000;
  const minBurgPop = options.minBurgPop ?? 100;

  if (!prisma) throw new Error('Prisma client is required to run ETL');

  // Normalize Azgaar structures
  const cells: any[] = Array.isArray(json.cells) ? json.cells : [];
  const statesSrc: any[] = Array.isArray(json.states)
    ? json.states
    : Array.isArray(json.countries)
    ? json.countries
    : [];
  const burgs: any[] = Array.isArray(json.burgs) ? json.burgs : [];

  console.log(`[ETL] Parsed: cells=${cells.length}, states=${statesSrc.length}, burgs=${burgs.length}`);

  // Replace mode: wipe tables before inserting
  if (mode === 'replace') {
    console.log('[ETL] Replacing data: truncating tables Cell, Settlement, Army, State');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Settlement", "Army", "State", "Cell" RESTART IDENTITY CASCADE');
  }

  // Map states and create id map
  const stateIdMap = new Map<number | string, string>();
  for (const s of statesSrc) {
    const key = s.i ?? s.id ?? s.index;
    const id = `F${String(key)}`;
    stateIdMap.set(key, id);
    await prisma.state.upsert({
      where: { id },
      update: {
        name: String(s.name ?? `State ${key}`),
      },
      create: {
        id,
        name: String(s.name ?? `State ${key}`),
        treasury: 0,
        stability: 50,
        territories: 0,
        militaryStrength: 0,
      },
    });
  }

  // Cells
  const cellRows = cells.map((c, idx) => {
    const id = c.i ?? c.id ?? idx;
    const stKey = c.state ?? c.stateId;
    const cultureKey = c.culture ?? c.cultureId;
    const provKey = c.province ?? c.provinceId;
    return {
      id: Number(id),
      q: c.q ?? null,
      r: c.r ?? null,
      biome: c.biome ?? null,
      height: c.height ?? c.h ?? null,
      passable: c.passable ?? true,
      movementCost: c.movementCost ?? null,
      stateId: stKey != null ? stateIdMap.get(stKey) ?? null : null,
      provinceId: provKey != null ? `P${String(provKey)}` : null,
      cultureId: cultureKey != null ? `C${String(cultureKey)}` : null,
    };
  });

  console.log(`[ETL] Inserting ${cellRows.length} cells in batches of ${batchSize}...`);
  for (const group of chunk(cellRows, batchSize)) {
    await prisma.cell.createMany({ data: group, skipDuplicates: true });
  }

  // Burgs to settlements
  const settlements = burgs
    .filter((b) => (b.population ?? b.pop ?? 0) >= minBurgPop)
    .map((b) => {
      const key = b.i ?? b.id;
      const pop = Number(b.population ?? b.pop ?? 0);
      const cellId = Number(b.cell ?? b.cellId ?? -1);
      const stKey = b.state ?? b.stateId;
      return {
        id: `S${String(key)}`,
        name: String(b.name ?? `Burg ${key}`),
        cellId,
        pop,
        marketTier: tierFromPop(pop),
        garrison: Math.round(pop / 50),
        ownerStateId: stKey != null ? stateIdMap.get(stKey) ?? undefined : undefined,
        tradeLinks: [],
      };
    });

  console.log(`[ETL] Inserting ${settlements.length} settlements in batches of ${Math.min(batchSize, 500)}...`);
  for (const group of chunk(settlements, Math.min(batchSize, 500))) {
    await prisma.settlement.createMany({ data: group as any, skipDuplicates: true });
  }

  // Compute territories and strength per state
  const stateAgg = new Map<string, { territories: number; strength: number }>();
  for (const row of cellRows) {
    const sid = row.stateId;
    if (!sid) continue;
    const agg = stateAgg.get(sid) ?? { territories: 0, strength: 0 };
    agg.territories += 1;
    stateAgg.set(sid, agg);
  }
  for (const st of settlements) {
    const sid = st.ownerStateId;
    if (!sid) continue;
    const agg = stateAgg.get(sid) ?? { territories: 0, strength: 0 };
    agg.strength += Math.round(st.pop / 10);
    stateAgg.set(sid, agg);
  }
  for (const [sid, agg] of stateAgg) {
    await prisma.state.update({ where: { id: sid }, data: { territories: agg.territories, militaryStrength: agg.strength } });
  }

  // --- Static Political Memory Factors ---
  // SHARED_CULTURE: states that share any cultureId among their cells
  // SHARED_BORDER: states whose cells are adjacent (axial neighbors)
  const cultureStates = new Map<string, Set<string>>(); // cultureId -> set of stateIds
  for (const c of cellRows) {
    if (c.cultureId && c.stateId) {
      const set = cultureStates.get(c.cultureId) ?? new Set<string>();
      set.add(c.stateId);
      cultureStates.set(c.cultureId, set);
    }
  }
  const memoryInserts: Array<{ sourceStateId: string; targetStateId: string; factorKey: string; modifierValue: number; isStatic: boolean }>= [];
  // Shared culture (+10)
  for (const [, stSet] of cultureStates) {
    const arr = Array.from(stSet);
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        memoryInserts.push({ sourceStateId: a, targetStateId: b, factorKey: 'SHARED_CULTURE', modifierValue: 10, isStatic: true });
        memoryInserts.push({ sourceStateId: b, targetStateId: a, factorKey: 'SHARED_CULTURE', modifierValue: 10, isStatic: true });
      }
    }
  }

  // Shared border (+5)
  const neighborOffsets = [
    [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1],
  ];
  const cellByQR = new Map<string, any>();
  for (const c of cellRows) {
    if (c.stateId && c.q != null && c.r != null) {
      cellByQR.set(`${c.q},${c.r}`, c);
    }
  }
  const borderPairs = new Set<string>();
  for (const c of cellRows) {
    if (!c.stateId || c.q == null || c.r == null) continue;
    for (const [dq, dr] of neighborOffsets) {
      const key = `${c.q + dq},${c.r + dr}`;
      const n = cellByQR.get(key);
      if (n && n.stateId && n.stateId !== c.stateId) {
        const a = c.stateId; const b = n.stateId;
        const pairKey = a < b ? `${a}|${b}` : `${b}|${a}`;
        if (!borderPairs.has(pairKey)) {
          borderPairs.add(pairKey);
          memoryInserts.push({ sourceStateId: a, targetStateId: b, factorKey: 'SHARED_BORDER', modifierValue: 5, isStatic: true });
          memoryInserts.push({ sourceStateId: b, targetStateId: a, factorKey: 'SHARED_BORDER', modifierValue: 5, isStatic: true });
        }
      }
    }
  }

  if (memoryInserts.length) {
    console.log(`[ETL] Inserting ${memoryInserts.length} PoliticalMemory factors (static)`);
    // Upsert-like behavior: skip duplicates by (source,target,factorKey)
    for (const batch of chunk(memoryInserts, 500)) {
      for (const m of batch) {
        const existing = await prisma.politicalMemory.findFirst({
          where: { sourceStateId: m.sourceStateId, targetStateId: m.targetStateId, factorKey: m.factorKey },
        });
        if (!existing) {
          await prisma.politicalMemory.create({ data: m });
        }
      }
    }
  }

  console.log('[ETL] Done');
}