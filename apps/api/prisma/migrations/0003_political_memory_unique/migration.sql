-- Add unique constraint to prevent duplicate political memory factors per (source,target,factorKey)
ALTER TABLE "PoliticalMemory"
ADD CONSTRAINT "PoliticalMemory_source_target_factor_unique"
UNIQUE ("sourceStateId", "targetStateId", "factorKey");