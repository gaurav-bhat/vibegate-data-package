// Phase 5: false-positive labeling scaffold.
//
//   node study/label-findings.mjs corpus-runs.jsonl > labels.csv      # propose
//   node study/label-findings.mjs corpus-runs.jsonl --precision       # score
//   node study/label-findings.mjs corpus-runs.jsonl --precision --reviewed=labels.csv
//
// Emits one row per finding with a PROPOSED label from the rules below, for a
// human to review and correct. Precision is computed from the reviewed file if
// given, otherwise from the proposals (clearly marked as un-reviewed).
//
// Label vocabulary:
//   TP        — genuine exposure
//   INTENDED  — unauthenticated by design (public healthcheck, public gallery
//               read, public waitlist signup). Not a defect; excluded from
//               precision as "not a vulnerability" rather than a tool error.
//   FP        — the check is simply wrong (misread the code)
//   WEAK      — real but lesser control (shared static password gate)
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--")) ?? "corpus-runs.jsonl";
const wantPrecision = args.includes("--precision");
const reviewed = args.find((a) => a.startsWith("--reviewed="))?.split("=")[1];

const rows = readFileSync(file, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));

/** Rule-based proposal. Each rule states WHY, so a reviewer can disagree. */
function propose(r) {
  const loc = (r.location ?? "").toLowerCase();
  const det = (r.detail ?? "").toLowerCase();
  const spec = r.appId.split("-")[0];

  // Intended-public: a healthcheck endpoint is meant to be open.
  if (/health|healthz|\/ping/.test(loc)) return ["INTENDED", "healthcheck endpoint is public by design"];

  // Weak-auth sub-class is already tagged by the check itself.
  if (/shared static password/.test(det)) return ["WEAK", "password gate: real but lesser control"];

  // Intended-public reads for gallery/list in the file-upload spec: the prompt
  // says "anyone with the link should be able to view the gallery".
  if (spec === "file" && /\(read\)/.test(det) && /(image|list|gallery)/.test(loc))
    return ["INTENDED", "prompt explicitly asks for a publicly viewable gallery"];

  // Waitlist signup is a public write by design (visitors submit their email).
  if (spec === "waitlist" && /waitlist|signup|subscribe/.test(loc) && /\(write\)/.test(det))
    return ["INTENDED", "public signup is the point of a waitlist form"];

  // Permissive RLS on SELECT for a public-catalog spec is arguably intended;
  // write/delete never is.
  if (/permissive rls policy \(select\)/.test(det))
    return ["INTENDED?", "public read may be intended; write/delete is not — REVIEW"];

  return ["TP", "no design justification for unauthenticated access"];
}

const labeled = rows.map((r) => {
  const [label, why] = propose(r);
  return { ...r, proposedLabel: label, why };
});

if (!wantPrecision) {
  const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  console.log("appId,tool,spec,check,location,detail,severity,proposedLabel,rationale,REVIEWED_LABEL");
  for (const r of labeled) {
    console.log([
      r.appId, r.tool, r.appId.split("-")[0], r.checkId,
      esc(r.location), esc(r.detail), r.severityWeight, r.proposedLabel, esc(r.why), "",
    ].join(","));
  }
  process.exit(0);
}

// --- precision ---
let source = labeled.map((r) => ({ check: r.checkId, label: r.proposedLabel }));
if (reviewed) {
  const lines = readFileSync(reviewed, "utf8").trim().split("\n").slice(1);
  source = lines.map((l) => {
    const cols = l.match(/("([^"]|"")*"|[^,]*)/g).filter((_, i) => i % 2 === 0);
    const check = cols[3];
    const human = (cols[9] ?? "").replace(/"/g, "").trim();
    const proposed = cols[7];
    return { check, label: human || proposed };
  });
}

const by = {};
for (const { check, label } of source) {
  by[check] ??= { TP: 0, INTENDED: 0, "INTENDED?": 0, FP: 0, WEAK: 0, total: 0 };
  by[check][label] = (by[check][label] ?? 0) + 1;
  by[check].total++;
}

const pad = (s, n) => String(s).padEnd(n);
console.log(reviewed ? `# precision from REVIEWED labels (${reviewed})` : "# precision from PROPOSED labels (NOT yet human-reviewed)");
console.log("\n" + pad("check", 26) + pad("total", 7) + pad("TP", 6) + pad("INTENDED", 10) + pad("WEAK", 6) + pad("FP", 5) + "precision*");
for (const [check, c] of Object.entries(by)) {
  const intended = (c.INTENDED ?? 0) + (c["INTENDED?"] ?? 0);
  // precision* = TP / (TP + FP), treating INTENDED as "not a defect" (excluded)
  const denom = (c.TP ?? 0) + (c.FP ?? 0);
  const p = denom ? ((c.TP ?? 0) / denom * 100).toFixed(0) + "%" : "n/a";
  console.log(pad(check, 26) + pad(c.total, 7) + pad(c.TP ?? 0, 6) + pad(intended, 10) + pad(c.WEAK ?? 0, 6) + pad(c.FP ?? 0, 5) + p);
}
console.log("\n* precision = TP/(TP+FP); INTENDED excluded (unauthenticated by design, not a tool error).");
console.log("  Report INTENDED separately — it is the 'unauthenticated != vulnerable' category.");
