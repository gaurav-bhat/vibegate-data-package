// Compare rule-proposed labels (rater 1) against the independent code-inspection
// labels (rater 2, study/relabel-r2.csv) on the stratified sample, and report
// raw agreement plus Cohen's kappa.
//
// IMPORTANT: rater 2 is a second *pass* (blind re-labelling from source code,
// without seeing the rule proposals), not a second independent human. This
// measures rule-vs-inspection agreement and should be reported as such.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const r2 = readFileSync("study/relabel-r2.csv", "utf8").trim().split("\n").slice(1)
  .map((l) => {
    const m = l.match(/^(\d+),([A-Z?]+),/);
    return { idx: Number(m[1]), label: m[2] };
  });

// Regenerate the same deterministic sample and take rater-1 (rule) labels.
const sampleOut = execSync("node study/sample-for-relabel.mjs corpus-runs.jsonl 52", { encoding: "utf8" });
const ids = [...sampleOut.matchAll(/^--- \[(\d+)\] (\S+) \| (\S+) \| (.*)$/gm)]
  .map((m) => ({ idx: Number(m[1]), appId: m[2], check: m[3], location: m[4].trim() }));

const labels = readFileSync("study/labels.csv", "utf8").trim().split("\n").slice(1)
  .map((l) => {
    const c = l.match(/("([^"]|"")*"|[^,]*)/g).filter((_, i) => i % 2 === 0);
    return { appId: c[0], check: c[3], location: c[4].replace(/"/g, ""), label: c[7] };
  });

const used = new Set();
const pairs = [];
for (const s of ids) {
  const cand = labels.findIndex((L, i) =>
    !used.has(i) && L.appId === s.appId && L.check === s.check &&
    (s.location === "(app-level)" ? true : L.location === s.location));
  if (cand === -1) continue;
  used.add(cand);
  const a = labels[cand].label;
  const b = r2.find((x) => x.idx === s.idx)?.label;
  if (b) pairs.push({ idx: s.idx, check: s.check, r1: a, r2: b });
}

const CATS = ["TP", "INTENDED", "INTENDED?", "WEAK", "FP"];
// Collapse INTENDED? into INTENDED for agreement (same semantic category).
const norm = (l) => (l === "INTENDED?" ? "INTENDED" : l);

let agree = 0;
const conf = {};
for (const p of pairs) {
  const a = norm(p.r1), b = norm(p.r2);
  if (a === b) agree++;
  conf[`${a}->${b}`] = (conf[`${a}->${b}`] ?? 0) + 1;
}
const n = pairs.length;
const po = agree / n;

// Cohen's kappa
const cats = [...new Set(pairs.flatMap((p) => [norm(p.r1), norm(p.r2)]))];
let pe = 0;
for (const c of cats) {
  const p1 = pairs.filter((p) => norm(p.r1) === c).length / n;
  const p2 = pairs.filter((p) => norm(p.r2) === c).length / n;
  pe += p1 * p2;
}
const kappa = (po - pe) / (1 - pe);

console.log(`Sample n = ${n}\n`);
console.log(`Raw agreement : ${(po * 100).toFixed(1)}%  (${agree}/${n})`);
console.log(`Cohen's kappa : ${kappa.toFixed(3)}`);
console.log(`\nConfusion (rater1 -> rater2):`);
for (const [k, v] of Object.entries(conf).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(26)} ${v}`);
console.log(`\nDisagreements:`);
for (const p of pairs) if (norm(p.r1) !== norm(p.r2)) console.log(`  [${p.idx}] ${p.check}: rule=${p.r1} inspection=${p.r2}`);
