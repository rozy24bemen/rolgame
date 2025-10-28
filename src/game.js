// Lógica de estado del juego, validación y avance de turnos
import { GAME_RULES, DEFAULT_GAME_STATE } from "./config.js";

function distanceKm(from, to) {
  const pair = `${from}_${to}`;
  const reverse = `${to}_${from}`;
  return GAME_RULES.distancesKm[pair] ?? GAME_RULES.distancesKm[reverse] ?? null;
}

export function getDefaultState() {
  return { ...DEFAULT_GAME_STATE };
}

export function validateProposal(state, proposal) {
  if (!proposal || proposal.actionType !== "expedition_move") return { ok: false, reason: "Acción no válida" };
  const { targetCity, troops, costGold, durationYears } = proposal;
  if (!GAME_RULES.validCities.includes(targetCity)) return { ok: false, reason: "Ciudad no válida" };
  if (troops <= 0 || !Number.isFinite(troops)) return { ok: false, reason: "Número de tropas inválido" };
  if (costGold < 0) return { ok: false, reason: "Coste inválido" };
  if (durationYears <= 0) return { ok: false, reason: "Duración inválida" };
  if (troops > state.troops) return { ok: false, reason: "Tropas insuficientes" };
  if (costGold > state.gold) return { ok: false, reason: "Oro insuficiente" };
  const km = distanceKm(state.current_city, targetCity);
  if (!km) return { ok: false, reason: "Distancia no definida" };
  return { ok: true };
}

export function applyProposal(state, proposal) {
  // Bloquea oro y tropas (se restan de inmediato)
  const newState = { ...state };
  newState.gold -= proposal.costGold;
  newState.troops -= proposal.troops;
  newState.expedition_status = {
    end_turn: newState.turn + proposal.durationYears,
    action: proposal.actionType,
    targetCity: proposal.targetCity,
    troops: proposal.troops,
  };
  return newState;
}

export function completeExpeditionIfDue(state) {
  const st = { ...state };
  const exp = st.expedition_status;
  if (!exp) return st;
  if (exp.end_turn !== st.turn) return st;

  // Al completar, se conquista la ciudad objetivo y regresan las tropas (MVP)
  if (exp.targetCity === "B") st.city_B_owner = "player";
  if (exp.targetCity === "C") st.city_C_owner = "player";
  st.current_city = exp.targetCity;
  st.troops += exp.troops; // las tropas quedan disponibles al finalizar
  st.expedition_status = null;
  return st;
}

export function randomEvent(st) {
  const state = { ...st };
  // Evento simple (50/50) — se puede ajustar luego
  const r = Math.random();
  if (r < 0.5) {
    state.gold += 100;
    state._last_event = "+100 oro (tributo inesperado)";
  } else {
    state.troops = Math.max(0, state.troops - 50);
    state._last_event = "-50 tropas (deserciones)";
  }
  return state;
}

export function advanceTurn(state) {
  let next = { ...state, turn: state.turn + 1 };
  next = completeExpeditionIfDue(next);
  next = randomEvent(next);
  return next;
}
