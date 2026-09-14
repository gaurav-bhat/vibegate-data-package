# AI Code Use Disclosure

This directory documents the AI-assisted development of the `vibegate` static
analyser (`analyser/src/`) and the corpus-analysis scripts (`analysis/*.mjs`,
shipped from the development tree's `vibegate/study/*.mjs`), as disclosed in
MANUSCRIPT.md Section 2.7. It was assembled to satisfy PeerJ's requirement,
for AI-tool-edited code, of (1) a before copy, (2) an after copy, and (3) the
prompts used.

## Provenance

The packaged repository (`vibegate-data-package`) contains only 4 squashed
packaging commits and has no meaningful git history for the analyser/scripts
development itself; the original development directory
(`/Users/gauravbhatnagar/git/gitTelemetry/vibegate`) was never a git
repository. The material in this directory is therefore reconstructed
programmatically from the full Claude Code session transcript(s) that
performed the development, rather than from version control.

Source transcripts (Claude Code session logs, JSONL, one JSON object per
line):

- `d162a592-7fc2-418d-8864-4fe7888befe3.jsonl` (~14 MB, 2241 lines) -- the primary session. Contains
  every Edit/Write/Read tool call that touched `vibegate/src`,
  `vibegate/study`, and `vibegate/fixtures`.
- `14e9eec6-357a-4f69-ad49-17e4375713ca.jsonl` (~2 MB, 571 lines) -- checked and found to touch only
  `MANUSCRIPT.md` (2 Edit calls, both prose changes to the manuscript text
  itself). It contains no Edit/Write/Read calls against
  `vibegate/src`, `vibegate/study`, or `vibegate/fixtures`, so it
  contributes nothing to this disclosure and is not otherwise represented
  here.

Both files live under
`~/.claude/projects/-Users-gauravbhatnagar-git-gitTelemetry/` and were parsed
with a small Python script (not included here) that walks each line in
order, in a single streaming pass, skipping any line that fails to parse as
JSON.

## Date range

Tool calls that touched in-scope files span **2026-07-26T04:30:02Z to
2026-08-02T20:32:53Z** (timestamps taken directly from the transcript, UTC).
Human prompt turns that led to those tool calls span
**2026-07-26T04:26:45Z to 2026-08-02T20:29:24Z**.

## How this was derived

1. Both transcripts were parsed line by line. Each line is a JSON object
   with a `type` field (`user` or `assistant`, among others).
   - `user`-type lines were scanned for plain `text` content blocks (the
     human's typed prompts). `tool_result` blocks were extracted
     separately (used only to recover pre-existing file content via `Read`
     results, never treated as a prompt). One further exclusion was
     needed beyond the brief: Claude Code injects a Skill's full
     instruction text into a `user`-role turn when a Skill tool is
     invoked (mid-session, not human-typed); one such turn (a `dataviz`
     skill load, timestamp 2026-07-26T06:26:06Z) was detected by its
     literal `Base directory for this skill:` header and excluded from the
     prompt list and from turn boundaries -- the tool calls that followed
     it are attributed to the preceding real human turn instead.
   - `assistant`-type lines were scanned for `tool_use` blocks named
     `Edit`, `Write`, or `Read`, filtered to `file_path`s under
     `vibegate/src/`, `vibegate/study/` (excluding `study/prompts/` and
     `study/smoke-templates/`, which are corpus-generation specs fed to
     the *code-generation* tools under study, not analyser code), and
     `vibegate/fixtures/`.
2. Each human prompt opened a new "turn"; every in-scope tool call was
   attached to the most recent preceding human turn.
3. Per file, before/after content was reconstructed by replaying every
   Write (full overwrite) and Edit (`old_string` -> `new_string`,
   respecting `replace_all`) in transcript order. The first touch to every
   in-scope file (except one binary asset, see below) was a `Write` of a
   brand-new path -- see SUMMARY.md.
4. Final reconstructed content was cross-checked against the corresponding
   file currently shipped in this package (`analyser/src/...`,
   `analysis/*.mjs`, `figures/figure1-frontier.*`) where a clear path
   mapping exists. Of the 24 files with such a shipped counterpart, 23
   matched byte-for-byte. The one mismatch (`src/checks/client-secret.ts`)
   was traced to a one-line
   `sed -i` edit the assistant ran via a **Bash** tool call (adding
   `existsSync` to an import line) in the same turn as its last `Edit`
   call on that file -- outside the Edit/Write/Read tool calls this
   disclosure otherwise tracks. Where a shipped counterpart exists, the
   `after/` copy here uses that on-disk file (the confirmed true final
   state, including that sed fix); where no shipped counterpart exists
   (dev-only fixtures, and three `study/` files not carried into the
   package), the `after/` copy is the transcript-replayed reconstruction.
   See SUMMARY.md for the full per-file list.

## Contents

- `README.md` -- this file.
- `PROMPTS-USED.md` -- every human prompt from turns that led to an
  in-scope Edit/Write/Read, in chronological order, verbatim, each labeled
  with a turn number, ISO timestamp, and the file(s) it led to changing.
- `before/` -- reconstructed pre-session file content, mirrored at the
  same path relative to `vibegate/` (e.g. `before/src/cli.ts`). Every code
  file in scope was net-new, so each `before/` path instead carries a
  `<name>.NOTE.txt` explaining that the file did not exist before this
  session.
- `after/` -- final file content, same path layout (e.g.
  `after/src/cli.ts`).
- `SUMMARY.md` -- counts and the net-new vs. pre-existing breakdown.

## What this is not

This is a best-effort reconstruction from an LLM tool-call log, not a git
history. Two limitations to be transparent about:
- Any file edits made through the **Bash** tool (shell redirects, `sed`,
  etc.) rather than the Edit/Write tools are not captured by this
  disclosure's tool-call walk; one such case was found and is called out
  above and in SUMMARY.md.
- `study/figure1-frontier.png` is a generated binary chart image. It was
  only ever `Read` (viewed) by the assistant in-scope, never
  Written/Edited in-scope -- it was produced by *running*
  `study/make-figure.mjs` (a Bash tool call, i.e. by AI-authored code
  executing, not by the assistant hand-authoring the PNG). It is
  therefore excluded from the before/after code reconstruction; see the
  `.NOTE.txt` next to its path.
