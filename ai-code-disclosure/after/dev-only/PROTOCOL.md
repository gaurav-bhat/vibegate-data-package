# Corpus data-collection protocol

The vibegate instrument is built and validated on fixtures. This is the
manual, one-time data-collection procedure that turns it into a study. Follow
it in order.

## Grid
5 specs (`study/prompts/`) × 4 tools (v0, lovable, bolt, replit; +claude = 5)
× 3 generations = **60 apps** (75 with claude). Pre-filled in
`study/corpus.template.json`.

## Phase 1 — Specs are frozen
The five prompts in `study/prompts/` are fixed. Paste each VERBATIM; never edit
between runs. Use a fake/throwaway API key in spec 03.

## Phase 2 — Generate (manual, ~2–3 days, needs paid tiers)
For each grid cell, generate the app in the tool and export the code into
`corpus/<id>/` (e.g. `corpus/todo-v0-1/`). For each app:
1. Copy `study/app-meta.template.json` → `corpus/<id>/app-meta.json` and fill
   it in AT GENERATION TIME (tool version, model, date, exact prompt, any
   follow-ups). Tools churn monthly — this metadata is the reproducibility.
2. `npm install` in the app so the lockfile exists (dep-vuln reads it).

## Phase 3 — Smoke specs (fiddly, per app)
Copy the matching `study/smoke-templates/*.vibegate.smoke.json` into each app
dir as `vibegate.smoke.json`; set the real build/start command and a
`browserRoutes` selector+text that only render when the app actually works.
Build the app first (`npm run build`) so the start command serves a real build.
Apps that can't be booted locally: set `"smoke": false` in app-meta (static
checks still run; breakage stays predicted, not measured).

## Phase 4 — Run the gate
```
node study/build-manifest.mjs corpus > corpus.json     # manifest from app-meta.json files
npm run corpus -- corpus.json --out=corpus-runs.jsonl  # gate over all apps, one JSONL
npm run analyze -- corpus-runs.jsonl --per-app
npm run analyze -- corpus-runs.jsonl --per-app --sensitivity
```

## Phase 5 — Make it publishable
- **False-positive labeling.** Hand-label a stratified ~15–20-app subset for
  whether each finding is a true positive (especially endpoint-auth and
  client-secret). Record TP/FP; the FP rate is a first-class result. (Set
  `truePositive` per row during labeling, or keep a side sheet keyed by
  app+check+location.)
- **Live probing (optional, strong).** Deploy each app to its default platform;
  put the preview URL in `app-meta.previewUrl` AND in `.deploy-manifest.json`;
  run `npm run cli -- verify <url>` for post-surface checks (served headers,
  live CORS).

## Phase 6 — Ethics (mandatory; write it up as a section)
- Scan/probe ONLY apps you generated and deployed yourself. Never third-party
  vibe-coded sites.
- Throwaway accounts, dummy data, no real PII. Fake API keys only.
- Tear down every deployment after measurement.
- Platform-level flaw (not a generated-app flaw) → coordinated disclosure to
  the vendor before publishing.

## Data-package release (mirror the branching-strategy package format)
Publish `corpus-runs.jsonl`, `frontier.csv`, the per-app `app-meta.json`
(prompts + versions), a `STATISTICAL_SUMMARY.md`, and a `QUICKSTART.md` that
reproduces the frontier and FP rates. Note tool versions + dates prominently —
results are a point-in-time snapshot.

## Cost & effort
Generation credits ~$100–200 (one month of paid tiers). Phases 2–3 are the
labor (~2–4 days hands-on). Phases 4 onward are minutes.
