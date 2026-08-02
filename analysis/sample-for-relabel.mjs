// Draw a stratified sample of findings and extract the evidence needed to
// re-label each one from SOURCE CODE ALONE (rule-proposed labels withheld),
// so the second labelling is not anchored on the first.
//
//   node study/sample-for-relabel.mjs corpus-runs.jsonl 52 > /tmp/sample.txt
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const file = process.argv[2] ?? "corpus-runs.jsonl";
const target = Number(process.argv[3] ?? 52);
const rows = readFileSync(file, "utf8").trim().split("\n").map((l) => JSON.parse(l));

// Stratify: cover every check, over-sample the judgement-heavy ones.
const QUOTA = {
  "security-headers": 10,
  "endpoint-auth": 20,
  "storage-rules": 12,
  "cors-tighten": 8,
  "client-secret:auto-move": 2,
};

const byCheck = {};
for (const r of rows) (byCheck[r.checkId] ??= []).push(r);

// Deterministic spread across tools/apps: round-robin by tool.
function pick(list, n) {
  const byTool = {};
  for (const r of list) (byTool[r.tool] ??= []).push(r);
  const tools = Object.keys(byTool).sort();
  const out = [];
  let i = 0;
  while (out.length < n && tools.some((t) => byTool[t].length)) {
    const t = tools[i++ % tools.length];
    if (byTool[t].length) out.push(byTool[t].shift());
  }
  return out;
}

const sample = [];
for (const [check, n] of Object.entries(QUOTA)) {
  sample.push(...pick(byCheck[check] ?? [], Math.min(n, (byCheck[check] ?? []).length)));
}

/** Does the app configure any security header anywhere? (for header findings) */
function headerEvidence(appDir) {
  const CANDIDATES = ["vercel.json", "netlify.toml", "_headers", "next.config.mjs", "next.config.js", "next.config.ts", "vite.config.ts", "wrangler.toml"];
  const hits = [];
  for (const c of CANDIDATES) {
    const p = join(appDir, c);
    if (!existsSync(p)) continue;
    const txt = readFileSync(p, "utf8");
    if (/content-security-policy|x-frame-options|strict-transport-security|referrer-policy|x-content-type-options/i.test(txt)) hits.push(c);
  }
  return hits.length ? `HEADERS CONFIGURED IN: ${hits.join(", ")}` : "no header configuration found in any config file";
}

/** Show the flagged file with auth/data/proxy-relevant lines. */
function fileEvidence(appDir, loc) {
  const rel = String(loc).split(":")[0];
  const p = join(appDir, rel);
  if (!existsSync(p)) return "(file not found)";
  const lines = readFileSync(p, "utf8").split("\n");
  const KEY = /session|auth|jwt|token|passport|clerk|unauthorized|401|insert|update|delete|select|db\.|supabase|openai|anthropic|put\(|upload|cors|allow-origin|policy|using|process\.env|createServerFn|use server|router\.(get|post|put|patch|delete)/i;
  const shown = [];
  lines.forEach((l, i) => { if (KEY.test(l) && shown.length < 14) shown.push(`  ${i + 1}: ${l.trim().slice(0, 110)}`); });
  return shown.length ? shown.join("\n") : "  (no relevant lines matched)";
}

console.log(`SAMPLE FOR BLIND RE-LABELLING — ${sample.length} findings`);
console.log("Label each: TP (genuine) | INTENDED (public by design) | WEAK (shared password) | FP (analyser wrong)\n");
sample.forEach((r, idx) => {
  const appDir = join("corpus", r.appId);
  console.log(`--- [${idx + 1}] ${r.appId} | ${r.checkId} | ${r.location ?? "(app-level)"}`);
  console.log(`    detail: ${r.detail}`);
  console.log(r.checkId === "security-headers" ? `    evidence: ${headerEvidence(appDir)}` : fileEvidence(appDir, r.location));
  console.log();
});
