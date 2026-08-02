// Check: endpoint-auth — API routes that read or mutate data with no auth
// check (design §4.5). This anchors the FAR-RIGHT of the speed–safety frontier:
// there is NO safe auto-fix (a machine cannot write the app's authorization
// logic), so the check has no fix() at all. Its only rungs are detect and
// block; closing the exposure requires a human to write code. Its yield toward
// *automatic* remediation is therefore zero by construction.
//
// Honest caveat (a finding in itself): this is the least precise check. Auth
// can be enforced in many places the heuristic can't see (framework
// middleware, edge config, a gateway), so it trades recall for precision and
// will still produce false positives — the FP rate is a first-class result,
// and the hardest exposure class to remediate is also the hardest to detect.
import { readdirSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";
import type { Check, CheckContext, Finding } from "../types.js";
import { IGNORE_FILES } from "../scan-ignore.js";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".next", "coverage"]);
const CODE_EXT = new Set([".js", ".mjs", ".cjs", ".jsx", ".ts", ".tsx"]);

/** Path looks like a server API route. */
function isRoutePath(rel: string): boolean {
  const p = rel.replace(/\\/g, "/").toLowerCase();
  if (!CODE_EXT.has(extname(p))) return false;
  return (
    /(^|\/)(api|functions)(\/|$)/.test(p) ||
    /(^|\/)(pages|app)\/api\//.test(p) ||
    /\.route\.[jt]sx?$/.test(p)
  );
}

