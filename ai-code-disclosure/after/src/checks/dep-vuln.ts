// Check: dep-vuln — known-vulnerable dependencies in the resolved tree
// (design §4.6). Detection uses a PINNED advisory snapshot (data/advisories.json)
// rather than live npm audit: for a research artifact, reproducibility beats
// coverage, since audit results drift as the advisory DB changes. Live OSV
// lookup is future work.
//
// The fix bumps package.json to the fixed version, but that does NOT remediate
// on its own — the lockfile (which detection reads) still pins the vulnerable
// version until `npm install` runs, and a major bump may be a breaking change.
// So the auto-fix honestly reports itself incomplete (reverified=false),
// mirroring the client-secret server case: some classes need a second step the
// inline gate can't cheaply take.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Check, CheckContext, Finding, FixResult } from "../types.js";

interface Advisory {
  id: string;
  title: string;
  severity: "critical" | "high" | "moderate" | "low";
  vulnerableBelow: string;
}

const ADVISORIES: Record<string, Advisory[]> = (() => {
  const raw = JSON.parse(readFileSync(new URL("../data/advisories.json", import.meta.url), "utf8"));
  const out: Record<string, Advisory[]> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!k.startsWith("_") && Array.isArray(v)) out[k] = v as Advisory[];
  }
  return out;
})();

const SEVERITY: Record<Advisory["severity"], number> = {
  critical: 0.95,
  high: 0.8,
  moderate: 0.5,
  low: 0.3,
};

