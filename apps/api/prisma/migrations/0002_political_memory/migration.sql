-- Create PoliticalMemory table
CREATE TABLE IF NOT EXISTS "PoliticalMemory" (
  "id" TEXT PRIMARY KEY,
  "sourceStateId" TEXT NOT NULL,
  "targetStateId" TEXT NOT NULL,
  "factorKey" TEXT NOT NULL,
  "modifierValue" DOUBLE PRECISION NOT NULL,
  "isStatic" BOOLEAN NOT NULL DEFAULT FALSE,
  "expiresAtTick" INTEGER,
  "eventDetails" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "PoliticalMemory_source_target_idx" ON "PoliticalMemory" ("sourceStateId", "targetStateId");
CREATE INDEX IF NOT EXISTS "PoliticalMemory_target_source_idx" ON "PoliticalMemory" ("targetStateId", "sourceStateId");
CREATE INDEX IF NOT EXISTS "PoliticalMemory_factorKey_idx" ON "PoliticalMemory" ("factorKey");
CREATE INDEX IF NOT EXISTS "PoliticalMemory_expires_idx" ON "PoliticalMemory" ("expiresAtTick");