// Next.js Server Actions are the dominant mutation surface in modern generated
// apps — a "use server" file that writes data with no auth is exactly the same
// exposure as an unauthenticated API route, but lives outside app/api/.
const USE_SERVER = /^\s*['"]use server['"]/m;

// TanStack Start server functions (createServerFn) are another remotely-callable
// server surface that lives outside app/api/ and uses no "use server" directive.
// Enumeration-completeness: where we look, not what counts as an exposure.
const SERVER_FN = /\bcreateServerFn\b/;

// Express/Fastify-style route handlers (router.post(...), app.delete(...)) that
// can live in any path (e.g. src/routes/), not just app/api/. The classic
// server surface — Replit and others scaffold Express apps this way.
const EXPRESS_ROUTE = /\b(?:router|app)\.(?:get|post|put|patch|delete)\s*\(/;

// Generous auth indicators: the more we recognize, the FEWER files we flag
// (we only flag when NO auth signal is present). This keeps precision high at
// the cost of recall — a deliberate, documented trade-off.
// NOTE: match INBOUND authorization (a header the route reads to protect
// itself) via `.headers…authorization`, NOT a bare "authorization" — otherwise
// an OUTBOUND `Authorization: Bearer <key>` header the route sends to call a
// third-party API (a proxy route) falsely reads as "this route is protected"
// and hides the denial-of-wallet exposure.
const AUTH = /\b(getServerSession|requireAuth|isAuthenticated|verifyToken|jwt\.verify|getToken|currentUser|withAuth|ensureAuth|checkAuth|clerk|nextauth)\b|\.headers[\s\S]{0,30}authorization|supabase\.auth|req\.(user|session)\b|\bsession\b/i;

// A shared static password compared against an env var is access control, but
// NOT real per-user auth (brute-forceable, shareable). Still a finding — tagged
// as a distinct weak-auth sub-class rather than "no auth" (author's call).
const WEAK_AUTH = /process\.env\.[A-Za-z_]*password/i;

// Evidence the route actually touches data (so a static/empty route isn't flagged).
const DATA_OP = /\b(prisma|knex|mongoose|sequelize|supabase\.from|db\.|collection\(|\.query\(|select|insert|update|delete|readfile|writefile|fs\.)\b|res\.(json|send)\(/i;

// Evidence the route proxies a paid/third-party API. An unauthenticated proxy
// is a denial-of-wallet + abuse exposure (anyone spends your API credits) —
// the class that replaces the leaked key in agentic tools like v0.
const PROXY = /\b(streamText|generateText|createCompletion|openai|anthropic|replicate|togetherai|groq)\b|@ai-sdk|\.chat\.completions|api\.(openai|anthropic)\.com|new Stripe\(/i;

// Object-storage operations (Vercel Blob, S3). An unauthenticated upload route
// is a real write exposure (storage abuse, cost, hosting arbitrary content) —
// but uses put()/putObject rather than db verbs, so it needs its own signal.
const STORAGE = /@vercel\/blob|\bput\(|putobject|deleteobject|getsignedurl|createpresignedpost|\.upload\(|\blist\(/i;

// Evidence the route MUTATES data — the critical residual case.
const WRITE = /\b(insert|update|delete|\.create\(|\.update\(|\.delete\(|\.insert\(|\.remove\(|writefile|post|put|patch|putobject|deleteobject|upload)\b/i;

type ServerKind = "route" | "action" | "server-fn";

/** Server entry points to audit: API routes (by path), Server Actions (the
 *  "use server" directive), and TanStack server functions (createServerFn) —
 *  the remotely-callable server surfaces, tagged so findings read correctly. */
function listServerFiles(appDir: string): { rel: string; kind: ServerKind }[] {
  const out: { rel: string; kind: ServerKind }[] = [];
  const walk = (rel: string) => {
    for (const e of readdirSync(join(appDir, rel), { withFileTypes: true })) {
      const child = join(rel, e.name);
      if (e.isDirectory()) {
        if (!SKIP_DIRS.has(e.name)) walk(child);
        continue;
      }
      if (IGNORE_FILES.has(e.name) || !CODE_EXT.has(extname(e.name))) continue;
      if (isRoutePath(child)) {
        out.push({ rel: child, kind: "route" });
        continue;
      }
      const content = readFileSync(join(appDir, child), "utf8");
      if (USE_SERVER.test(content)) out.push({ rel: child, kind: "action" });
      else if (SERVER_FN.test(content)) out.push({ rel: child, kind: "server-fn" });
      else if (EXPRESS_ROUTE.test(content)) out.push({ rel: child, kind: "route" });
    }
  };
  walk("");
  return out;
}

export const endpointAuth: Check = {
  id: "endpoint-auth",
  exposureClass: "unauthenticated-endpoint",
  surface: "pre",
  maxRung: "block", // detect + block only; a machine cannot write auth logic
  requiresHumanDecision: true,
  forcesRedeploy: true,
  // NOTE: no fix(). This is the point — the far-right frontier anchor.

  async detect(ctx: CheckContext): Promise<Finding[]> {
    // Static enumeration only. A higher-precision live probe (hit each route
    // unauthenticated against seeded data on the post-deploy surface) is
    // future work: it needs a file->URL route map and write-probe safeguards.
    if (ctx.surface !== "pre" || !ctx.appDir) return [];

    const findings: Finding[] = [];
    for (const { rel, kind } of listServerFiles(ctx.appDir)) {
      const text = readFileSync(join(ctx.appDir, rel), "utf8");
      if (AUTH.test(text)) continue; // real (session/token) auth -> don't flag
      const dataOp = DATA_OP.test(text) || STORAGE.test(text);
      const proxy = PROXY.test(text);
      if (!dataOp && !proxy) continue; // exposes nothing sensitive
      const weak = WEAK_AUTH.test(text); // shared-password gate: weaker sub-class

      // Proxy takes precedence: an LLM/paid-API proxy's dominant exposure is
      // denial-of-wallet, regardless of any incidental data-op keyword — this
      // keeps the label consistent across tools (SDK vs raw fetch).
      if (dataOp && !proxy) {
        const write = WRITE.test(text);
        const base = write ? 0.95 : 0.7;
        findings.push({
          checkId: "endpoint-auth",
          exposureClass: "unauthenticated-endpoint",
          key: `endpoint:${rel}`,
          detail: weak
            ? `${kind} gated only by a shared static password — weak auth (${write ? "write" : "read"})`
            : `${kind} touches data with no visible auth check (${write ? "write" : "read"})`,
          severity: weak ? Number((base * 0.6).toFixed(2)) : base,
          location: rel,
        });
      } else {
        // proxy-only: unauthenticated third-party/paid API proxy
        findings.push({
          checkId: "endpoint-auth",
          exposureClass: "unauthenticated-endpoint",
          key: `endpoint:${rel}`,
          detail: weak
            ? `${kind} proxies a paid/third-party API behind only a shared static password — weak auth`
            : `${kind} proxies a paid/third-party API with no auth (denial-of-wallet)`,
          severity: weak ? 0.54 : 0.9,
          location: rel,
        });
      }
    }
    return findings;
  },
};
