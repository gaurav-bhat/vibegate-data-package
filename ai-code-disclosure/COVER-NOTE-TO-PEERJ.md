Note to the editor — AI use in computer code
=============================================

This note accompanies the artefact requested under "Use of Artificial
Intelligence (AI) in Computer Code": a copy of the code before AI editing, a
copy after, and the prompts used.

**The code in question was written with Claude Code from an empty directory,
not edited into pre-existing code.** The `vibegate` static analyser and the
corpus-analysis scripts (disclosed in Manuscript §2.7) were new tooling built
for this study; there was no prior human-authored version for AI to edit, so
a literal "before" snapshot of the code does not exist. What follows is the
closest equivalent I can provide: the complete development record.

No commit-level history survives from development (the working directory was
never placed under version control), so this artefact is reconstructed
directly from the two Claude Code session transcripts in which the work was
done — the full, unedited interaction log between author and tool, covering
2026-07-26 to 2026-08-02. From those transcripts I have extracted:

- **`PROMPTS-USED.md`** — every prompt I gave the tool that led to a code
  change, verbatim, in order, each tied to the file(s) it produced.
- **`after/`** — the resulting code, cross-checked against the files shipped
  in this package (23 of 24 comparable files match byte-for-byte; the one
  discrepancy, a single-line import fix applied via a shell command rather
  than the tool's file-edit action, is documented in `README.md` and
  `SUMMARY.md`).
- **`before/`** — present for completeness at the path PeerJ's checklist
  implies, but since every in-scope file was net-new, each entry is a note
  stating that the file did not exist prior to this session, rather than a
  fabricated snapshot.
- **`README.md`** and **`SUMMARY.md`** — full methodology, so the
  reconstruction is auditable rather than a bare assertion.

I have not altered the manuscript's account of what the tool was used for
(§2.7, Acknowledgements): design and implementation of the analyser, the
analysis scripts, and drafting/revising the manuscript's language. All
experimental design decisions, labelling judgements, and conclusions are my
own; the transcripts show the tool executing instructions I gave, not making
independent research decisions.

I'm glad to provide the raw transcript files themselves if the editor or a
reviewer wants to verify the extraction directly, or to answer any further
questions about this material.

Gaurav Bhatnagar