function parseVer(v: string): [number, number, number] | null {
  const m = String(v)
    .replace(/^[\^~>=<\s]*/, "")
    .match(/(\d+)\.(\d+)\.(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

function lessThan(a: [number, number, number], b: [number, number, number]): boolean {
  for (let i = 0; i < 3; i++) {
    if (a[i] < b[i]) return true;
    if (a[i] > b[i]) return false;
  }
  return false;
}

function isVulnerable(version: string, below: string): boolean {
  const v = parseVer(version);
  const f = parseVer(below);
  return v && f ? lessThan(v, f) : false;
}

type Dep = { name: string; version: string };

/** Resolved (name, version) pairs from whichever lockfile the app shipped —
 *  npm (package-lock.json), pnpm (pnpm-lock.yaml), or yarn (yarn.lock). Most
 *  AI tools emit pnpm or yarn, so npm-only parsing misses nearly everything. */
function resolvedDeps(appDir: string): Dep[] {
  if (existsSync(join(appDir, "package-lock.json"))) return fromNpm(appDir);
  if (existsSync(join(appDir, "pnpm-lock.yaml"))) return fromPnpm(appDir);
  if (existsSync(join(appDir, "yarn.lock"))) return fromYarn(appDir);
  return [];
}

function fromNpm(appDir: string): Dep[] {
  const lock = JSON.parse(readFileSync(join(appDir, "package-lock.json"), "utf8"));
  const found: Dep[] = [];
  if (lock.packages) {
    for (const [p, meta] of Object.entries<any>(lock.packages)) {
      const marker = "node_modules/";
      const idx = p.lastIndexOf(marker);
      if (idx === -1 || !meta?.version) continue;
      found.push({ name: p.slice(idx + marker.length), version: meta.version });
    }
  } else if (lock.dependencies) {
    const walk = (deps: Record<string, any>) => {
      for (const [name, meta] of Object.entries(deps)) {
        if (meta?.version) found.push({ name, version: meta.version });
        if (meta?.dependencies) walk(meta.dependencies);
      }
    };
    walk(lock.dependencies);
  }
  return found;
}

/** pnpm-lock.yaml: `packages:` keys are `name@version(peer)...:` (v6/v9) or
 *  `/name/version:` (v5). Capture name + base version, ignoring peer suffixes. */
function fromPnpm(appDir: string): Dep[] {
  const text = readFileSync(join(appDir, "pnpm-lock.yaml"), "utf8");
  const seen = new Set<string>();
  const found: Dep[] = [];
  const push = (name: string, version: string) => {
    const key = `${name}@${version}`;
    if (!seen.has(key)) {
      seen.add(key);
      found.push({ name, version });
    }
  };
  for (const line of text.split("\n")) {
    // v6/v9: "  name@1.2.3:" or "  @scope/name@1.2.3(peer@x):"
    let m = line.match(/^ {2}\/?((?:@[a-z0-9._-]+\/)?[a-z0-9._-]+)@(\d+\.\d+\.\d+[^():\s]*)/i);
    if (m) { push(m[1], m[2]); continue; }
    // v5: "  /name/1.2.3:" or "  /@scope/name/1.2.3:"
    m = line.match(/^ {2}\/((?:@[a-z0-9._-]+\/)?[a-z0-9._-]+)\/(\d+\.\d+\.\d+[^():\s]*):/i);
    if (m) push(m[1], m[2]);
  }
  return found;
}

/** yarn.lock (v1 classic): blocks headed by `name@range, name@range:` with a
 *  `version "1.2.3"` line inside. */
function fromYarn(appDir: string): Dep[] {
  const text = readFileSync(join(appDir, "yarn.lock"), "utf8");
  const found: Dep[] = [];
  let name: string | null = null;
  for (const line of text.split("\n")) {
    if (/^[^\s#]/.test(line)) {
      // header: take the first spec, strip quotes and @range
      const first = line.split(",")[0].replace(/["':]/g, "").trim();
      const at = first.lastIndexOf("@");
      name = at > 0 ? first.slice(0, at) : first;
    } else {
      const v = line.match(/^\s+version:?\s+"?(\d+\.\d+\.\d+[^"\s]*)"?/);
      if (v && name) found.push({ name, version: v[1] });
    }
  }
  return found;
}

export const depVuln: Check = {
  id: "dep-vuln",
  exposureClass: "vulnerable-dependency",
  surface: "pre",
  maxRung: "auto-fix",
  requiresHumanDecision: false,
  forcesRedeploy: true, // a bump needs reinstall + redeploy to take effect

  async detect(ctx: CheckContext): Promise<Finding[]> {
    if (ctx.surface !== "pre" || !ctx.appDir) return [];
    const findings: Finding[] = [];
    for (const { name, version } of resolvedDeps(ctx.appDir)) {
      for (const adv of ADVISORIES[name] ?? []) {
        if (isVulnerable(version, adv.vulnerableBelow)) {
          findings.push({
            checkId: "dep-vuln",
            exposureClass: "vulnerable-dependency",
            key: `dep:${name}:${version}`,
            detail: `${name}@${version}: ${adv.title} (${adv.severity}, fixed in ${adv.vulnerableBelow})`,
            severity: SEVERITY[adv.severity],
            location: "package-lock.json",
            evidence: adv.vulnerableBelow, // the fixed version, for the bump
          });
        }
      }
    }
    return findings;
  },

  async fix(ctx: CheckContext, finding: Finding): Promise<FixResult> {
    if (!ctx.appDir || !finding.evidence) {
      return { applied: false, reverified: false, note: "no context" };
    }
    const name = finding.key.split(":")[1];
    const fixed = finding.evidence;
    const pkgPath = join(ctx.appDir, "package.json");
    if (!existsSync(pkgPath)) {
      return { applied: false, reverified: false, note: "no package.json" };
    }
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    let bumped = false;
    for (const field of ["dependencies", "devDependencies"]) {
      if (pkg[field]?.[name]) {
        pkg[field][name] = `^${fixed}`;
        bumped = true;
      }
    }
    if (!bumped) {
      // Transitive dep: not directly bumpable in package.json.
      return { applied: false, reverified: false, note: `${name} is a transitive dependency` };
    }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

    // Reverify against the LOCKFILE, which still pins the vulnerable version
    // until `npm install` runs — so this reports incomplete on purpose.
    const stillVulnerable = resolvedDeps(ctx.appDir).some(
      (d) => d.name === name && isVulnerable(d.version, fixed),
    );
    return {
      applied: true,
      reverified: !stillVulnerable,
      brokeApp: undefined, // a major bump may be breaking; needs reinstall + tests
      note: `bumped ${name} to ^${fixed} in package.json — run \`npm install\` to update the lockfile`,
    };
  },
};
