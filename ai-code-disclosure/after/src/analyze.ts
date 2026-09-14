// Analysis layer: read the MeasurementRow JSONL and produce the paper's figure
// — the speed–safety frontier and its knee. A "gate" is a subset of checks;
// each gate is a point (friction, yield). We enumerate gates, take the Pareto
// frontier (max yield, min friction), find the knee, and emit a console
// summary, a CSV, and a self-contained HTML/SVG chart.
//
//   npm run analyze -- runs.jsonl [--per-app] [--human=N] [--deploy=N]
//   npm run analyze -- runs.jsonl --sensitivity
//
// --per-app normalizes yield to a per-app mean, so a check that ran on more
//   apps doesn't accumulate more yield (required for cross-check comparison on
//   a real corpus). --sensitivity sweeps the friction penalties and reports
//   whether the knee (recommended gate) is stable across them.
import { readFileSync, writeFileSync } from "node:fs";
import type { MeasurementRow } from "./types.js";

const DEFAULT_HUMAN = 30; // friction-seconds for a required human decision
const DEFAULT_DEPLOY = 60; // friction-seconds for a second (separate) deploy
const COLORS = { frontier: "#2a78d6", frontierDark: "#3987e5", knee: "#eb6834", kneeDark: "#d95926" };

/** Penalty-independent per-check statistics. Friction is derived later so the
 *  sensitivity sweep can vary the penalties without re-aggregating. */
interface CheckStat {
  checkId: string;
  found: number;
  removed: number;
  yieldWt: number; // severity-weighted exposure removed (sum, or per-app mean)
  addedSec: number;
  apps: number;
  humanDecision: boolean;
  extraDeploy: boolean;
}

interface Gate {
  members: string[];
  friction: number;
  yield: number;
}

function removedRow(r: MeasurementRow): boolean {
  const broke = r.brokeAppMeasured ?? r.brokeApp ?? false;
  return r.fixApplied && r.reverified && !broke;
}

/** Aggregate rows into per-check stats. With perApp, yield and addedSec are the
 *  mean across the apps a check ran on, not the sum. */
function aggregate(rows: MeasurementRow[], perApp: boolean): CheckStat[] {
  // check -> app -> {yield, added, found, removed}
  const by = new Map<string, Map<string, { y: number; s: number; f: number; r: number; hd: boolean; ed: boolean }>>();
  for (const r of rows) {
    if (!by.has(r.checkId)) by.set(r.checkId, new Map());
    const apps = by.get(r.checkId)!;
    if (!apps.has(r.appId)) apps.set(r.appId, { y: 0, s: 0, f: 0, r: 0, hd: false, ed: false });
    const a = apps.get(r.appId)!;
    a.f += 1;
    a.s += r.addedSeconds;
    a.hd ||= r.humanDecision;
    a.ed ||= r.extraDeploy;
    if (removedRow(r)) {
      a.r += 1;
      a.y += r.severityWeight;
    }
  }

  const stats: CheckStat[] = [];
  for (const [checkId, apps] of by) {
    const n = apps.size;
    let found = 0, removed = 0, yieldWt = 0, addedSec = 0, hd = false, ed = false;
    for (const a of apps.values()) {
      found += a.f;
      removed += a.r;
      yieldWt += a.y;
      addedSec += a.s;
      hd ||= a.hd;
      ed ||= a.ed;
    }
    stats.push({
      checkId,
      found,
      removed,
      apps: n,
      yieldWt: Number((perApp ? yieldWt / n : yieldWt).toFixed(3)),
      addedSec: Number((perApp ? addedSec / n : addedSec).toFixed(4)),
      humanDecision: hd,
      extraDeploy: ed,
    });
  }
  return stats.sort((x, y) => y.yieldWt - x.yieldWt);
}

function frictionOf(s: CheckStat, human: number, deploy: number): number {
  return Number(
    (s.addedSec + (s.humanDecision ? human : 0) + (s.extraDeploy ? deploy : 0)).toFixed(3),
  );
}

function allGates(stats: CheckStat[], human: number, deploy: number): Gate[] {
  const gates: Gate[] = [];
  const n = stats.length;
  for (let mask = 0; mask < 1 << n; mask++) {
    const members: string[] = [];
    let friction = 0, yld = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) {
        members.push(stats[i].checkId);
        friction += frictionOf(stats[i], human, deploy);
        yld += stats[i].yieldWt;
      }
    }
    gates.push({ members, friction: Number(friction.toFixed(3)), yield: Number(yld.toFixed(3)) });
  }
  return gates;
}

function paretoFrontier(gates: Gate[]): Gate[] {
  return gates
    .filter(
      (g) =>
        !gates.some(
          (h) =>
            h !== g &&
            h.yield >= g.yield &&
            h.friction <= g.friction &&
            (h.yield > g.yield || h.friction < g.friction),
        ),
    )
    .sort((a, b) => a.friction - b.friction || a.yield - b.yield);
}

