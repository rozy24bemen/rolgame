# Local Testing Guide

This guide explains how to run the API tests locally against your machine (without Docker) and with Docker.

## Prerequisites
- Node.js 20+
- pnpm/npm (repo uses npm scripts)
- (Optional) A local Postgres or run via Docker Compose

## Option A: Run tests directly (unit/e2e-light)
These tests don’t require a database connection.

```powershell
cd apps\api
npm test
```

Notes:
- The integration tests that require a database are skipped automatically when `DATABASE_URL` is not set.
- We run `prisma generate` before tests to ensure proper typing.

## Option B: Run integration tests with a real Postgres (Docker Compose)
Use the provided Compose override to spin up a Postgres and run the suite end-to-end:

```powershell
docker compose -f docker-compose.yml -f docker-compose.test.yml build
docker compose -f docker-compose.yml -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from api_test
# cleanup
docker compose -f docker-compose.yml -f docker-compose.test.yml down -v
```

This will:
- Start `db_test` (Postgres) and wait until healthy
- Run `apps/api` tests inside the `api_test` container
- Apply Prisma migrations with `prisma migrate deploy`

## Option C: Run integration tests against your own Postgres
Set `DATABASE_URL` and run tests directly:

```powershell
$env:DATABASE_URL = "postgresql://user:pass@localhost:5432/roltest?schema=public"
cd apps\api
npm run prisma:generate
npm run prisma:migrate # for dev; or `npm run prisma:deploy` with migrations committed
npm test
```

Troubleshooting:
- Ensure your Postgres accepts connections from your OS user/network
- Make sure the database exists and the schema is initialized with Prisma (migrate deploy)
- If types appear stale in the editor, run `npm run prisma:generate` in `apps/api`