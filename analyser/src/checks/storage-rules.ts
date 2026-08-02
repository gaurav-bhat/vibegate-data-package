// Check: storage-rules — default-open database/storage rules (design §4.4).
// Firebase/Supabase quickstarts routinely ship world-readable/writable rules
// ("allow read, write: if true", RLS disabled). This populates a frontier axis
// no other check does: the fix is a deterministic auto-fix (tighten to
// auth-required), but it can only take effect via a SEPARATE rules deploy —
// so forcesRedeploy=true. Auto-fixable, yet not free: extra-deploy friction.
//
// Breakage note: tightening to "auth != null" breaks an app that deliberately
// serves unauthenticated reads (a public-data app). Predicted brokeApp is left
// undefined and deferred to the smoke test.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, basename, extname } from "node:path";
import type { Check, CheckContext, Finding, FixResult } from "../types.js";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next", "coverage"]);

// Firebase security-rules: `allow read, write: if true;` (or a bare `allow`).
const OPEN_RULE = /allow\s+[a-z,\s]*:\s*if\s+true\b/i;
const BARE_ALLOW = /allow\s+(read|write)(\s*,\s*(read|write))?\s*;/i;
// Supabase / Postgres: RLS turned off.
const RLS_DISABLE = /disable\s+row\s+level\s+security/i;
// The more common Supabase "make it public" idiom: RLS is ENABLED but the
// policy condition is `USING (true)` / `WITH CHECK (true)` — so anyone with the
// public anon key can read/write/delete. Enabling RLS makes it LOOK secure; the
// permissive policy is what actually opens the table.
const PERMISSIVE_POLICY = /create\s+policy[\s\S]*?(using|with\s+check)\s*\(\s*true\s*\)/i;

function listRuleFiles(appDir: string): string[] {
  const out: string[] = [];
  const walk = (rel: string) => {
    for (const e of readdirSync(join(appDir, rel), { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(join(rel, e.name));
      } else {
        const name = e.name.toLowerCase();
        if (
          extname(name) === ".rules" ||
          name === "database.rules.json" ||
          extname(name) === ".sql"
        ) {
          out.push(join(rel, e.name));
        }
      }
    }
  };
  walk("");
  return out;
}

/** Recursively find `.read`/`.write` set to `true` in a Realtime-DB rules JSON. */
function openJsonRules(node: unknown, path: string): string[] {
  const hits: string[] = [];
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if ((k === ".read" || k === ".write") && (v === true || v === "true")) {
        hits.push(`${path}${k}`);
      } else {
        hits.push(...openJsonRules(v, `${path}${k}/`));
      }
    }
  }
  return hits;
}

function scan(appDir: string): Finding[] {
  const findings: Finding[] = [];
  for (const rel of listRuleFiles(appDir)) {
    const text = readFileSync(join(appDir, rel), "utf8");
    const name = basename(rel).toLowerCase();

    if (name === "database.rules.json") {
      try {
        for (const where of openJsonRules(JSON.parse(text), "")) {
          findings.push(mk(rel, `Realtime DB rule open: ${where}`, 0.9));
        }
      } catch {
        /* malformed rules json */
      }
      continue;
    }
    if (extname(name) === ".sql") {
      if (RLS_DISABLE.test(text)) findings.push(mk(rel, "Row Level Security disabled", 0.9));
      // Per-statement so multi-line CREATE POLICY blocks are caught and the
      // operation (read vs write/delete) sets severity.
      for (const stmt of text.split(";")) {
        if (PERMISSIVE_POLICY.test(stmt)) {
          const op = (stmt.match(/for\s+(select|insert|update|delete|all)/i)?.[1] ?? "all").toLowerCase();
          const write = op !== "select";
          findings.push(
            mk(
              rel,
              `permissive RLS policy (${op}) — public ${write ? "write/delete via USING(true)" : "read via USING(true)"}`,
              write ? 0.95 : 0.5,
            ),
          );
        }
      }
      continue;
    }
    // Firebase security-rules text
    text.split("\n").forEach((line, i) => {
      if (OPEN_RULE.test(line) || BARE_ALLOW.test(line)) {
        findings.push(mk(`${rel}:${i + 1}`, "storage rule open to the public", 0.9));
      }
    });
  }
  return findings;
}

function mk(location: string, detail: string, severity: number): Finding {
  return {
    checkId: "storage-rules",
    exposureClass: "open-storage-rule",
    key: `storage:${location}`,
    detail,
    severity,
    location,
  };
}

function tightenText(text: string): string {
  return text
    .replace(/(allow\s+[a-z,\s]*:\s*if\s+)true\b/gi, "$1request.auth != null")
    .replace(/(allow\s+(?:read|write)(?:\s*,\s*(?:read|write))?)\s*;/gi, "$1: if request.auth != null;")
    .replace(/disable(\s+row\s+level\s+security)/gi, "enable$1")
    // Permissive RLS policy -> require an authenticated user. Deterministic
    // safe default; may break an intentionally-public read (deferred to smoke).
    .replace(/((?:using|with\s+check)\s*\(\s*)true(\s*\))/gi, "$1auth.uid() is not null$2");
}

function tightenJson(node: unknown): unknown {
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] =
        (k === ".read" || k === ".write") && (v === true || v === "true")
          ? "auth != null"
          : tightenJson(v);
    }
    return out;
  }
  return node;
}

export const storageRules: Check = {
  id: "storage-rules",
  exposureClass: "open-storage-rule",
  surface: "pre",
  maxRung: "auto-fix",
  requiresHumanDecision: false, // the auth-required default is deterministic
  forcesRedeploy: true, // rules ship via a separate deploy — the new frontier axis

  async detect(ctx: CheckContext): Promise<Finding[]> {
    if (ctx.surface !== "pre" || !ctx.appDir) return [];
    return scan(ctx.appDir);
  },

  async fix(ctx: CheckContext, finding: Finding): Promise<FixResult> {
    if (!ctx.appDir || !finding.location) {
      return { applied: false, reverified: false, note: "no context" };
    }
    const rel = finding.location.split(":")[0];
    const file = join(ctx.appDir, rel);
    const before = readFileSync(file, "utf8");

    let after: string;
    if (basename(rel).toLowerCase() === "database.rules.json") {
      after = JSON.stringify(tightenJson(JSON.parse(before)), null, 2) + "\n";
    } else {
      after = tightenText(before);
    }
    if (after === before) {
      // A sibling finding in the same file may have already tightened it via
      // the whole-file rewrite; if the exposure is gone, this counts as removed.
      const alreadyGone = scan(ctx.appDir).every((f) => f.location?.split(":")[0] !== rel);
      return alreadyGone
        ? { applied: true, reverified: true, brokeApp: undefined, note: "already remediated (same file)" }
        : { applied: false, reverified: false, note: "no open rule matched" };
    }
    writeFileSync(file, after);

    const gone = scan(ctx.appDir).every((f) => f.location?.split(":")[0] !== rel);
    return {
      applied: true,
      reverified: gone,
      brokeApp: undefined, // tightening breaks a public-data app; defer to smoke
      note: "tightened storage rules to require auth",
    };
  },
};
