import type { SDKConfig } from "./config";

async function http<T>(cfg: SDKConfig, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${cfg.restBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cfg.getHeaders ? cfg.getHeaders() : {}),
    },
    ...init,
  });
  if (!res.ok) throw new Error(`REST ${path} HTTP ${res.status}`);
  return (await res.json()) as T;
}

export const createRest = (cfg: SDKConfig) => {
  return {
    postWorldTick: (count?: number) => http<{ ok: true; tick: number }>(cfg, "/world/tick", { body: JSON.stringify({ count }) }),
    postFactionLLM: (id: string, body: { enabled: boolean; decisionsPerEra?: number }) =>
      http<{ ok: true }>(cfg, `/factions/${id}/llm`, { body: JSON.stringify(body) }),
    postFactionSuggest: (id: string, text: string) =>
      http<{ ok: true }>(cfg, `/factions/${id}/suggest`, { body: JSON.stringify({ text }) }),
    postTreatyDraft: (aId: string, bId: string, aims: string) =>
      http<{ ok: true; draftId: string }>(cfg, `/factions/${aId}/treaty/draft`, { body: JSON.stringify({ bId, aims }) }),
    postCasusBelli: (aId: string, bId: string, reason: string) =>
      http<{ ok: true }>(cfg, `/relations/${aId}/${bId}/casus_belli`, { body: JSON.stringify({ reason }) }),
    postWorldEvent: (type: string, payload: unknown) =>
      http<{ ok: true; eventId: string }>(cfg, "/world/event", { body: JSON.stringify({ type, payload }) }),
    postSnapshotFaction: (id: string) => http<{ ok: true; snapshotId: string }>(cfg, "/snapshots/faction", { body: JSON.stringify({ id }) }),
    postSnapshotWorld: (label?: string) => http<{ ok: true; snapshotId: string }>(cfg, "/snapshots/world", { body: JSON.stringify({ label }) }),
  };
};
