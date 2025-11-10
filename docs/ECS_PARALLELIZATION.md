# ECS Parallelization Notes

This note outlines a strategy to parallelize systems in SimCore while preserving correctness.

## Goals
- Reduce tick latency by running independent systems concurrently
- Maintain determinism or bounded nondeterminism with clear ordering barriers

## Proposed model
- Per tick, define phases. Systems inside a phase can run in parallel; phases have strict ordering.

Example phases:
1. Political (relations drift, diplomacy) — Phase A (sequential per-entity or batched with locks)
2. Economic (income/upkeep/bureaucracy) — Phase B (parallel per-state)
3. EventSystem (suggestions processing, narratives) — Phase C (sequential writes) 
4. DecisionSystem (AI actions) — Phase D (parallel decision generation, serialized application)

## Concurrency guidelines
- Parallel-safe: EconomicSystem budget math per-state. Use `UPDATE ... WHERE id = ?` with single-row updates; avoid cross-state aggregates.
- Requires ordering/serialization: 
  - PoliticalSystem if it mutates cross-state relations symmetrically.
  - Applying AI decisions that change shared resources/entities.
- Use the DB as the synchronization surface: transactions per-state updates; avoid long-running transactions.

## Implementation sketch
- Worker pool (Node.js worker_threads or a simple promise pool) to run per-state jobs for EconomicSystem and Decision generation.
- Collect deltas, then apply in a single commit-phase for visibility consistency (optional): write TickMetric, then persist state.
- Cap concurrency (e.g., `Math.min(os.cpus().length, N)`) to match DB capacity.

## Determinism
- If determinism is required, keep a stable ordering (by stateId) when applying effects, even if deltas are computed in parallel.
- Seed all PRNG uses.

## Observability and backpressure
- Write metrics after each phase with the same tick for safe aggregation.
- If DB backpressure arises, lower concurrency or batch updates.
