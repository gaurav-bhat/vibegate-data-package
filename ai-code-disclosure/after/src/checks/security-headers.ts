// Check #1: security-headers (pre + post surface, auto-fix, ~0 friction).
// Predicted "free win" at the top-left of the speed–safety frontier: high
// yield, near-zero added deploy time, no human decision, no forced redeploy
// when applied pre-deploy.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  Check,
  CheckContext,
  Finding,
  FixResult,
} from "../types.js";
import { headerConfigFile } from "../adapters.js";

/** Headers we require, with a severity weight and a safe default value to
 *  inject. Weights are deliberately conservative and documented so the
 *  frontier's yield axis is reproducible. */
const REQUIRED: Record<string, { severity: number; value: string }> = {
  "content-security-policy": {
    severity: 0.9,
    value: "default-src 'self'; frame-ancestors 'none'",
  },
  "strict-transport-security": {
    severity: 0.7,
    value: "max-age=31536000; includeSubDomains",
  },
  "x-frame-options": { severity: 0.6, value: "DENY" },
  "x-content-type-options": { severity: 0.5, value: "nosniff" },
  "referrer-policy": { severity: 0.4, value: "no-referrer" },
};

function missingFromSet(present: Set<string>): Finding[] {
  const findings: Finding[] = [];
  for (const [name, meta] of Object.entries(REQUIRED)) {
    if (!present.has(name)) {
      findings.push({
        checkId: "security-headers",
        exposureClass: "missing-security-header",
        key: `header:${name}`,
        detail: `Response is missing ${name}`,
        severity: meta.severity,
      });
    }
  }
  return findings;
}

/** Parse configured header names from a pre-deploy config file. Supports
 *  vercel.json (JSON) and the _headers text format used by Netlify/CF Pages. */
function configuredHeaders(appDir: string, platform: string): Set<string> {
  const present = new Set<string>();
  const file = headerConfigFile(platform as any, appDir);
  if (!existsSync(file)) return present;
  const raw = readFileSync(file, "utf8");

  if (file.endsWith("vercel.json")) {
    try {
      const json = JSON.parse(raw);
      for (const rule of json.headers ?? []) {
        for (const h of rule.headers ?? []) {
          if (h?.key) present.add(String(h.key).toLowerCase());
        }
      }
    } catch {
      /* malformed config counts as "nothing configured" */
    }
  } else {
    // _headers: lines of "Header-Name: value" under path blocks.
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Za-z0-9-]+):\s*.+/);
      if (m) present.add(m[1].toLowerCase());
    }
  }
  return present;
}

function injectHeaders(appDir: string, platform: string, names: string[]): void {
  const file = headerConfigFile(platform as any, appDir);
  if (file.endsWith("vercel.json")) {
    const json = existsSync(file)
      ? JSON.parse(readFileSync(file, "utf8"))
      : {};
    json.headers = json.headers ?? [];
    json.headers.push({
      source: "/(.*)",
      headers: names.map((n) => ({ key: canonical(n), value: REQUIRED[n].value })),
    });
    writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
  } else {
    const block = [
      "/*",
      ...names.map((n) => `  ${canonical(n)}: ${REQUIRED[n].value}`),
      "",
    ].join("\n");
    const prefix = existsSync(file) ? readFileSync(file, "utf8").trimEnd() + "\n" : "";
    writeFileSync(file, prefix + block);
  }
}

/** Header names in their canonical casing for output. */
function canonical(lower: string): string {
  return lower
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("-");
}

// --- Next.js support ---------------------------------------------------------
// Next.js ignores vercel.json/_headers for response headers; they must go in
// next.config's `async headers()`. Writing _headers on a Next app is a FALSE
// remediation (the check would report success while the deployed app serves no
// headers), so the fix must target next.config instead.
const NEXT_CONFIGS = ["next.config.mjs", "next.config.js", "next.config.ts", "next.config.cjs"];

function nextConfigPath(appDir: string): string | null {
  for (const f of NEXT_CONFIGS) {
    const p = join(appDir, f);
    if (existsSync(p)) return p;
  }
  return null;
}

function isNextApp(appDir: string): boolean {
  if (nextConfigPath(appDir)) return true;
  try {
    const pkg = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"));
    return !!(pkg.dependencies?.next || pkg.devDependencies?.next);
  } catch {
    return false;
  }
}

