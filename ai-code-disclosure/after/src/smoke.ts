// Runtime smoke test: does the app actually still work? This turns the
// client-secret check's `brokeApp` from a static prediction into a measured
// signal (design §5). Two modes:
//   - local: spawn the app's start command, wait until it answers, probe routes
//   - remote: probe a live preview URL directly (post-deploy surface)
//
// IMPORTANT LIMITATION (report this in the paper): an HTTP-level smoke test
// detects server/route breakage — a route that 500s or a build that fails to
// boot. It does NOT catch *silent client-side* breakage, where a secret pulled
// out of browser code leaves the page returning 200 while a feature is quietly
// dead. Confirming that class requires a browser-level probe (console errors /
// feature assertion). The interface below accepts content assertions so a
// browser runner can be slotted in later without changing callers.
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { runBrowserProbe, type BrowserAssertion } from "./browser-probe.js";

export interface RouteAssertion {
  path: string;
  expectStatus?: number;
  expectIncludes?: string;
  expectExcludes?: string;
}

export interface SmokeSpec {
  /** Remote mode: probe this base URL (post-deploy). */
  url?: string;
  /** Local mode: how to boot the app before probing. */
  start?: {
    cmd: string; // split on spaces; e.g. "node server.js"
    cwd: string;
    port: number;
    readyPath?: string;
    env?: Record<string, string>;
  };
  routes: RouteAssertion[];
  /** Browser-level assertions for silent client-side breakage (needs Chrome). */
  browserRoutes?: BrowserAssertion[];
  timeoutMs?: number;
}

export interface SmokeResult {
  ok: boolean;
  failures: string[];
}

/** Load a `vibegate.smoke.json` from an app dir, resolving the local start cwd
 *  against that dir so the app boots from the right place. */
export function loadSmokeSpec(appDir: string): SmokeSpec | undefined {
  const file = join(appDir, "vibegate.smoke.json");
  if (!existsSync(file)) return undefined;
  const spec: SmokeSpec = JSON.parse(readFileSync(file, "utf8"));
  if (spec.start) spec.start.cwd = resolve(appDir, spec.start.cwd ?? ".");
  return spec;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function waitReady(url: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
      return true; // any HTTP response means the server is up
    } catch {
      await sleep(150);
    }
  }
  return false;
}

export async function runSmoke(spec: SmokeSpec): Promise<SmokeResult> {
  const timeoutMs = spec.timeoutMs ?? 8000;
  const base = spec.url ?? `http://localhost:${spec.start?.port ?? 8787}`;
  let child: ReturnType<typeof spawn> | undefined;

  try {
    if (spec.start) {
      const [cmd, ...args] = spec.start.cmd.split(" ");
      child = spawn(cmd, args, {
        cwd: spec.start.cwd,
        env: { ...process.env, ...(spec.start.env ?? {}) },
        stdio: "ignore",
      });
      const ready = await waitReady(base + (spec.start.readyPath ?? "/"), timeoutMs);
      if (!ready) return { ok: false, failures: ["server did not become ready"] };
    }

    const failures: string[] = [];
    for (const r of spec.routes) {
      try {
        const res = await fetch(base + r.path);
        const body = await res.text();
        if (r.expectStatus != null && res.status !== r.expectStatus) {
          failures.push(`${r.path}: status ${res.status} != ${r.expectStatus}`);
        }
        if (r.expectIncludes && !body.includes(r.expectIncludes)) {
          failures.push(`${r.path}: body missing "${r.expectIncludes}"`);
        }
        if (r.expectExcludes && body.includes(r.expectExcludes)) {
          failures.push(`${r.path}: body contains "${r.expectExcludes}"`);
        }
      } catch (e) {
        failures.push(`${r.path}: ${(e as Error).message}`);
      }
    }

    // Browser-level pass: catches silent client-side breakage the HTTP probes
    // above cannot see (page 200s but a feature is dead).
    if (spec.browserRoutes?.length) {
      const b = await runBrowserProbe(base, spec.browserRoutes);
      failures.push(...b.failures);
    }

    return { ok: failures.length === 0, failures };
  } finally {
    if (child?.pid) {
      try {
        child.kill("SIGKILL");
      } catch {
        /* already gone */
      }
      await sleep(250); // let the port free before the next boot
    }
  }
}
