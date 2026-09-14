// Normalize existing corpus app-meta.json files:
//   - null out unfilled deploy placeholders (allowedOrigin / previewUrl that
//     still start with "REPLACE") — leaving any you actually filled in
//   - set `smoke` to whether a vibegate.smoke.json actually exists in the app
// Safe to re-run any time after adding apps.
//   node study/normalize-meta.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const CORPUS = join(dirname(fileURLToPath(import.meta.url)), "..", "corpus");
if (!existsSync(CORPUS)) {
  console.log("no corpus/ directory yet — nothing to normalize");
  process.exit(0);
}

let changed = 0;
for (const d of readdirSync(CORPUS, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const metaPath = join(CORPUS, d.name, "app-meta.json");
  if (!existsSync(metaPath)) continue;

  const m = JSON.parse(readFileSync(metaPath, "utf8"));
  const before = JSON.stringify(m);

  if (typeof m.allowedOrigin === "string" && m.allowedOrigin.startsWith("REPLACE")) m.allowedOrigin = null;
  if (typeof m.previewUrl === "string" && m.previewUrl.startsWith("REPLACE")) m.previewUrl = null;
  m.smoke = existsSync(join(CORPUS, d.name, "vibegate.smoke.json"));

  if (JSON.stringify(m) !== before) {
    writeFileSync(metaPath, JSON.stringify(m, null, 2) + "\n");
    changed++;
  }
}
console.log(`normalized ${changed} app-meta.json file(s)`);
