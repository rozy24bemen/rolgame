// Tipos TypeScript compartidos para Panel de Facciones e Inspector

export type ObjectiveStatus = 'planned' | 'active' | 'blocked' | 'done';

export interface ObjectiveNode {
  id: string;
  title: string;
  status: ObjectiveStatus;
  children?: ObjectiveNode[];
}

export interface Relation {
  stateId: string;
  attitude: number; // -100..+100
  tradeVolume?: number;
}

export interface LLMStatus {
  enabled: boolean;
  decisionsPerEra: number;
  remainingQuota: number;
}

export interface Alert {
  type: 'war' | 'unrest' | 'bankrupt' | 'famine';
  severity: 'low' | 'med' | 'high';
  message: string;
}

export interface FactionSummary {
  id: string;
  name: string;
  cultureId?: string;
  treasury: number;
  stability: number;
  territories: number;
  militaryStrength: number;
  relations: Relation[];
  objectives: ObjectiveNode[];
  llmStatus: LLMStatus;
  alerts?: Alert[];
}

export interface Composition { inf: number; cav: number; arty: number }

export interface Order {
  kind: 'move' | 'garrison' | 'siege' | string;
  etaTick?: number;
  pathLen?: number;
}

export interface Army {
  id: string;
  stateId: string;
  locationCellId: number;
  strength: number;
  supply: number;
  stance: 'idle' | 'move' | 'siege' | string;
  composition: Composition;
  orders?: Order[];
}

export interface SettlementTradeLink { toSettlementId: string; volume: number }

export interface Settlement {
  id: string;
  name: string;
  cellId: number;
  pop: number;
  marketTier: number;
  garrison: number;
  ownerStateId: string;
  tradeLinks: SettlementTradeLink[];
}

export interface Cell {
  id: number;
  q?: number; r?: number;
  biome?: number; height?: number;
  passable?: boolean; movementCost?: number;
  stateId?: string; provinceId?: string; cultureId?: string;
}

export interface TickInfo { tick: number; season?: string }

export interface WorldUpdate {
  type: 'army-move' | 'battle' | 'demographic' | 'event' | string;
  ids: string[];
  bbox?: Record<string, unknown>;
  tick: number;
}
