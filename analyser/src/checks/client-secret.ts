// Check: client-secret — secrets shipped in client-side code (design §4.3).
// This is the paper's pivotal check: it tests whether auto-fix can reach a
// HARD exposure class cheaply. Implemented as two variants measured separately:
//
//   block   — detect + block the deploy, print file:line + guidance. Zero code
//             change, zero break risk, but removes nothing automatically
//             (a non-expert must act). maxRung = "block".
//   auto-move — rewrite the literal to a process.env reference and re-verify.
//             Reaches maxRung "auto-fix", but a secret moved out of *client*
//             code is no longer available in the browser, so the app breaks.
//             We predict brokeApp via a client-vs-server context heuristic;
//             the runtime smoke test (post-deploy) will later confirm it.
import { readdirSync, readFileSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { join, extname, basename } from "node:path";
import type { Check, CheckContext, Finding, FixResult } from "../types.js";
import { IGNORE_FILES } from "../scan-ignore.js";

type Variant = "block" | "auto-move";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next", "coverage"]);
const CLIENT_EXT = new Set([
  ".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx", ".html", ".json", ".vue", ".svelte",
]);

interface Pattern {
  provider: string;
  env: string; // suggested env var name for the auto-move fix
  severity: number;
  re: RegExp;
}

// High-precision provider patterns. Ordered; first match on a token wins.
const PATTERNS: Pattern[] = [
  { provider: "stripe-secret", env: "STRIPE_SECRET_KEY", severity: 1.0, re: /sk_live_[0-9a-zA-Z]{16,}/g },
  { provider: "stripe-restricted", env: "STRIPE_RESTRICTED_KEY", severity: 0.9, re: /rk_live_[0-9a-zA-Z]{16,}/g },
  { provider: "aws-access-key", env: "AWS_ACCESS_KEY_ID", severity: 1.0, re: /AKIA[0-9A-Z]{16}/g },
  { provider: "openai", env: "OPENAI_API_KEY", severity: 0.9, re: /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g },
  { provider: "google-api-key", env: "GOOGLE_API_KEY", severity: 0.8, re: /AIza[0-9A-Za-z_-]{35}/g },
  { provider: "github-token", env: "GITHUB_TOKEN", severity: 0.9, re: /gh[pousr]_[0-9A-Za-z]{36}/g },
  { provider: "slack-token", env: "SLACK_TOKEN", severity: 0.9, re: /xox[baprs]-[0-9A-Za-z-]{10,}/g },
];

const JWT_RE = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const PLACEHOLDER = /(example|your[_-]?|xxxx|changeme|placeholder|<.*>|dummy|test[_-]?key)/i;

/** Env-file patterns a .gitignore commonly uses to exclude local secrets. */
function gitignoredEnvNames(appDir: string): (name: string) => boolean {
  const gi = join(appDir, ".gitignore");
  if (!existsSync(gi)) return () => false;
  const patterns = readFileSync(gi, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .filter((l) => l.includes(".env") || l === "*.local");
  return (name: string) =>
    patterns.some((p) => {
      const rx = new RegExp(
        "^" + p.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$",
      );
      return rx.test(name);
    });
}

function isClientFile(rel: string, envIgnored: (n: string) => boolean): boolean {
  const b = basename(rel);
  if (IGNORE_FILES.has(b)) return false; // never scan study metadata
  if (b.startsWith(".env")) {
    // A gitignored .env.local is the CORRECT place for a secret (never
    // committed, never shipped to the browser) — not an exposure. Only flag
    // env files that would actually be committed.
    return !envIgnored(b);
  }
  return CLIENT_EXT.has(extname(rel));
}

function listFiles(appDir: string): string[] {
  const out: string[] = [];
  const envIgnored = gitignoredEnvNames(appDir);
  const walk = (rel: string) => {
    for (const entry of readdirSync(join(appDir, rel), { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(join(rel, entry.name));
      } else if (isClientFile(join(rel, entry.name), envIgnored)) {
        out.push(join(rel, entry.name));
      }
    }
  };
  walk("");
  return out;
}

/** A secret in a server-only file (API route, server component, edge function)
 *  can be moved to process.env safely; a secret in browser-shipped code cannot
 *  — moving it there breaks the app. This heuristic predicts brokeApp for the
 *  auto-move variant; the post-deploy smoke test validates it later. */
function isServerContext(rel: string): boolean {
  const p = rel.replace(/\\/g, "/").toLowerCase();
  return (
    /(^|\/)(api|server|functions|edge)(\/|$)/.test(p) ||
    /\.server\.[jt]sx?$/.test(p) ||
    /(^|\/)middleware\.[jt]s$/.test(p) ||
    /(^|\/)(pages|app)\/api\//.test(p)
  );
}

function decodeJwtRole(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json).role ?? null;
  } catch {
    return null;
  }
}

function scanFile(appDir: string, rel: string): Finding[] {
  const findings: Finding[] = [];
  const lines = readFileSync(join(appDir, rel), "utf8").split("\n");
  const where = isServerContext(rel) ? "server" : "client-shipped";

  lines.forEach((line, i) => {
    const claimed = new Set<string>(); // spans already attributed to a provider

    for (const p of PATTERNS) {
      for (const m of line.matchAll(p.re)) {
        const val = m[0];
        if (PLACEHOLDER.test(val)) continue;
        claimed.add(val);
        findings.push({
          checkId: "client-secret",
          exposureClass: "client-secret",
          key: `secret:${p.provider}:${rel}:${i + 1}`,
          detail: `${p.provider} key hardcoded in ${where} file`,
          severity: p.severity,
          location: `${rel}:${i + 1}`,
          evidence: val,
        });
      }
    }

    // Supabase (and similar) JWTs: anon keys are safe to ship; service_role
    // keys are a critical exposure. Only flag service_role.
    for (const m of line.matchAll(JWT_RE)) {
      const token = m[0];
      if (claimed.has(token)) continue;
      if (decodeJwtRole(token) === "service_role") {
        findings.push({
          checkId: "client-secret",
          exposureClass: "client-secret",
          key: `secret:supabase-service-role:${rel}:${i + 1}`,
          detail: `Supabase service_role JWT hardcoded in ${where} file`,
          severity: 1.0,
          location: `${rel}:${i + 1}`,
          evidence: token,
        });
      }
    }
  });

  return findings;
}

function envNameFor(finding: Finding): string {
  const provider = finding.key.split(":")[1] ?? "SECRET";
  const known = PATTERNS.find((p) => p.provider === provider);
  if (known) return known.env;
  return provider.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

function makeCheck(variant: Variant): Check {
  return {
    id: `client-secret:${variant}`,
    exposureClass: "client-secret",
    surface: "pre",
    maxRung: variant === "block" ? "block" : "auto-fix",
    // block: a human must move the secret and redeploy.
    // auto-move: rewritten in place pre-deploy, no human step, no extra deploy.
    requiresHumanDecision: variant === "block",
    forcesRedeploy: variant === "block",

    async detect(ctx: CheckContext): Promise<Finding[]> {
      if (ctx.surface !== "pre" || !ctx.appDir) return [];
      return listFiles(ctx.appDir).flatMap((rel) => scanFile(ctx.appDir!, rel));
    },

    // block variant is detect-and-block: no code change. Omit fix() entirely
    // so the harness records fixApplied=false and the CLI blocks the deploy.
    ...(variant === "block"
      ? {}
      : {
          async fix(ctx: CheckContext, finding: Finding): Promise<FixResult> {
            if (!ctx.appDir || !finding.evidence || !finding.location) {
              return { applied: false, reverified: false, note: "insufficient context" };
            }
            const rel = finding.location.split(":")[0];
            const file = join(ctx.appDir, rel);
            const before = readFileSync(file, "utf8");
            const env = envNameFor(finding);
            const ref = `process.env.${env}`;
            // Replace the quoted literal so the result is valid code (a bare
            // env reference), not another string literal. Fall back to a raw
            // replace if the secret isn't wrapped in quotes.
            let after = before;
            for (const q of ['"', "'", "`"]) {
              const quoted = q + finding.evidence + q;
              if (before.includes(quoted)) {
                after = before.split(quoted).join(ref);
                break;
              }
            }
            if (after === before) after = before.split(finding.evidence).join(ref);
            if (after === before) {
              return { applied: false, reverified: false, note: "literal not found" };
            }
            writeFileSync(file, after);
            appendFileSync(join(ctx.appDir, ".env.local"), `${env}=${finding.evidence}\n`);

            const reverified = !readFileSync(file, "utf8").includes(finding.evidence);
            // Predicted breakage: a secret pulled from client code is now
            // undefined in the browser. Confirmed later by the runtime smoke test.
            const brokeApp = !isServerContext(rel);
            return {
              applied: true,
              reverified,
              brokeApp,
              note: brokeApp
                ? `moved to process.env.${env}; PREDICTED BREAK (client-context secret)`
                : `moved to process.env.${env} (server context)`,
            };
          },
        }),
  };
}

export const clientSecretBlock = makeCheck("block");
export const clientSecretAutoMove = makeCheck("auto-move");
