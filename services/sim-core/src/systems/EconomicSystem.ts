type Prisma = any;

export interface EconomicConfig {
  incomePopDivisor: number; // income from total pop = pop / divisor
  incomePerMarketTier: number; // + per settlement market tier
  armyUpkeepPerStrength: number; // upkeep per strength point
  bureaucracyBase: number; // base bureaucracy cost per state
  bureaucracyPerTerritory: number; // add per territory
}

export const defaultEconomicConfig: EconomicConfig = {
  incomePopDivisor: 100,
  incomePerMarketTier: 5,
  armyUpkeepPerStrength: 0.02,
  bureaucracyBase: 50,
  bureaucracyPerTerritory: 1,
};

export async function runEconomicSystem(prisma: Prisma, tick: number, cfg: EconomicConfig = defaultEconomicConfig) {
  if (!prisma) return; // no-op without DB

  // Fetch minimal aggregates: states with settlements and armies
  const states = await prisma.state.findMany({
    include: {
      settlements: { select: { pop: true, marketTier: true } },
      armies: { select: { strength: true } },
    },
  });

  for (const s of states) {
    const totalPop = s.settlements.reduce((acc: number, t: any) => acc + (t.pop || 0), 0);
    const sumMarketTier = s.settlements.reduce((acc: number, t: any) => acc + (t.marketTier || 0), 0);
    const totalArmyStrength = s.armies.reduce((acc: number, a: any) => acc + (a.strength || 0), 0);

    const income = totalPop / cfg.incomePopDivisor + sumMarketTier * cfg.incomePerMarketTier;
    const armyUpkeep = totalArmyStrength * cfg.armyUpkeepPerStrength;
    const bureaucracy = cfg.bureaucracyBase + (s.territories || 0) * cfg.bureaucracyPerTerritory;

    const delta = income - (armyUpkeep + bureaucracy);
    const nextTreasury = (s.treasury || 0) + delta;

    await prisma.state.update({ where: { id: s.id }, data: { treasury: nextTreasury } });
    await prisma.tickMetric.create({
      data: { tick, stateId: s.id, systemType: 'economic', metricKey: 'treasury_change', value: delta },
    });
  }
}
