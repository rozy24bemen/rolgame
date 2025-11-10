type Prisma = any;

export async function runPoliticalSystem(prisma: Prisma, tick: number) {
  if (!prisma) return; // no-op without DB
  const states = await prisma.state.findMany({ select: { id: true, relations: true } });
  let globalGapSum = 0;
  let globalRelationCount = 0;
  for (const s of states) {
    const rels = (s.relations as any[]) || [];
    if (rels.length === 0) continue;
    // Load political memory modifiers for this source state
    const memories = await prisma.politicalMemory.findMany({
      where: {
        sourceStateId: s.id,
        OR: [
          { expiresAtTick: null },
          { expiresAtTick: { gt: tick } },
        ],
      },
      select: { targetStateId: true, modifierValue: true },
    });
    const memoryMap = new Map<string, number>();
    for (const m of memories) memoryMap.set(m.targetStateId, (memoryMap.get(m.targetStateId) || 0) + m.modifierValue);

    let totalDriftAbs = 0;
    let totalGap = 0;
    const next = rels.map(r => {
      const attitude = typeof r.attitude === 'number' ? r.attitude : 0;
      // Base drift toward neutral
      let moved = attitude;
      if (attitude > 0) moved = attitude - 1;
      else if (attitude < 0) moved = attitude + 1;
      // Apply persistent memory modifier
      const memBonus = memoryMap.get(r.stateId || r.id) || 0; // assuming relation entry has stateId or id
      // Converge towards memory sum by adjusting the baseline around it
      // i.e., after neutral drift, move result closer to memBonus target
      if (moved < memBonus) moved = Math.min(memBonus, moved + 1);
      else if (moved > memBonus) moved = Math.max(memBonus, moved - 1);
      const gap = Math.abs((moved) - memBonus);
      totalGap += gap;
      globalGapSum += gap;
      globalRelationCount += 1;
      totalDriftAbs += Math.abs(moved - attitude);
      return { ...r, attitude: moved };
    });
    await prisma.state.update({ where: { id: s.id }, data: { relations: next as any } });
    if (totalDriftAbs !== 0) {
      await prisma.tickMetric.create({
        data: { tick, stateId: s.id, systemType: 'political', metricKey: 'attitude_drift_abs', value: totalDriftAbs },
      });
    }
    // Record equilibrium gap (sum across relations)
    await prisma.tickMetric.create({
      data: { tick, stateId: s.id, systemType: 'political', metricKey: 'political_equilibrium_gap', value: totalGap },
    });
  }
  // Global convergence health: average gap per relation across all states
  if (globalRelationCount > 0) {
    const avgGap = globalGapSum / globalRelationCount;
    await prisma.tickMetric.create({
      data: { tick, stateId: null, systemType: 'political', metricKey: 'global_political_health', value: avgGap },
    });
  }
}
