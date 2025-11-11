export type DecisionContext = {
  stateId: string
  tick: number
  situation?: string
  econLow?: boolean
  inWar?: boolean
  recentLosses?: number
  hostileAvg?: number
  weakerThanHostiles?: boolean
  casualtiesRatio?: number
  treasury?: number
}

export type DecisionResult = {
  action: string
  target?: string
  amount?: number
  confidence: number
  rationale: string
}

export type NarrativeEventInput = {
  stateId?: string
  tick: number
  summary: string
}

export class LlmProxy {
  async generateDecision(ctx: DecisionContext): Promise<DecisionResult> {
    // Ceasefire high-priority heuristic: heavy losses & low treasury & currently in war
    if (ctx.inWar && ctx.casualtiesRatio !== undefined && ctx.casualtiesRatio > 0.1 && typeof ctx.treasury === 'number' && ctx.treasury < 300) {
      return {
        action: 'ProposeCeasefire',
        confidence: 0.85,
        rationale: `Pérdidas elevadas (${(ctx.casualtiesRatio*100).toFixed(1)}%) y tesorería baja (${ctx.treasury}). Proponer cese al fuego para ${ctx.stateId}.`,
      }
    }
    // Mock other structured decision; in real impl, call LLM
    if (Math.random() < 0.5) {
      const amount = Math.floor(Math.random() * 50) + 10;
      return { action: 'RecruitUnits', target: 'military', amount, confidence: 0.7 + Math.random() * 0.2, rationale: `Reclutar ${amount} de fuerza militar para ${ctx.stateId} en tick ${ctx.tick}.` }
    }
    const negative = Math.random() < 0.5;
    const amount = (Math.floor(Math.random() * 500) + 250) * (negative ? -1 : 1);
    return { action: 'AdjustSpending', target: 'military', amount, confidence: 0.7 + Math.random() * 0.2, rationale: `Ajustar gasto ${negative ? 'reduciendo' : 'aumentando'} en ${Math.abs(amount)} para ${ctx.stateId} en tick ${ctx.tick}.` }
  }

  async generateNarrative(ev: NarrativeEventInput): Promise<string> {
    // Mock a short narrative
    const who = ev.stateId ? `El estado ${ev.stateId}` : 'Un estado'
    return `${who} tomó una decisión estratégica en el tick ${ev.tick}: ${ev.summary}.`
  }

  async saveSuggestion(prisma: any, stateId: string, tick: number, text: string) {
    if (!prisma) return { ok: false, reason: 'No prisma available' }
    // Ensure enum matches Prisma schema on the API side
    const row = await prisma.suggestion.create({
      data: {
        stateId,
        tick,
        text,
        status: 'pending',
      },
    })
    return { ok: true, id: row.id }
  }
}