function findKnee(front: Gate[]): Gate | null {
  if (front.length < 3) return front[front.length - 1] ?? null;
  const a = front[0];
  const b = front[front.length - 1];
  const dx = b.friction - a.friction;
  const dy = b.yield - a.yield;
  const len = Math.hypot(dx, dy) || 1;
  let best: Gate | null = null;
  let bestDist = -1;
  for (const g of front.slice(1, -1)) {
    const dist = Math.abs(dx * (a.yield - g.yield) - dy * (a.friction - g.friction)) / len;
    if (dist > bestDist) {
      bestDist = dist;
      best = g;
    }
  }
  return best;
}

function svgChart(gates: Gate[], front: Gate[], knee: Gate | null): string {
  const W = 720, H = 460, m = { t: 56, r: 24, b: 64, l: 72 };
  const maxF = Math.max(...gates.map((g) => g.friction), 1);
  const maxY = Math.max(...gates.map((g) => g.yield), 1);
  const px = (f: number) => m.l + (f / maxF) * (W - m.l - m.r);
  const py = (y: number) => H - m.b - (y / maxY) * (H - m.t - m.b);
  const frontSet = new Set(front);
  const grid: string[] = [];
  for (let i = 0; i <= 4; i++) {
    const gy = m.t + (i / 4) * (H - m.t - m.b);
    grid.push(`<line x1="${m.l}" y1="${gy}" x2="${W - m.r}" y2="${gy}" class="grid"/>`);
    grid.push(`<text x="${m.l - 10}" y="${gy + 4}" class="tick" text-anchor="end">${(maxY * (1 - i / 4)).toFixed(1)}</text>`);
    const gx = m.l + (i / 4) * (W - m.l - m.r);
    grid.push(`<text x="${gx}" y="${H - m.b + 20}" class="tick" text-anchor="middle">${((maxF * i) / 4).toFixed(0)}</text>`);
  }
  const dots = gates.filter((g) => !frontSet.has(g)).map((g) => `<circle cx="${px(g.friction)}" cy="${py(g.yield)}" r="3.5" class="dominated"/>`).join("");
  const line = `<polyline points="${front.map((g) => `${px(g.friction)},${py(g.yield)}`).join(" ")}" class="frontline"/>`;
  const fdots = front.map((g) => `<circle cx="${px(g.friction)}" cy="${py(g.yield)}" r="5" class="frontier"/>`).join("");
  const kneeMark = knee
    ? `<circle cx="${px(knee.friction)}" cy="${py(knee.yield)}" r="8" class="knee"/><text x="${px(knee.friction) + 12}" y="${py(knee.yield) - 8}" class="kneelabel">knee: ${knee.members.length} checks</text>`
    : "";
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Speed-safety frontier">
  <style>
    .grid{stroke:var(--grid);stroke-width:1}.tick{fill:var(--muted);font:12px system-ui,sans-serif}
    .dominated{fill:var(--muted);opacity:.45}.frontline{fill:none;stroke:${COLORS.frontier};stroke-width:2}
    .frontier{fill:${COLORS.frontier};stroke:var(--surface);stroke-width:2}.knee{fill:none;stroke:${COLORS.knee};stroke-width:3}
    .kneelabel{fill:var(--ink);font:600 13px system-ui,sans-serif}.axis{fill:var(--ink);font:600 13px system-ui,sans-serif}
    @media (prefers-color-scheme:dark){.frontline{stroke:${COLORS.frontierDark}}.frontier{fill:${COLORS.frontierDark}}.knee{stroke:${COLORS.kneeDark}}}
    :root[data-theme="dark"] .frontline{stroke:${COLORS.frontierDark}}:root[data-theme="dark"] .frontier{fill:${COLORS.frontierDark}}:root[data-theme="dark"] .knee{stroke:${COLORS.kneeDark}}
  </style>${grid.join("")}
  <text x="${m.l}" y="28" class="axis">Speed–safety frontier: exposure auto-removed vs. deployment friction</text>
  <text x="${W / 2}" y="${H - 12}" class="axis" text-anchor="middle">Friction (friction-seconds: human-decision + extra-deploy + wall-clock)</text>
  <text transform="translate(20 ${H / 2}) rotate(-90)" class="axis" text-anchor="middle">Severity-weighted exposure auto-removed</text>
  ${dots}${line}${fdots}${kneeMark}</svg>`;
}

function html(stats: CheckStat[], gates: Gate[], front: Gate[], knee: Gate | null, human: number, deploy: number): string {
  const rows = stats
    .map((a) => `<tr><td>${a.checkId}</td><td>${a.removed}/${a.found}</td><td>${a.yieldWt}</td><td>${frictionOf(a, human, deploy)}</td><td>${a.humanDecision ? "yes" : ""}</td><td>${a.extraDeploy ? "yes" : ""}</td></tr>`)
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>vibegate — speed–safety frontier</title>
<style>
  :root{--surface:#fcfcfb;--ink:#0b0b0b;--muted:#52514e;--grid:#e7e6e2}
  @media (prefers-color-scheme:dark){:root{--surface:#1a1a19;--ink:#fff;--muted:#c3c2b7;--grid:#333330}}
  :root[data-theme="dark"]{--surface:#1a1a19;--ink:#fff;--muted:#c3c2b7;--grid:#333330}
  :root[data-theme="light"]{--surface:#fcfcfb;--ink:#0b0b0b;--muted:#52514e;--grid:#e7e6e2}
  body{background:var(--surface);color:var(--ink);font:15px/1.5 system-ui,sans-serif;margin:0;padding:32px;max-width:860px}
  svg{width:100%;height:auto;background:var(--surface)}table{border-collapse:collapse;margin-top:20px;font-size:14px;width:100%}
  th,td{text-align:left;padding:6px 12px;border-bottom:1px solid var(--grid)}th{color:var(--muted);font-weight:600}
  caption{text-align:left;color:var(--muted);margin-bottom:8px}.note{color:var(--muted);font-size:13px;margin-top:16px}
</style></head><body>${svgChart(gates, front, knee)}
<table><caption>Per-check yield and friction (aggregated across the JSONL)</caption>
<thead><tr><th>check</th><th>removed/found</th><th>yield (sev-wt)</th><th>friction</th><th>human decision</th><th>extra deploy</th></tr></thead>
<tbody>${rows}</tbody></table>
<p class="note">Recommended minimal gate (knee): <b>${knee ? knee.members.join(", ") || "(none)" : "n/a"}</b> — yield ${knee?.yield ?? 0}, friction ${knee?.friction ?? 0}.
Friction penalties: human-decision=${human}, extra-deploy=${deploy} (modeling parameters). Block-only checks contribute protection off this auto-remediation axis.</p>
</body></html>`;
}

