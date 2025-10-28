// Lógica para construir el prompt y llamar al LLM (mock por defecto)
import { LLM_PROVIDER, SYSTEM_PROMPT, GAME_RULES } from "./config.js";

function distanceKm(from, to) {
  const pair = `${from}_${to}`;
  const reverse = `${to}_${from}`;
  return GAME_RULES.distancesKm[pair] ?? GAME_RULES.distancesKm[reverse] ?? null;
}

function computeDurationYears(km) {
  const yearsPer100 = GAME_RULES.yearsPer100Km;
  return Math.max(1, Math.ceil((km / 100) * yearsPer100));
}

function computeCostGold(troops, km) {
  const blocksTroops = Math.ceil(troops / 100);
  const blocksKm = Math.ceil(km / 100);
  return blocksTroops * blocksKm * GAME_RULES.costPer100TroopsPer100Km;
}

export function buildMessages(gameState, userText) {
  const context = {
    turn: gameState.turn,
    gold: gameState.gold,
    troops: gameState.troops,
    current_city: gameState.current_city,
    ownership: {
      A: gameState.city_A_owner,
      B: gameState.city_B_owner,
      C: gameState.city_C_owner,
    },
    expedition_status: gameState.expedition_status,
  };

  return {
    system: SYSTEM_PROMPT,
    user: `Estado de juego: ${JSON.stringify(context)}\n\nOrden del jugador: ${userText}`,
  };
}

function mockLLM(gameState, userText) {
  // Heurística simple para "mover X tropas a C" o similar
  const text = userText.toLowerCase();
  const match = text.match(/mover\s+(\d+)\s+tropas.*?a\s+(ciudad\s+)?([abc])/);
  const from = gameState.current_city;
  if (!match) {
    return {
      narrative:
        "Mi Señor, puedo asesorarle sobre expediciones. Indique, por ejemplo: 'Mover 300 tropas a C'.",
      proposal: null,
    };
  }

  const troops = parseInt(match[1], 10);
  const targetCity = match[3].toUpperCase();
  const km = distanceKm(from, targetCity);
  if (!km) {
    return {
      narrative: `Mi Señor, no dispongo de la distancia entre ${from} y ${targetCity}. No puedo proponer esa acción por ahora.`,
      proposal: null,
    };
  }

  const durationYears = computeDurationYears(km);
  const costGold = computeCostGold(troops, km);

  if (troops > gameState.troops) {
    return {
      narrative: "No tiene suficientes tropas, Mi Señor.",
      proposal: null,
    };
  }
  if (costGold > gameState.gold) {
    return {
      narrative: "No disponemos de oro suficiente para esta expedición, Mi Señor.",
      proposal: null,
    };
  }

  const proposal = {
    actionType: "expedition_move",
    targetCity,
    troops,
    durationYears,
    costGold,
  };

  const narrative = `Propongo enviar ${troops} tropas desde ${from} a ${targetCity}. Coste estimado: ${costGold} de oro. Duración: ${durationYears} año(s). ¿Desea proceder?`;
  return { narrative, proposal };
}

async function callOpenAIProxy(messages) {
  // Expecta un endpoint propio que oculte claves y traduzca el formato
  const res = await fetch(LLM_PROVIDER.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: LLM_PROVIDER.model,
      system: messages.system,
      user: messages.user,
    }),
  });
  if (!res.ok) throw new Error(`LLM proxy error: ${res.status}`);
  const data = await res.json();
  // Se espera { narrative: string, proposal?: object } desde el proxy
  return data;
}

export async function sendToLLM(gameState, userText) {
  const messages = buildMessages(gameState, userText);
  if (LLM_PROVIDER.provider === "mock") {
    return mockLLM(gameState, userText);
  }
  if (LLM_PROVIDER.provider === "openai-proxy" && LLM_PROVIDER.apiUrl) {
    return callOpenAIProxy(messages);
  }
  // Fallback seguro
  return {
    narrative:
      "Proveedor LLM no configurado. Usando modo explicativo: describa su orden como 'Mover 200 tropas a B'.",
    proposal: null,
  };
}

// Intenta extraer un bloque JSON de un texto
export function parseLLMResponseText(fullText) {
  const fence = fullText.match(/```json\s*([\s\S]*?)\s*```/i);
  let proposal = null;
  if (fence) {
    try {
      proposal = JSON.parse(fence[1]);
    } catch (e) {
      proposal = null;
    }
  } else {
    // Búsqueda simple de objeto JSON
    const brace = fullText.match(/\{[\s\S]*\}/);
    if (brace) {
      try { proposal = JSON.parse(brace[0]); } catch {}
    }
  }
  const narrative = fence ? fullText.replace(fence[0], "").trim() : fullText.trim();
  return { narrative, proposal };
}
