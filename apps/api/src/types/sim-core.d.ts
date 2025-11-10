declare module 'sim-core' {
  export class SimCore {
    constructor(prisma?: any);
    getCurrentTick(): Promise<number>;
    runTick(count: number): Promise<number>;
  }
}
declare module '../../../services/sim-core/dist/index.js' {
  export class SimCore {
    constructor(prisma?: any);
    getCurrentTick(): Promise<number>;
    runTick(count: number): Promise<number>;
  }
}
