// Generate Figure 1 for §3.4: the speed–safety frontier, as a standalone SVG
// suitable for a manuscript (no external assets, print-safe colours).
//   node study/make-figure.mjs corpus-runs.jsonl > study/figure1-frontier.svg
import { readFileSync } from "node:fs";

const HUMAN = 30, DEPLOY = 60;
const C = { frontier: "#2a78d6", knee: "#eb6834", ink: "#0b0b0b", muted: "#52514e", grid: "#dcdbd6" };

const rows = readFileSync(process.argv[2] ?? "corpus-runs.jsonl", "utf8").trim().split("\n").map((l) => JSON.parse(l));

const removed = (r) => r.fixApplied && r.reverified && !(r.brokeAppMeasured ?? r.brokeApp ?? false);
const byCheck = new Map();
for (const r of rows) {
  if (!byCheck.has(r.checkId)) byCheck.set(r.checkId, { id: r.checkId, apps: new Set(), y: 0, s: 0, hd: false, ed: false });
  const a = byCheck.get(r.checkId);
  a.apps.add(r.appId); a.s += r.addedSeconds; a.hd ||= r.humanDecision; a.ed ||= r.extraDeploy;
  if (removed(r)) a.y += r.severityWeight;
}
const checks = [...byCheck.values()].map((a) => ({
  id: a.id.replace(":auto-move", ""),
  yield: a.y / a.apps.size,
  friction: a.s / a.apps.size + (a.hd ? HUMAN : 0) + (a.ed ? DEPLOY : 0),
}));

// enumerate gates
const gates = [];
for (let m = 0; m < 1 << checks.length; m++) {
  let y = 0, f = 0; const members = [];
  checks.forEach((c, i) => { if (m & (1 << i)) { y += c.yield; f += c.friction; members.push(c.id); } });
  gates.push({ members, yield: y, friction: f });
}
const front = gates.filter((g) => !gates.some((h) => h !== g && h.yield >= g.yield && h.friction <= g.friction && (h.yield > g.yield || h.friction < g.friction)))
  .sort((a, b) => a.friction - b.friction || a.yield - b.yield);

// knee = max perpendicular distance to chord
let knee = null, best = -1;
if (front.length > 2) {
  const [a, b] = [front[0], front[front.length - 1]];
  const dx = b.friction - a.friction, dy = b.yield - a.yield, L = Math.hypot(dx, dy) || 1;
  for (const g of front.slice(1, -1)) {
    const d = Math.abs(dx * (a.yield - g.yield) - dy * (a.friction - g.friction)) / L;
    if (d > best) { best = d; knee = g; }
  }
}

const W = 640, H = 400, m = { t: 40, r: 130, b: 62, l: 74 };
const maxF = Math.max(...gates.map((g) => g.friction), 1);
const maxY = Math.max(...gates.map((g) => g.yield), 1);
const px = (f) => m.l + (f / maxF) * (W - m.l - m.r);
const py = (y) => H - m.b - (y / maxY) * (H - m.t - m.b);
const fs = new Set(front);

let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Helvetica,Arial,sans-serif">
<rect width="${W}" height="${H}" fill="#ffffff"/>`;
for (let i = 0; i <= 4; i++) {
  const gy = m.t + (i / 4) * (H - m.t - m.b);
  s += `<line x1="${m.l}" y1="${gy.toFixed(1)}" x2="${W - m.r}" y2="${gy.toFixed(1)}" stroke="${C.grid}" stroke-width="1"/>`;
  s += `<text x="${m.l - 8}" y="${(gy + 4).toFixed(1)}" font-size="11" fill="${C.muted}" text-anchor="end">${(maxY * (1 - i / 4)).toFixed(1)}</text>`;
  const gx = m.l + (i / 4) * (W - m.l - m.r);
  s += `<text x="${gx.toFixed(1)}" y="${H - m.b + 18}" font-size="11" fill="${C.muted}" text-anchor="middle">${((maxF * i) / 4).toFixed(0)}</text>`;
}
for (const g of gates) if (!fs.has(g)) s += `<circle cx="${px(g.friction).toFixed(1)}" cy="${py(g.yield).toFixed(1)}" r="3" fill="${C.muted}" opacity="0.35"/>`;
s += `<polyline points="${front.map((g) => `${px(g.friction).toFixed(1)},${py(g.yield).toFixed(1)}`).join(" ")}" fill="none" stroke="${C.frontier}" stroke-width="2"/>`;
for (const g of front) s += `<circle cx="${px(g.friction).toFixed(1)}" cy="${py(g.yield).toFixed(1)}" r="4.5" fill="${C.frontier}" stroke="#fff" stroke-width="1.5"/>`;
if (knee) {
  s += `<circle cx="${px(knee.friction).toFixed(1)}" cy="${py(knee.yield).toFixed(1)}" r="9" fill="none" stroke="${C.knee}" stroke-width="2.5"/>`;
  s += `<text x="${(px(knee.friction) + 14).toFixed(1)}" y="${(py(knee.yield) - 10).toFixed(1)}" font-size="11.5" font-weight="bold" fill="${C.ink}">knee: ${knee.members.length}-check gate</text>`;
  s += `<text x="${(px(knee.friction) + 14).toFixed(1)}" y="${(py(knee.yield) + 4).toFixed(1)}" font-size="10.5" fill="${C.muted}">${knee.friction.toFixed(3)} s added</text>`;
}
// annotate the two zero-yield checks on the right
const zero = checks.filter((c) => c.yield === 0).sort((a, b) => a.friction - b.friction);
let ty = m.t + 12;
if (zero.length) {
  s += `<text x="${W - m.r + 10}" y="${ty}" font-size="10.5" font-weight="bold" fill="${C.ink}">no automatic fix:</text>`;
  for (const c of zero) { ty += 14; s += `<text x="${W - m.r + 10}" y="${ty}" font-size="10" fill="${C.muted}">${c.id}</text>`; }
}
s += `<text x="${m.l}" y="22" font-size="12.5" font-weight="bold" fill="${C.ink}">Exposure automatically removed vs. added deployment friction</text>`;
s += `<text x="${((m.l + W - m.r) / 2).toFixed(0)}" y="${H - 14}" font-size="11.5" fill="${C.ink}" text-anchor="middle">Added friction (s; incl. human-decision and extra-deploy penalties)</text>`;
s += `<text transform="translate(18 ${(H / 2).toFixed(0)}) rotate(-90)" font-size="11.5" fill="${C.ink}" text-anchor="middle">Severity-weighted exposure removed (per app)</text>`;
s += `</svg>`;
process.stdout.write(s + "\n");
process.stderr.write(`knee: ${knee?.members.join(" + ")} | yield ${knee?.yield.toFixed(2)} | friction ${knee?.friction.toFixed(3)}s | frontier ${front.length} gates\n`);
