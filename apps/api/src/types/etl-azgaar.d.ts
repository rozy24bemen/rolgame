declare module 'etl-azgaar' {
  export type EtlMode = 'replace' | 'upsert';
  export interface EtlOptions { mode?: EtlMode; batchSize?: number; minBurgPop?: number }
  export function runEtl(prisma: any, json: any, options?: EtlOptions): Promise<void>;
}