/** Header names already present in next.config (checked by name, case-insensitive). */
function nextConfiguredHeaders(appDir: string): Set<string> {
  const present = new Set<string>();
  const file = nextConfigPath(appDir);
  if (!file) return present;
  const raw = readFileSync(file, "utf8").toLowerCase();
  for (const name of Object.keys(REQUIRED)) if (raw.includes(name)) present.add(name);
  return present;
}

function headersMethod(names: string[]): string {
  const entries = names
    .map((n) => `      { key: '${canonical(n)}', value: ${JSON.stringify(REQUIRED[n].value)} },`)
    .join("\n");
  return `  /* vibegate-headers */\n  async headers() {\n    return [{ source: '/(.*)', headers: [\n${entries}\n    ] }]\n  },`;
}

/** Idempotently inject all required headers into next.config's config object.
 *  Returns false if the config shape isn't recognized (fix then can't apply). */
function ensureNextHeaders(appDir: string): boolean {
  const names = Object.keys(REQUIRED);
  let file = nextConfigPath(appDir);
  if (!file) {
    file = join(appDir, "next.config.mjs");
    writeFileSync(
      file,
      `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n${headersMethod(names)}\n}\nexport default nextConfig\n`,
    );
    return true;
  }
  const raw = readFileSync(file, "utf8");
  if (raw.includes("vibegate-headers")) return true; // already injected
  const m = raw.match(/(?:const\s+\w+\s*=\s*|export\s+default\s*)\{/);
  if (!m) return false; // unrecognized shape — don't guess
  const idx = raw.indexOf(m[0]) + m[0].length;
  writeFileSync(file, raw.slice(0, idx) + "\n" + headersMethod(names) + raw.slice(idx));
  return true;
}
// -----------------------------------------------------------------------------

export const securityHeaders: Check = {
  id: "security-headers",
  exposureClass: "missing-security-header",
  surface: "pre", // detect works on both; primary/cheap surface is pre
  maxRung: "auto-fix",
  requiresHumanDecision: false,
  forcesRedeploy: false,

  async detect(ctx: CheckContext): Promise<Finding[]> {
    if (ctx.surface === "post") {
      if (!ctx.previewUrl) return [];
      const res = await fetch(ctx.previewUrl, { redirect: "follow" });
      const present = new Set<string>();
      res.headers.forEach((_v, k) => present.add(k.toLowerCase()));
      return missingFromSet(present);
    }
    if (!ctx.appDir) return [];
    // Next.js honors next.config headers, not vercel.json/_headers.
    const present = isNextApp(ctx.appDir)
      ? nextConfiguredHeaders(ctx.appDir)
      : configuredHeaders(ctx.appDir, ctx.platform);
    return missingFromSet(present);
  },

  async fix(ctx: CheckContext, finding: Finding): Promise<FixResult> {
    // Only the pre-surface fix is safe & free (a config write). Post-surface
    // header gaps are resolved by the pre-fix + redeploy path.
    if (ctx.surface !== "pre" || !ctx.appDir) {
      return { applied: false, reverified: false, note: "no safe post-surface fix" };
    }
    const name = finding.key.replace(/^header:/, "");

    if (isNextApp(ctx.appDir)) {
      // Effective fix: write into next.config (a _headers file is ignored here).
      // Idempotent — the first finding injects all headers; the rest confirm.
      if (!ensureNextHeaders(ctx.appDir)) {
        return { applied: false, reverified: false, note: "unrecognized next.config shape" };
      }
      const ok = nextConfiguredHeaders(ctx.appDir).has(name);
      return {
        applied: ok,
        reverified: ok,
        brokeApp: false,
        note: ok ? "injected into next.config headers()" : "next.config injection failed",
      };
    }

    injectHeaders(ctx.appDir, ctx.platform, [name]);
    const nowConfigured = configuredHeaders(ctx.appDir, ctx.platform);
    return {
      applied: true,
      reverified: nowConfigured.has(name), // header is present after injection
      brokeApp: false, // header injection cannot break a build; smoke test in harness confirms
      note: `injected ${name}`,
    };
  },
};
