// Check: cors-tighten — permissive CORS that lets any site read responses
// (design §4.2). The mid-frontier case: the fix rarely breaks a same-origin
// app (low breakage), but it needs a value — WHICH origin to allow — that
// isn't always known. So its friction is a human decision, not wall-clock:
//   - allowed origin supplied  -> auto-fix, requiresHumanDecision=false
//   - allowed origin unknown   -> block + guide, requiresHumanDecision=true
// That split is exactly what makes cors interesting on the speed–safety curve.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, extname, basename } from "node:path";
import type { Check, CheckContext, Finding, FixResult } from "../types.js";
import { headerConfigFile } from "../adapters.js";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next", "coverage"]);
const CODE_EXT = new Set([".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx"]);
const PROBE_ORIGIN = "https://vibegate-probe.example";

interface CorsRule {
  kind: string;
  re: RegExp;
}

// Same-line source patterns for permissive CORS.
const CODE_RULES: CorsRule[] = [
  { kind: "header-wildcard", re: /access-control-allow-origin["']\s*[:,]\s*["']\*["']/i },
  { kind: "cors-bare", re: /\bcors\(\s*\)/ }, // express cors() defaults to "*"
  { kind: "cors-origin-star", re: /\borigin\s*:\s*["']\*["']/ },
  { kind: "cors-origin-true", re: /\borigin\s*:\s*true\b/ }, // reflects request origin
];

function hasCredentials(text: string): boolean {
  return /access-control-allow-credentials["']?\s*[:,]\s*["']?true/i.test(text);
}

function listCodeFiles(appDir: string): string[] {
  const out: string[] = [];
  const walk = (rel: string) => {
    for (const e of readdirSync(join(appDir, rel), { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(join(rel, e.name));
      } else if (CODE_EXT.has(extname(e.name))) {
        out.push(join(rel, e.name));
      }
    }
  };
  walk("");
  return out;
}

function scanCode(appDir: string): Finding[] {
  const findings: Finding[] = [];
  for (const rel of listCodeFiles(appDir)) {
    const text = readFileSync(join(appDir, rel), "utf8");
    const credentials = hasCredentials(text);
    text.split("\n").forEach((line, i) => {
      for (const rule of CODE_RULES) {
        if (rule.re.test(line)) {
          findings.push({
            checkId: "cors-tighten",
            exposureClass: "permissive-cors",
            key: `cors:${rule.kind}:${rel}:${i + 1}`,
            detail: `permissive CORS (${rule.kind})${credentials ? " + credentials" : ""}`,
            // wildcard + credentials is the credentialed-read worst case.
            severity: credentials ? 0.95 : 0.7,
            location: `${rel}:${i + 1}`,
            evidence: line.trim(),
          });
          break; // one finding per line
        }
      }
    });
  }
  return findings;
}

function scanConfig(appDir: string, platform: string): Finding[] {
  const file = headerConfigFile(platform as any, appDir);
  if (!existsSync(file)) return [];
  const raw = readFileSync(file, "utf8");
  const findings: Finding[] = [];

  if (file.endsWith("vercel.json")) {
    try {
      const json = JSON.parse(raw);
      (json.headers ?? []).forEach((rule: any) => {
        (rule.headers ?? []).forEach((h: any) => {
          if (
            String(h?.key).toLowerCase() === "access-control-allow-origin" &&
            h?.value === "*"
          ) {
            findings.push({
              checkId: "cors-tighten",
              exposureClass: "permissive-cors",
              key: `cors:config:${basename(file)}:${rule.source ?? "*"}`,
              detail: "permissive CORS (config wildcard)",
              severity: 0.7,
              location: basename(file),
              evidence: "*",
            });
          }
        });
      });
    } catch {
      /* malformed config: ignore */
    }
  } else {
    raw.split("\n").forEach((line, i) => {
      if (/access-control-allow-origin:\s*\*/i.test(line)) {
        findings.push({
          checkId: "cors-tighten",
          exposureClass: "permissive-cors",
          key: `cors:config:${basename(file)}:${i + 1}`,
          detail: "permissive CORS (config wildcard)",
          severity: 0.7,
          location: `${basename(file)}:${i + 1}`,
          evidence: line.trim(),
        });
      }
    });
  }
  return findings;
}

/** Rewrite the permissive forms in a source file to a fixed origin. */
function tightenSource(text: string, origin: string): string {
  return text
    .replace(/(access-control-allow-origin["']\s*[:,]\s*["'])\*(["'])/gi, `$1${origin}$2`)
    .replace(/(access-control-allow-origin:\s*)\*/gi, `$1${origin}`)
    .replace(/\bcors\(\s*\)/g, `cors({ origin: "${origin}" })`)
    .replace(/(\borigin\s*:\s*["'])\*(["'])/g, `$1${origin}$2`)
    .replace(/(\borigin\s*:\s*)true\b/g, `$1"${origin}"`);
}

export function makeCorsCheck(allowedOrigin?: string): Check {
  const hasOrigin = !!allowedOrigin;
  return {
    id: "cors-tighten",
    exposureClass: "permissive-cors",
    surface: "pre",
    maxRung: hasOrigin ? "auto-fix" : "block",
    requiresHumanDecision: !hasOrigin, // the "which origin?" decision is the friction
    forcesRedeploy: !hasOrigin,

    async detect(ctx: CheckContext): Promise<Finding[]> {
      if (ctx.surface === "post") {
        if (!ctx.previewUrl) return [];
        const res = await fetch(ctx.previewUrl, { headers: { Origin: PROBE_ORIGIN } });
        const acao = res.headers.get("access-control-allow-origin");
        const acac = res.headers.get("access-control-allow-credentials");
        if (acao === "*" || acao === PROBE_ORIGIN) {
          return [
            {
              checkId: "cors-tighten",
              exposureClass: "permissive-cors",
              key: `cors:live:${new URL(ctx.previewUrl).pathname}`,
              detail: `live CORS allows ${acao === "*" ? "any origin" : "reflected origin"}${
                acac === "true" ? " with credentials" : ""
              }`,
              severity: acac === "true" ? 0.95 : 0.7,
              location: ctx.previewUrl,
            },
          ];
        }
        return [];
      }
      if (!ctx.appDir) return [];
      return [...scanConfig(ctx.appDir, ctx.platform), ...scanCode(ctx.appDir)];
    },

    ...(hasOrigin
      ? {
          async fix(ctx: CheckContext, finding: Finding): Promise<FixResult> {
            if (!ctx.appDir || !finding.location) {
              return { applied: false, reverified: false, note: "no context" };
            }
            const rel = finding.location.split(":")[0];
            const file = join(ctx.appDir, rel);
            if (!existsSync(file)) {
              return { applied: false, reverified: false, note: "file not found" };
            }
            if (file.endsWith("vercel.json")) {
              const json = JSON.parse(readFileSync(file, "utf8"));
              for (const rule of json.headers ?? []) {
                for (const h of rule.headers ?? []) {
                  if (
                    String(h.key).toLowerCase() === "access-control-allow-origin" &&
                    h.value === "*"
                  ) {
                    h.value = allowedOrigin;
                  }
                }
              }
              writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
            } else {
              const before = readFileSync(file, "utf8");
              const after = tightenSource(before, allowedOrigin!);
              if (after === before) {
                // A sibling finding may have already tightened this file.
                const gone = scanCode(ctx.appDir)
                  .concat(scanConfig(ctx.appDir, ctx.platform))
                  .every((f) => f.location?.split(":")[0] !== rel);
                return gone
                  ? { applied: true, reverified: true, brokeApp: undefined, note: "already tightened (same file)" }
                  : { applied: false, reverified: false, note: "no permissive form matched" };
              }
              writeFileSync(file, after);
            }
            // reverify at file granularity: the permissive form is gone from it.
            const gone = scanCode(ctx.appDir)
              .concat(scanConfig(ctx.appDir, ctx.platform))
              .every((f) => f.location?.split(":")[0] !== rel);
            return {
              applied: true,
              reverified: gone,
              // Restricting to one origin can break a genuinely cross-origin
              // app; same-origin apps are unaffected. Confirmed by smoke.
              brokeApp: undefined,
              note: `restricted CORS to ${allowedOrigin}`,
            };
          },
        }
      : {}),
  };
}
