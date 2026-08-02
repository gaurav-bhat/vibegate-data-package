# Taskly

A personal to-do list web app with email/password authentication. Users sign up, log in, and manage their own private task list — add tasks, mark them done, and delete them.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/todo-app run dev` — run the frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — auto-provisioned by Clerk setup

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, Wouter (routing), Framer Motion
- Auth: Clerk (email/password, cookie-based)
- API: Express 5, pino structured logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (v3), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/tasks.ts` — tasks table schema
- `artifacts/api-server/src/routes/tasks.ts` — tasks CRUD route handlers
- `artifacts/api-server/src/middlewares/requireAuth.ts` — Clerk auth middleware
- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — Clerk proxy (production SSO)
- `artifacts/todo-app/src/` — React frontend (App.tsx, pages, components)

## Architecture decisions

- Each task row stores `user_id` (Clerk user ID) — all queries filter by it, so users only see their own tasks.
- Clerk auth uses cookie-based sessions on web; `requireAuth` middleware reads `getAuth(req)` from `@clerk/express`.
- OpenAPI spec uses `type: number` instead of `type: integer` to avoid `zod.int()` incompatibility with Zod v3.
- Clerk proxy path (`/api/__clerk`) is mounted before body parsers so it can stream raw bytes.

## Product

Users sign up / sign in with email and password. On the `/tasks` page they can:
- Add new tasks by typing and pressing Enter (or a button)
- Check off tasks to mark them done (strikethrough + visual feedback)
- Delete tasks
- See a summary of total / done / pending counts

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/db/src/schema/`, run `pnpm run typecheck:libs` before typechecking artifacts (stale declarations).
- After OpenAPI spec changes, always re-run codegen before using updated types.
- Use `type: number` in the spec for numeric fields (Zod v3 has no `zod.int()`).
- Clerk dev-keys warning in the browser console is expected in development — not an error.
