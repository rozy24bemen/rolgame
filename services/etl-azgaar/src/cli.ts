#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { runEtl } from './index.js';

// NOTE: We'll import PrismaClient dynamically from the caller's environment if available.
async function getPrisma(): Promise<any | undefined> {
  try {
    // @ts-ignore - optional peer, resolved at runtime if available
    const { PrismaClient } = await import('@prisma/client');
    return new PrismaClient();
  } catch {
    return undefined;
  }
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: etl-azgaar <map.json>');
    process.exit(1);
  }
  const abs = path.resolve(process.cwd(), file);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(abs, 'utf8');
  const json = JSON.parse(raw);

  const prisma = await getPrisma();
  console.log(`[ETL-Azgaar] Loaded ${abs}.`);
  console.log(`[ETL-Azgaar] Preview: keys =>`, Object.keys(json));

  const modeArg = process.argv.find((a) => a.startsWith('--mode='));
  const mode = modeArg ? (modeArg.split('=')[1] as any) : 'replace';
  const batchArg = process.argv.find((a) => a.startsWith('--batch='));
  const batchSize = batchArg ? Number(batchArg.split('=')[1]) : 1000;
  const minBurgPopArg = process.argv.find((a) => a.startsWith('--minBurgPop='));
  const minBurgPop = minBurgPopArg ? Number(minBurgPopArg.split('=')[1]) : 100;

  if (!prisma) {
    console.warn('[ETL-Azgaar] Prisma not available. Dry run only.');
    console.warn('[ETL-Azgaar] Would import with options:', { mode, batchSize, minBurgPop });
    return;
  }

  try {
    await runEtl(prisma, json, { mode, batchSize, minBurgPop });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
