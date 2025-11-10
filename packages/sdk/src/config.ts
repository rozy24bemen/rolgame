// SDK Config: endpoints y cabeceras comunes
export interface SDKConfig {
  graphQLEndpoint: string; // e.g., "/api/graphql"
  restBaseUrl: string;     // e.g., "/api"
  getHeaders?: () => Record<string, string>; // Auth tokens, etc.
}

export const createConfig = (partial: Partial<SDKConfig> = {}): SDKConfig => ({
  graphQLEndpoint: "/api/graphql",
  restBaseUrl: "/api",
  getHeaders: () => ({}),
  ...partial,
});
