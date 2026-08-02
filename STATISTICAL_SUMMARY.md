# Statistical summary

Generated from `data/findings.jsonl` and `data/labels-rater1-rules.csv`.

## Corpus

- Applications: 75 (5 specifications x 5 tools x 3 generations)
- Findings: 490
- Labels: TP 453 | INTENDED 24 | INTENDED? 11 | WEAK 2

## Applications with >=1 finding, of 15 per tool (raw)

|check|v0|lovable|bolt|replit|claude|
|---|---|---|---|---|---|
|security-headers|15|15|15|15|15|
|client-secret:auto-move|0|0|2|0|0|
|cors-tighten|0|0|3|15|0|
|endpoint-auth|12|4|3|15|8|
|storage-rules|0|8|7|0|0|
|dep-vuln|0|0|0|0|0|

## Label distribution by check

|check|TP|INTENDED|WEAK|FP|
|---|---|---|---|---|
|security-headers|375|0|0|0|
|client-secret:auto-move|2|0|0|0|
|cors-tighten|18|0|0|0|
|endpoint-auth|31|24|2|0|
|storage-rules|27|11|0|0|

## Rater agreement

- Sample: 52 findings, stratified across every check x tool combination
- Raw agreement: 94.2% (49/52)
- Cohen's kappa: 0.698 (substantial)
- Disagreements: 3, all permissive RLS SELECT policies on the admin-dashboard spec
  (rater 1 rule: possibly intended public read; rater 2 inspection: an admin
   dashboard should not be world-readable). Resolved in favour of rater 2.

**Caveat.** Rater 2 is an independent re-labelling from source code without sight of
the rule proposals; it is not a second independent human annotator. Reported as
rule-vs-inspection agreement.

## Frontier

- Primary condition (no deployment origin): knee = 2-check gate, 0.018 s added
- Secondary condition (origin known, CORS auto-fixable): knee = 3-check gate, 0.037 s added
- Both stable across all 20 friction-penalty combinations tested

## Excluded from conclusions

- `dep-vuln` returned 0 findings across all 75 applications. This is NOT evidence
  of absence: the advisory snapshot used is small and one lockfile format
  (`bun.lock`) is unsupported. The check is excluded from the manuscript's claims.
