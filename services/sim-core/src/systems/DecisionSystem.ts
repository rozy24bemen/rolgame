export interface DecisionConfig {
  recruitCostPerStrength?: number;
}

export const defaultDecisionConfig: Required<DecisionConfig> = {
  recruitCostPerStrength: 50, // real recruitment cost model
};

export async function runDecisionSystem(prisma: any, llm: any, tick: number, config: DecisionConfig = {}) {
  if (!prisma || !llm || typeof llm.generateDecision !== 'function') return;
  const cfg = { ...defaultDecisionConfig, ...config };

  try {
    const llmStates: Array<{ id: string }> = await prisma.state.findMany({
      where: { OR: [{ isLlmControlled: true }, { llmEnabled: true }] as any },
      select: { id: true },
    });

    for (const st of llmStates) {
      const decision = await llm.generateDecision({ stateId: st.id, tick });

      if (decision.action === 'AdjustSpending' && typeof decision.amount === 'number') {
        const s = await prisma.state.findUnique({ where: { id: st.id }, select: { treasury: true } });
        if (s) {
          const newTre = Number(s.treasury || 0) + decision.amount;
          await prisma.state.update({ where: { id: st.id }, data: { treasury: newTre } });
          await prisma.tickMetric.create({
            data: { tick, stateId: st.id, systemType: 'decision', metricKey: 'ai_decision_treasury_delta', value: decision.amount },
          });
        }
      }

      if (decision.action === 'RecruitUnits' && typeof decision.amount === 'number') {
        const strengthToRecruit = Math.max(0, Math.floor(decision.amount));
        if (strengthToRecruit > 0) {
          const s = await prisma.state.findUnique({ where: { id: st.id }, select: { treasury: true, militaryStrength: true } });
          if (s) {
            const cost = -strengthToRecruit * cfg.recruitCostPerStrength;
            const newTre = Number(s.treasury || 0) + cost;
            const newMil = Number(s.militaryStrength || 0) + strengthToRecruit;
            await prisma.state.update({ where: { id: st.id }, data: { treasury: newTre, militaryStrength: newMil } });
            await prisma.tickMetric.create({ data: { tick, stateId: st.id, systemType: 'decision', metricKey: 'ai_decision_treasury_delta', value: cost } });
            await prisma.tickMetric.create({ data: { tick, stateId: st.id, systemType: 'decision', metricKey: 'ai_decision_military_delta', value: strengthToRecruit } });
          }
        }
      }

      const text = `IA (${st.id}) decidió: ${decision.action}${decision.target ? ' sobre ' + decision.target : ''}${typeof decision.amount === 'number' ? ' (' + (decision.amount >= 0 ? '+' : '') + decision.amount + ')' : ''} · confianza ${(decision.confidence * 100).toFixed(0)}%. ${decision.rationale}`;
      await prisma.narrativeEvent.create({ data: { tick, stateId: st.id, text } });
    }
  } catch {}
}
