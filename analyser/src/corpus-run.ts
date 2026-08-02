// Corpus runner: run the whole gate across a corpus of apps and emit ONE
// combined JSONL for the analysis layer. This is what turns the instrument
// into a study — feed it real generated apps (v0/Lovable/Bolt/Replit/…) and
// `analyze --per-app` gets genuine multi-app data to normalize over.
//
//   npm run corpus -- <corpus.json | corpus-dir> [--out=corpus-runs.jsonl] [--smoke]
//
// Input is either a manifest (per-app tool/platform/options/smoke) or a
// directory whose subfolders are apps (auto-discovered with defaults). Each app
// is copied to a throwaway work dir first, so the gate's --fix never mutates
// the corpus originals.
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { detectPlatform } from "./adapters.js";
import { runCheck, type AppMeta } from "./harness.js";
import { preChecks, type SecretMode } from "./registry.js";
import { loadSmokeSpec } from "./smoke.js";
import type { CheckContext } from "./types.js";

interface AppEntry {
  id: string;
  dir: string;
  tool?: string;
  platform?: string;
  secretMode?: SecretMode;
  allowedOrigin?: string;
  smoke?: boolean;
}

function loadEntries(path: string): { baseDir: string; entries: AppEntry[] } {
  if (path.endsWith(".json")) {
    const manifest = JSON.parse(readFileSync(path, "utf8"));
    return { baseDir: dirname(path), entries: manifest.apps ?? [] };
  }
  // Directory: each immediate subfolder is an app, with defaults.
  const entries = readdirSync(path, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => ({ id: e.name, dir: e.name }) as AppEntry);
  return { baseDir: path, entries };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const path = args.find((a) => !a.startsWith("--"));
  if (!path) throw new Error("usage: corpus-run <corpus.json | corpus-dir> [--out=FILE] [--smoke]");
  const outFile = resolve(args.find((a) => a.startsWith("--out="))?.slice(6) ?? "corpus-runs.jsonl");
  const globalSmoke = args.includes("--smoke");

  const { baseDir, entries } = loadEntries(resolve(path));
  // Fresh combined JSONL for this corpus run.
  rmSync(outFile, { force: true });

  console.log(`# corpus run  apps=${entries.length}  out=${basename(outFile)}\n`);
  let totalRows = 0;

  for (const entry of entries) {
    const appDir = resolve(baseDir, entry.dir);
    if (!existsSync(appDir) || !statSync(appDir).isDirectory()) {
      console.log(`  ${entry.id}: SKIP (missing ${entry.dir})`);
      continue;
    }

    // Copy to a throwaway work dir so --fix never touches the corpus original.
    const work = mkdtempSync(join(tmpdir(), "vibegate-corpus-"));
    const appWork = join(work, entry.id);
    cpSync(appDir, appWork, { recursive: true });

    try {
      // Detect from the actual repo (authoritative) rather than trust the
      // manifest's scaffold guess, which may not be a valid Platform.
      const platform = detectPlatform(appWork);
      const app: AppMeta = { appId: entry.id, tool: entry.tool ?? "unknown" };
      const smoke = (entry.smoke ?? globalSmoke) ? loadSmokeSpec(appWork) : undefined;
      const ctx: CheckContext = { surface: "pre", appDir: appWork, platform };

      let found = 0;
      let removed = 0;
      for (const check of preChecks({ secretMode: entry.secretMode, allowedOrigin: entry.allowedOrigin })) {
        const variant = check.id.includes(":") ? check.id.split(":")[1] : "default";
        const s = await runCheck(check, ctx, app, { applyFix: true, variant, outFile, smoke });
        found += s.findingsBefore;
        removed += s.findingsRemoved;
        totalRows += s.rows.length;
      }
      console.log(
        `  ${entry.id.padEnd(18)} tool=${(entry.tool ?? "unknown").padEnd(8)} platform=${String(platform).padEnd(9)} ` +
          `found=${String(found).padStart(3)} removed=${String(removed).padStart(3)}${smoke ? " [smoke]" : ""}`,
      );
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
  }

  console.log(`\n  wrote ${totalRows} rows to ${outFile}`);
  console.log(`  next: npm run analyze -- ${basename(outFile)} --per-app`);
}

main().catch((err) => {
  console.error(`error: ${err.message}`);
  process.exitCode = 1;
});
