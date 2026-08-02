# AI Chatbot

A personal AI chatbot where users can start multiple named conversations and chat with GPT-4o mini. Each conversation preserves full message history for context.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/chatbot run dev` — run the chatbot frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required secret: `OPENAI_API_KEY` — OpenAI API key (add via Secrets panel)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS + wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI SDK (gpt-4o-mini)
- Validation: Zod (v3), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/conversations.ts` — DB schema: conversations + messages tables
- `artifacts/api-server/src/routes/conversations.ts` — all chat API routes + OpenAI call
- `artifacts/chatbot/src/` — React frontend (pages: `/` conversation list, `/conversations/:id` chat view)

## Architecture decisions

- OpenAI client is initialized lazily per-request (not at module load), so the server starts even when `OPENAI_API_KEY` is missing — the error surfaces only when a message is sent.
- Full conversation history is fetched and sent to OpenAI on every message for context continuity.
- Integer fields in OpenAPI spec use `type: number` (not `type: integer`) to avoid Orval generating `zod.int()` which doesn't exist in Zod v3.
- Messages cascade-delete when their conversation is deleted (`onDelete: "cascade"` in schema).

## Product

- Conversation list at `/` — create, browse, and delete conversations
- Chat view at `/conversations/:id` — full message thread, send messages, get AI replies
- Warm amber/ochre design — intimate personal tool aesthetic

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/*` packages, run `pnpm run typecheck:libs` before checking artifact packages so leaf typechecks see fresh workspace declarations.
- OpenAPI body schemas must use entity-shaped names (e.g. `MessageInput`) not operation-shaped names (e.g. `SendMessageBody`) to avoid Orval TS2308 collision errors.
- Do not use `type: integer` in OpenAPI spec — use `type: number` instead (Zod v3 compat).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