function runNormal(stats: CheckStat[], human: number, deploy: number, perApp: boolean): void {
  const gates = allGates(stats, human, deploy);
  const front = paretoFrontier(gates);
  const knee = findKnee(front);

  console.log(`# vibegate analysis  (${stats.length} checks, yield=${perApp ? "per-app mean" : "sum"}, penalties H=${human} D=${deploy})\n`);
  console.log("check                       removed/found  apps  yield  friction  human  redeploy");
  for (const a of stats) {
    console.log(
      `  ${a.checkId.padEnd(26)} ${`${a.removed}/${a.found}`.padEnd(13)} ${String(a.apps).padEnd(5)} ` +
        `${String(a.yieldWt).padEnd(6)} ${String(frictionOf(a, human, deploy)).padEnd(9)} ${a.humanDecision ? "yes" : "-"}    ${a.extraDeploy ? "yes" : "-"}`,
    );
  }
  console.log(`\n  Pareto frontier: ${front.length} gates`);
  console.log(`  Knee (recommended minimal gate): ${knee?.members.join(", ") || "(none)"}  -> yield ${knee?.yield ?? 0}, friction ${knee?.friction ?? 0}`);

  const csv = "gate,friction,yield,onFrontier,isKnee\n" +
    gates.map((g) => `"${g.members.join("|")}",${g.friction},${g.yield},${front.includes(g) ? 1 : 0},${g === knee ? 1 : 0}`).join("\n");
  writeFileSync("frontier.csv", csv + "\n");
  writeFileSync("frontier.html", html(stats, gates, front, knee, human, deploy));
  console.log("\n  wrote frontier.csv and frontier.html");
}

function runSensitivity(stats: CheckStat[]): void {
  const humans = [10, 30, 60, 120];
  const deploys = [10, 30, 60, 120, 300];
  console.log(`# sensitivity of the knee to friction penalties\n`);
  const kneeIds = new Set<string>();
  console.log("  human \\ deploy   " + deploys.map((d) => String(d).padStart(3)).join("   "));
  for (const h of humans) {
    const cells: string[] = [];
    for (const d of deploys) {
      const knee = findKnee(paretoFrontier(allGates(stats, h, d)));
      const id = knee ? knee.members.length : 0;
      kneeIds.add(knee ? [...knee.members].sort().join("|") : "");
      cells.push(String(id).padStart(3));
    }
    console.log(`  H=${String(h).padEnd(12)}` + cells.join("   ") + "   (knee size)");
  }
  console.log(`\n  distinct knee gates across the sweep: ${kneeIds.size}`);
  console.log(kneeIds.size === 1
    ? "  -> knee is STABLE across all penalty settings."
    : "  -> knee shifts; report the frontier under a penalty range, not a single point.");
  for (const id of kneeIds) console.log(`     - ${id.split("|").join(", ") || "(none)"}`);
}

function main(): void {
  const args = process.argv.slice(2);
  const inFile = args.find((a) => !a.startsWith("--")) ?? "runs.jsonl";
  const perApp = args.includes("--per-app");
  const sensitivity = args.includes("--sensitivity");
  const human = Number(args.find((a) => a.startsWith("--human="))?.slice(8) ?? DEFAULT_HUMAN);
  const deploy = Number(args.find((a) => a.startsWith("--deploy="))?.slice(9) ?? DEFAULT_DEPLOY);

  const rows = readFileSync(inFile, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as MeasurementRow);
  const stats = aggregate(rows, perApp);

  if (sensitivity) runSensitivity(stats);
  else runNormal(stats, human, deploy, perApp);
}

main();
