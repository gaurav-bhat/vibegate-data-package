# AI Code Use Disclosure

This directory documents the AI-assisted development of the `vibegate` static
analyser (`analyser/src/`) and the corpus-analysis scripts (`analysis/*.mjs`),
as disclosed in MANUSCRIPT.md Section 2.7. It was assembled to satisfy
PeerJ's requirement, for AI-tool-edited code, of (1) a before copy, (2) an
after copy, and (3) the prompts used.

**Full repository:** https://github.com/gaurav-bhat/vibegate-data-package

This `ai-code-disclosure/` directory is one part of that repository. Paths
referenced below (`analyser/`, `analysis/`, `data/`, `figures/`) are
locations in the repository above -- if you are viewing only this directory
in isolation, follow the link to see those files in context. The `after/`
folder here also carries a self-contained copy of every reconstructed file,
so this directory is readable on its own even without the full repository;
`dev-only/` holds the handful of files with no counterpart in the
repository at all (development-only scaffolding, never shipped).

## Provenance

This code was originally written in a local working directory that was
never placed under version control, so no commit history survives from its
development. `vibegate-data-package` itself contains only 4 squashed
packaging commits, made after the fact. The material in this directory is
therefore reconstructed programmatically from the full Claude Code session
transcripts that performed the development, rather than from version
control.

Source transcripts (Claude Code session logs, JSONL, one JSON object per
line), kept locally by the tool and not part of this repository:

- The primary session (~14 MB, 2241 lines): contains every Edit/Write/Read
  tool call that touched the analyser source, the analysis scripts, or the
  dev-only fixtures covered by this disclosure.
- A second, smaller session (~2 MB, 571 lines): checked and found to touch
  only `MANUSCRIPT.md` (2 Edit calls, both prose changes to the manuscript
  text itself). It contains no Edit/Write/Read calls against any file
  covered by this disclosure, so it contributes nothing here and is not
  otherwise represented.

Both transcripts were parsed with a small Python script (not included here)
that walks each line in order, in a single streaming pass, skipping any
line that fails to parse as JSON.

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
     `Edit`, `Write`, or `Read`, filtered to the analyser source, the
     analysis scripts, and the dev-only fixtures in scope for this
     disclosure (excluding the corpus-generation prompt specs and UI
     scaffolding templates recorded in the same session, which are inputs
     to the *code-generation tools under study*, not analyser code).
2. Each human prompt opened a new "turn"; every in-scope tool call was
   attached to the most recent preceding human turn.
3. Per file, before/after content was reconstructed by replaying every
   Write (full overwrite) and Edit (`old_string` -> `new_string`,
   respecting `replace_all`) in transcript order. The first touch to every
   in-scope file (except one binary asset, see below) was a `Write` of a
   brand-new path -- see SUMMARY.md.
4. Final reconstructed content was cross-checked against the corresponding
   file currently shipped in this package (`analyser/src/...`,
   `analysis/*.mjs`, `data/labels-rater2-inspection.csv`,
   `figures/figure1-frontier.*`) where a clear path mapping exists. Of the
   25 files with such a shipped counterpart, 24 matched byte-for-byte. The
   one mismatch (`analyser/src/checks/client-secret.ts`) was traced to a
   one-line `sed -i` edit the assistant ran via a **Bash** tool call
   (adding `existsSync` to an import line) in the same turn as its last
   `Edit` call on that file -- outside the Edit/Write/Read tool calls this
   disclosure otherwise tracks. Where a shipped counterpart exists, the
   `after/` copy here uses that on-disk file (the confirmed true final
   state, including that sed fix); where no shipped counterpart exists
   (the `dev-only/` files -- see Contents below), the `after/` copy is the
   transcript-replayed reconstruction.
   See SUMMARY.md for the full per-file list.

## Contents

- `README.md` -- this file.
- `PROMPTS-USED.md` -- every human prompt from turns that led to an
  in-scope Edit/Write/Read, in chronological order, verbatim, each labeled
  with a turn number, ISO timestamp, and the package path(s) it led to
  changing.
- `before/` -- reconstructed pre-session file content, at the same path
  it has in this package (e.g. `before/analyser/src/cli.ts`). Every code
  file in scope was net-new, so each `before/` path instead carries a
  `<name>.NOTE.txt` explaining that the file did not exist before this
  session.
- `after/` -- final file content, same path layout (e.g.
  `after/analyser/src/cli.ts`). Five files here have no counterpart
  elsewhere in this package -- they were development-only scaffolding
  (a protocol note, a metadata template, and three test fixtures) never
  carried into the shipped analyser or analysis code -- and are kept under
  `dev-only/` for completeness, since this disclosure otherwise covers
  every in-scope file touched during development.
- `SUMMARY.md` -- counts and the net-new vs. pre-existing breakdown.

## What this is not

This is a best-effort reconstruction from an LLM tool-call log, not a git
history. Two limitations to be transparent about:
- Any file edits made through the **Bash** tool (shell redirects, `sed`,
  etc.) rather than the Edit/Write tools are not captured by this
  disclosure's tool-call walk; one such case was found and is called out
  above and in SUMMARY.md.
- `figures/figure1-frontier.png` is a generated binary chart image. It was
  only ever `Read` (viewed) by the assistant in-scope, never
  Written/Edited in-scope -- it was produced by *running*
  `analysis/make-figure.mjs` (a Bash tool call, i.e. by AI-authored code
  executing, not by the assistant hand-authoring the PNG). It is
  therefore excluded from the before/after code reconstruction; see
  `before/figures/figure1-frontier.png.NOTE.txt`.
