import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.tickState.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, currentTick: 0 },
  });

  // Seed cells (10 sample cells)
  await prisma.cell.createMany({
    data: Array.from({ length: 10 }).map((_, i) => ({
      id: 200 + i,
      q: i,
      r: i % 5,
      biome: (i % 4) + 1,
      height: 50 + i,
      passable: i % 7 !== 0,
      movementCost: 1 + (i % 3),
      cultureId: i % 2 === 0 ? 'C1' : 'C2',
    })),
    skipDuplicates: true,
  });

  // Seed 3-4 states with settlements and armies
  const states = [
    {
      id: 'F1',
      name: 'Imperio de Azgaar',
      cultureId: 'C1',
      treasury: 53000,
      stability: 78.5,
      territories: 120,
      militaryStrength: 45000,
      relations: [{ stateId: 'F2', attitude: -45, tradeVolume: 1200 }, { stateId: 'F3', attitude: 85, tradeVolume: 5000 }] as any,
      objectives: [
        { id: 'o1', title: 'Asegurar el Paso del Dragón', status: 'active' },
        { id: 'o3', title: 'Reforma Agraria y Tributaria', status: 'done' },
      ] as any,
      alerts: [{ type: 'war', severity: 'high', message: '¡Guerra abierta!' }] as any,
      settlements: [{ id: 'S01', name: 'Puerto Imperial', cellId: 205, pop: 15000, marketTier: 3, garrison: 500, tradeLinks: [{ toSettlementId: 'S02', volume: 800 }] as any }],
      armies: [{ id: 'A01', locationCellId: 205, strength: 8000, supply: 65, stance: 'move', composition: { inf: 5000, cav: 2000, arty: 1000 } as any, orders: [{ kind: 'move', etaTick: 250, pathLen: 12 }] as any }],
    },
    {
      id: 'F2',
      name: 'Liga del Norte',
      cultureId: 'C2',
      treasury: 31000,
      stability: 66.2,
      territories: 80,
      militaryStrength: 28000,
      relations: [{ stateId: 'F1', attitude: -30, tradeVolume: 900 }] as any,
      objectives: [{ id: 'o4', title: 'Consolidar rutas comerciales', status: 'active' }] as any,
      alerts: [{ type: 'economy', severity: 'medium', message: 'Déficit temporal en aduanas' }] as any,
      settlements: [{ id: 'S02', name: 'Puerto del Norte', cellId: 206, pop: 9000, marketTier: 2, garrison: 300, tradeLinks: [{ toSettlementId: 'S01', volume: 820 }] as any }],
      armies: [{ id: 'A02', locationCellId: 206, strength: 5000, supply: 55, stance: 'hold', composition: { inf: 3500, cav: 1200, arty: 300 } as any }] as any,
    },
    {
      id: 'F3',
      name: 'Sultanato de Arenas',
      cultureId: 'C3',
      treasury: 42000,
      stability: 71.1,
      territories: 95,
      militaryStrength: 32000,
      relations: [{ stateId: 'F1', attitude: 70, tradeVolume: 5200 }] as any,
      objectives: [{ id: 'o5', title: 'Expandir caravasares', status: 'planned' }] as any,
      alerts: [],
      settlements: [{ id: 'S03', name: 'Oasis Real', cellId: 207, pop: 12000, marketTier: 3, garrison: 450, tradeLinks: [] as any }],
      armies: [{ id: 'A03', locationCellId: 207, strength: 6500, supply: 60, stance: 'move', composition: { inf: 4300, cav: 1800, arty: 400 } as any }] as any,
    },
    {
      id: 'F4',
      name: 'Confederación del Este',
      cultureId: 'C4',
      treasury: 22000,
      stability: 60.0,
      territories: 60,
      militaryStrength: 18000,
      relations: [{ stateId: 'F1', attitude: 10, tradeVolume: 400 }] as any,
      objectives: [{ id: 'o6', title: 'Reformar el consejo', status: 'active' }] as any,
      alerts: [{ type: 'politics', severity: 'low', message: 'Disputas internas' }] as any,
      settlements: [{ id: 'S04', name: 'Castillo del Este', cellId: 208, pop: 7000, marketTier: 2, garrison: 250, tradeLinks: [] as any }],
      armies: [{ id: 'A04', locationCellId: 208, strength: 4200, supply: 52, stance: 'hold', composition: { inf: 3000, cav: 900, arty: 300 } as any }] as any,
    },
  ];

  for (const st of states) {
    await prisma.state.upsert({
      where: { id: st.id },
      update: {},
      create: {
        id: st.id,
        name: st.name,
        cultureId: st.cultureId || undefined,
        treasury: st.treasury,
        stability: st.stability,
        territories: st.territories,
        militaryStrength: st.militaryStrength,
        relations: st.relations as any,
        objectives: st.objectives as any,
        alerts: st.alerts as any,
        settlements: { create: st.settlements as any },
        armies: { create: st.armies as any },
      },
    });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
