import { SDKConfig } from "./config";

export interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: (string | number)[]; extensions?: any }>;
}

export const createGraphQLClient = (cfg: SDKConfig) => {
  const query = async <T>(document: string, variables?: Record<string, any>): Promise<T> => {
    const res = await fetch(cfg.graphQLEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.getHeaders ? cfg.getHeaders() : {}),
      },
      body: JSON.stringify({ query: document, variables }),
    });
    if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
    const json = (await res.json()) as GraphQLResponse<T>;
    if (json.errors?.length) throw new Error(json.errors.map(e => e.message).join("; "));
    if (!json.data) throw new Error("GraphQL: no data");
    return json.data;
  };
  return { query };
};
