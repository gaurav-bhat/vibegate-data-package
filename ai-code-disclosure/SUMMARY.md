# Summary

- Source transcripts parsed: 2 (`d162a592-7fc2-418d-8864-4fe7888befe3.jsonl`, `14e9eec6-357a-4f69-ad49-17e4375713ca.jsonl`)
- Transcript contributing in-scope changes: 1 (`d162a592-7fc2-418d-8864-4fe7888befe3.jsonl`); the second contains no in-scope tool calls (touches only MANUSCRIPT.md).
- Human prompt turns that led to an in-scope Edit/Write/Read: **26**
- Files reconstructed (before + after): **31**
  - Net-new (did not exist before the session; first touch was a Write): **30**
  - Pre-existing before the session: **0**
  - Read-only in scope / not applicable (e.g. generated binary asset): **1**
- In-scope tool calls replayed: Write=33, Edit=74, Read=12

## Net-new vs. pre-existing

All analyser/script code in scope was **AI-native**: every file's first in-scope touch was a `Write` of a brand-new path. No pre-existing (pre-session) analyser or script code was found in the transcripts. PeerJ's 'before' requirement therefore has no pre-session code state to show for these files -- each `before/<path>` carries a NOTE.txt saying so, per the manuscript's own account of how the tool was built.

The sole exception is `study/figure1-frontier.png`, which was only `Read` (viewed) in-scope, never Written/Edited in-scope; it is a generated chart image produced by running `study/make-figure.mjs`, not hand-authored by the assistant, so before/after code reconstruction does not apply to it.

## Package cross-check

Reconstructed final content was diffed against the corresponding shipped file in this package where a clear path mapping exists (`vibegate/src/*` -> `analyser/src/*`; `vibegate/study/*.mjs` -> `analysis/*.mjs`; `vibegate/study/figure1-frontier.*` -> `figures/*`). 23 files matched byte-for-byte.

Files that did **not** match on first reconstruction: src/checks/client-secret.ts.

`src/checks/client-secret.ts` differed by one import line (`existsSync` missing from a `node:fs` import). Root cause: the assistant applied that fix via a `sed -i` shell command (a **Bash** tool call), not an Edit tool call, in the same turn (turn 70) as its last Edit on the file -- so it fell outside the Edit/Write/Read walk this disclosure tracks. The `after/src/checks/client-secret.ts` copy in this directory uses the shipped on-disk file, which already includes that fix, as the true final state.

Files with no shipped counterpart in this package (dev-only fixtures under `vibegate/fixtures/`, and `study/PROTOCOL.md`, `study/app-meta.template.json`, `study/relabel-r2.csv`, which were not carried into `vibegate-data-package`) rely solely on the transcript-replayed reconstruction for their `after/` content.

## All files

| File | Existed before session | Events (W/E/R) | Turns | Package cross-check |
|---|---|---|---|---|
| `fixtures/corpus.example.json` | no (net-new) | 1/0/0 | 20 | n/a (no shipped counterpart) |
| `fixtures/sample-vercel/index.html` | no (net-new) | 1/0/0 | 9 | n/a (no shipped counterpart) |
| `fixtures/sample-vercel/vercel.json` | no (net-new) | 1/0/0 | 9 | n/a (no shipped counterpart) |
| `src/adapters.ts` | no (net-new) | 1/1/1 | 9, 67 | match |
| `src/analyze.ts` | no (net-new) | 2/0/0 | 18, 19 | match |
| `src/browser-probe.ts` | no (net-new) | 1/0/0 | 13 | match |
| `src/checks/client-secret.ts` | no (net-new) | 1/10/1 | 11, 31, 70 | diff (see above) |
| `src/checks/cors.ts` | no (net-new) | 1/2/0 | 14, 16 | match |
| `src/checks/dep-vuln.ts` | no (net-new) | 1/1/0 | 17, 31 | match |
| `src/checks/endpoint-auth.ts` | no (net-new) | 1/16/4 | 15, 31, 41, 47, 48, 52, 54, 67 | match |
| `src/checks/security-headers.ts` | no (net-new) | 1/4/1 | 9, 31 | match |
| `src/checks/storage-rules.ts` | no (net-new) | 1/4/1 | 16, 55 | match |
| `src/cli.ts` | no (net-new) | 1/14/2 | 9, 11, 12, 14, 15, 20 | match |
| `src/corpus-run.ts` | no (net-new) | 1/1/0 | 20, 67 | match |
| `src/data/advisories.json` | no (net-new) | 1/0/0 | 17 | match |
| `src/harness.ts` | no (net-new) | 2/4/1 | 9, 11, 12, 72 | match |
| `src/registry.ts` | no (net-new) | 2/7/0 | 9, 11, 14, 15, 16, 17 | match |
| `src/scan-ignore.ts` | no (net-new) | 1/0/0 | 31 | match |
| `src/smoke.ts` | no (net-new) | 1/4/0 | 12, 13, 20 | match |
| `src/types.ts` | no (net-new) | 1/3/0 | 9, 11, 12, 72 | match |
| `study/PROTOCOL.md` | no (net-new) | 1/0/0 | 25 | n/a (no shipped counterpart) |
| `study/agreement.mjs` | no (net-new) | 1/0/0 | 74 | match |
| `study/app-meta.template.json` | no (net-new) | 1/0/0 | 25 | n/a (no shipped counterpart) |
| `study/build-manifest.mjs` | no (net-new) | 1/2/0 | 25, 67, 69 | match |
| `study/figure1-frontier.png` | n/a | 0/0/1 | 74 | n/a (no shipped counterpart) |
| `study/label-findings.mjs` | no (net-new) | 1/0/0 | 72 | match |
| `study/make-figure.mjs` | no (net-new) | 1/0/0 | 74 | match |
| `study/normalize-meta.mjs` | no (net-new) | 1/0/0 | 50 | match |
| `study/relabel-r2.csv` | no (net-new) | 1/0/0 | 74 | n/a (no shipped counterpart) |
| `study/sample-for-relabel.mjs` | no (net-new) | 1/0/0 | 74 | match |
| `study/scaffold.mjs` | no (net-new) | 1/1/0 | 28, 50 | match |
