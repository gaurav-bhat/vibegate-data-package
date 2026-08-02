# FlowNote

A landing page for FlowNote — a SaaS note-taking and workflow tool. Includes a hero section, features section, and a live email waitlist form that persists signups to a database.

## Run & Operate

- `pnpm --filter @workspace/flownote run dev` — run the landing page (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (v3), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Landing page: `artifacts/flownote/src/`
- API server: `artifacts/api-server/src/`
- Waitlist route: `artifacts/api-server/src/routes/waitlist.ts`
- DB schema: `lib/db/src/schema/waitlist.ts`
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Generated API hooks: `lib/api-client-react/src/generated/`
- Generated Zod schemas: `lib/api-zod/src/generated/`

## Architecture decisions

- OpenAPI-first: all API contracts defined in `lib/api-spec/openapi.yaml`; never hand-write types the codegen produces
- Zod v3 is pinned in the workspace catalog — avoid `format: email` and `type: integer` in the OpenAPI spec (Orval generates v4 syntax for those); use plain `type: string` and `type: number` instead
- After changing `lib/*` packages, run `pnpm run typecheck:libs` to rebuild declarations before leaf package typechecks

## Product

FlowNote collects early-access emails on a landing page. Visitors see a hero, features section, and a live waitlist form that shows the current signup count for social proof. Emails are stored in the `waitlist` PostgreSQL table.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do not use `format: email` or `type: integer` in `openapi.yaml` — Orval generates Zod v4 syntax (`zod.email()`, `zod.int()`) which fails typecheck against the pinned Zod v3
- After editing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before checking `artifacts/api-server` typecheck — stale lib declarations cause false "missing export" errors

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
