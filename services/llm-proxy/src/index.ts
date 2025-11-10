export type DecisionContext = {
  stateId: string
  tick: number
  situation?: string
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
    // Mock a structured decision; in real impl, call LLM and parse JSON
    if (Math.random() < 0.5) {
      // Recruitment action
      const amount = Math.floor(Math.random() * 50) + 10; // strength units
      return {
        action: 'RecruitUnits',
        target: 'military',
        amount,
        confidence: 0.7 + Math.random() * 0.2,
        rationale: `Reclutar ${amount} de fuerza militar para ${ctx.stateId} en tick ${ctx.tick}.`,
      }
    } else {
      const negative = Math.random() < 0.5
      const amount = (Math.floor(Math.random() * 500) + 250) * (negative ? -1 : 1)
      return {
        action: 'AdjustSpending',
        target: 'military',
        amount,
        confidence: 0.7 + Math.random() * 0.2,
        rationale: `Ajustar gasto ${negative ? 'reduciendo' : 'aumentando'} en ${Math.abs(amount)} para ${ctx.stateId} en tick ${ctx.tick}.`,
      }
    }
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
