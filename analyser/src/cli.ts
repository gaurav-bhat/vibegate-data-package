#!/usr/bin/env -S npx tsx
// vibegate CLI — research harness entry point.
//   vibegate check  <app-dir> [--fix] [--tool=v0] [--out=runs.jsonl]
//   vibegate verify <preview-url> [--tool=v0] [--out=runs.jsonl]
//
// `check` runs pre-surface checks against a built repo (the cheap fix path).
// `verify` runs post-surface checks against a live preview URL — restricted to
// URLs on the local deploy allowlist so we only ever probe our own apps.
import { basename, resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { detectPlatform } from "./adapters.js";
import { runCheck, type AppMeta } from "./harness.js";
import { preChecks, postChecks, type SecretMode } from "./registry.js";
import { runSmoke, loadSmokeSpec } from "./smoke.js";
import type { CheckContext } from "./types.js";

interface Args {
  cmd: string;
  target?: string;
  fix: boolean;
  tool: string;
  out?: string;
  secretMode: SecretMode;
  smoke: boolean;
  allowedOrigin?: string;
}

function parseArgs(argv: string[]): Args {
  const [cmd, target, ...rest] = argv;
  const args: Args = {
    cmd,
    target,
    fix: false,
    tool: "unknown",
    secretMode: "block",
    smoke: false,
  };
  for (const a of rest) {
    if (a === "--fix") args.fix = true;
    else if (a === "--smoke") args.smoke = true;
    else if (a.startsWith("--tool=")) args.tool = a.slice("--tool=".length);
    else if (a.startsWith("--out=")) args.out = a.slice("--out=".length);
    else if (a.startsWith("--secret-mode=")) {
      args.secretMode = a.slice("--secret-mode=".length) as SecretMode;
    } else if (a.startsWith("--allowed-origin=")) {
      args.allowedOrigin = a.slice("--allowed-origin=".length);
    }
  }
  return args;
}

/** Ethics guard: `verify` only accepts preview URLs listed in the local
 *  deploy manifest, enforcing "scan only our own apps" in code. */
function assertOwnUrl(url: string): void {
  const manifest = resolve(".deploy-manifest.json");
  if (!existsSync(manifest)) {
    throw new Error(
      "Refusing to probe: no .deploy-manifest.json found. Add the URL to the " +
        "manifest of apps you deployed yourself before verifying.",
    );
  }
  const allow: string[] = JSON.parse(readFileSync(manifest, "utf8")).urls ?? [];
  if (!allow.some((u) => url.startsWith(u))) {
    throw new Error(`Refusing to probe ${url}: not in .deploy-manifest.json allowlist.`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.cmd === "check") {
    if (!args.target) throw new Error("usage: vibegate check <app-dir> [--fix]");
    const appDir = resolve(args.target);
    const platform = detectPlatform(appDir);
    const app: AppMeta = { appId: basename(appDir), tool: args.tool };
    const ctx: CheckContext = { surface: "pre", appDir, platform };

    const smoke = args.smoke ? loadSmokeSpec(appDir) : undefined;
    console.log(
      `# vibegate check  app=${app.appId} platform=${platform} ` +
        `fix=${args.fix} secret-mode=${args.secretMode} smoke=${!!smoke}`,
    );
    let deployBlocked = false;
    for (const check of preChecks({
      secretMode: args.secretMode,
      allowedOrigin: args.allowedOrigin,
    })) {
      const variant = check.id.includes(":") ? check.id.split(":")[1] : "default";
      const s = await runCheck(check, ctx, app, {
        applyFix: args.fix,
        variant,
        outFile: args.out,
        smoke,
      });
      const measured =
        s.brokeAppMeasured == null ? "" : ` broke-app(measured)=${s.brokeAppMeasured}`;
      console.log(
        `  ${check.id}: found=${s.findingsBefore} ` +
          `removed=${s.findingsRemoved} +${s.addedSecondsTotal}s${measured}`,
      );
      // A "block"-rung check with findings fails the deploy (its faithful
      // real-world effect) and prints guidance for the human to act on.
      if (check.maxRung === "block" && s.findingsBefore > 0) {
        deployBlocked = true;
        for (const f of s.detectedFindings) {
          const hint =
            f.exposureClass === "client-secret"
              ? "move to a server env var"
              : f.exposureClass === "permissive-cors"
                ? "set an explicit origin (--allowed-origin=...)"
                : f.exposureClass === "unauthenticated-endpoint"
                  ? "add an authentication check to this route"
                  : "resolve before deploy";
          console.log(`    BLOCK ${f.location}  ${f.detail} — ${hint}`);
        }
      }
    }
    if (deployBlocked) {
      console.log("# deploy BLOCKED: resolve the findings above, then redeploy");
      process.exitCode = 1;
    }
    return;
  }

  if (args.cmd === "verify") {
    if (!args.target) throw new Error("usage: vibegate verify <preview-url>");
    assertOwnUrl(args.target);
    const platform = detectPlatform(process.cwd());
    const app: AppMeta = { appId: new URL(args.target).hostname, tool: args.tool };
    const ctx: CheckContext = { surface: "post", previewUrl: args.target, platform };

    console.log(`# vibegate verify url=${args.target} platform=${platform}`);
    for (const check of postChecks().length ? postChecks() : preChecks()) {
      const s = await runCheck(check, ctx, app, { applyFix: false, outFile: args.out });
      console.log(`  ${check.id}: found=${s.findingsBefore} +${s.addedSecondsTotal}s`);
    }
    return;
  }

  if (args.cmd === "smoke") {
    if (!args.target) throw new Error("usage: vibegate smoke <app-dir>");
    const appDir = resolve(args.target);
    const spec = loadSmokeSpec(appDir);
    if (!spec) throw new Error(`no vibegate.smoke.json in ${appDir}`);
    const result = await runSmoke(spec);
    console.log(`# vibegate smoke  app=${basename(appDir)}  ok=${result.ok}`);
    for (const f of result.failures) console.log(`  FAIL ${f}`);
    if (!result.ok) process.exitCode = 1;
    return;
  }

  console.log(
    "vibegate — deployment safety gate (research harness)\n\n" +
      "  vibegate check  <app-dir>    [--fix] [--secret-mode=block|auto-move|both]\n" +
      "                               [--allowed-origin=URL] [--smoke]\n" +
      "                               [--tool=NAME] [--out=FILE.jsonl]\n" +
      "  vibegate verify <preview-url>        [--tool=NAME] [--out=FILE.jsonl]\n" +
      "  vibegate smoke  <app-dir>    run the app's vibegate.smoke.json probes\n",
  );
  process.exitCode = args.cmd ? 1 : 0;
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exitCode = 1;
});
