import { createConfig, createQueries, createRest } from "../../../packages/sdk/src";

// Simple SDK bootstrap for the web app
// Allow overriding API base via env; default to same-origin
const API_BASE = (import.meta as any)?.env?.VITE_API_BASE || '';
const cfg = createConfig({
  graphQLEndpoint: `${API_BASE}/graphql`,
  restBaseUrl: `${API_BASE}/api`,
});

export const queries = createQueries(cfg);
export const rest = createRest(cfg);
