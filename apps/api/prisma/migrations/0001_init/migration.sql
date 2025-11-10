-- Prisma initial migration for Postgres
-- Create enum for SuggestionStatus
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SuggestionStatus') THEN
    CREATE TYPE "SuggestionStatus" AS ENUM ('pending', 'processed');
  END IF;
END $$;

-- TickState
CREATE TABLE IF NOT EXISTS "TickState" (
  "id" INTEGER PRIMARY KEY,
  "currentTick" INTEGER NOT NULL DEFAULT 0
);

-- State
CREATE TABLE IF NOT EXISTS "State" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "cultureId" TEXT,
  "treasury" DOUBLE PRECISION NOT NULL,
  "stability" DOUBLE PRECISION NOT NULL,
  "territories" INTEGER NOT NULL,
  "militaryStrength" INTEGER NOT NULL,
  "relations" JSONB,
  "objectives" JSONB,
  "alerts" JSONB,
  "llmEnabled" BOOLEAN NOT NULL DEFAULT true,
  "isLlmControlled" BOOLEAN NOT NULL DEFAULT true,
  "decisionsPerEra" INTEGER NOT NULL DEFAULT 3,
  "remainingQuota" INTEGER NOT NULL DEFAULT 2
);

-- Settlement
CREATE TABLE IF NOT EXISTS "Settlement" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "cellId" INTEGER NOT NULL,
  "pop" DOUBLE PRECISION NOT NULL,
  "marketTier" INTEGER NOT NULL,
  "garrison" INTEGER NOT NULL,
  "ownerStateId" TEXT NOT NULL,
  "tradeLinks" JSONB,
  CONSTRAINT "Settlement_state_fkey" FOREIGN KEY ("ownerStateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Army
CREATE TABLE IF NOT EXISTS "Army" (
  "id" TEXT PRIMARY KEY,
  "stateId" TEXT NOT NULL,
  "locationCellId" INTEGER NOT NULL,
  "strength" INTEGER NOT NULL,
  "supply" INTEGER NOT NULL,
  "stance" TEXT NOT NULL,
  "composition" JSONB,
  "orders" JSONB,
  CONSTRAINT "Army_state_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Cell
CREATE TABLE IF NOT EXISTS "Cell" (
  "id" INTEGER PRIMARY KEY,
  "q" INTEGER,
  "r" INTEGER,
  "biome" INTEGER,
  "height" INTEGER,
  "passable" BOOLEAN,
  "movementCost" INTEGER,
  "stateId" TEXT,
  "provinceId" TEXT,
  "cultureId" TEXT
);

-- TickMetric
CREATE TABLE IF NOT EXISTS "TickMetric" (
  "id" TEXT PRIMARY KEY,
  "tick" INTEGER NOT NULL,
  "stateId" TEXT,
  "systemType" TEXT NOT NULL,
  "metricKey" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Suggestion
CREATE TABLE IF NOT EXISTS "Suggestion" (
  "id" TEXT PRIMARY KEY,
  "stateId" TEXT NOT NULL,
  "tick" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "status" "SuggestionStatus" NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "processedAt" TIMESTAMP
);

-- NarrativeEvent
CREATE TABLE IF NOT EXISTS "NarrativeEvent" (
  "id" TEXT PRIMARY KEY,
  "tick" INTEGER NOT NULL,
  "stateId" TEXT,
  "text" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Initialize TickState singleton if not present
INSERT INTO "TickState" ("id", "currentTick")
  VALUES (1, 0)
  ON CONFLICT ("id") DO NOTHING;
