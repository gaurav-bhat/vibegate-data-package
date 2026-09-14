// Manifest builder for the corpus study. Two modes:
//
//   node study/build-manifest.mjs --template > study/corpus.template.json
//       Emit the full pre-filled generation grid (specs x tools x generations)
//       with placeholder dirs — the planning scaffold.
//
//   node study/build-manifest.mjs <corpus-dir> > corpus.json
//       Scan a real corpus directory: each subfolder that contains an
//       app-meta.json becomes a manifest entry, reading tool/platform/
//       secretMode/allowedOrigin/smoke from it. This is what you run once the
//       apps exist.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SPECS = ["01-todo-auth", "02-waitlist", "03-chatbot-api", "04-crud-dashboard", "05-file-upload"];
const TOOLS = ["v0", "lovable", "bolt", "replit"]; // add "claude" for a 5th tool
const GENERATIONS = [1, 2, 3];
const PLATFORM = { v0: "vercel", lovable: "netlify", bolt: "netlify", replit: "replit", claude: "vercel" };

function shortSpec(spec) {
  return spec.replace(/^\d+-/, "").split("-")[0]; // "01-todo-auth" -> "todo"
}

function templateGrid() {
  const apps = [];
  for (const spec of SPECS) {
    for (const tool of TOOLS) {
      for (const gen of GENERATIONS) {
        const id = `${shortSpec(spec)}-${tool}-${gen}`;
        apps.push({
          id,
          dir: id,
          spec,
          tool,
          platform: PLATFORM[tool] ?? "vercel",
          // Study default: measure the auto-fix outcome for secrets.
          secretMode: "auto-move",
          // Fill in per app AFTER deploy so cors-tighten can auto-fix; until
          // then cors blocks (which is a valid measurement too).
          allowedOrigin: null,
          smoke: true,
        });
      }
    }
  }
  return {
    _note: "Pre-filled generation grid. Create each app under corpus/<id>/, drop an app-meta.json + vibegate.smoke.json in it, then either edit this file or regenerate from the corpus dir with `node study/build-manifest.mjs corpus`.",
    apps,
  };
}

function fromCorpusDir(dir) {
  const apps = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const metaPath = join(dir, entry.name, "app-meta.json");
    if (!existsSync(metaPath)) continue;
    // Skip scaffolded-but-empty folders (no app code yet) — otherwise an empty
    // dir falsely reports missing security headers, etc.
    if (!existsSync(join(dir, entry.name, "package.json"))) continue;
    const m = JSON.parse(readFileSync(metaPath, "utf8"));
    apps.push({
      id: m.id ?? entry.name,
      dir: entry.name,
      tool: m.tool ?? "unknown",
      platform: m.platform ?? "unknown",
      secretMode: m.secretMode ?? "auto-move",
      ...(m.allowedOrigin && !String(m.allowedOrigin).startsWith("REPLACE") ? { allowedOrigin: m.allowedOrigin } : {}),
      smoke: m.smoke ?? true,
    });
  }
  return { apps };
}

const arg = process.argv[2];
const out = !arg || arg === "--template" ? templateGrid() : fromCorpusDir(arg);

// Guard: a duplicated `id` in app-meta.json (copy-paste when filling metadata)
// silently merges two apps' findings under one appId and drops the other from
// per-app counts. Fail loudly rather than corrupt the dataset.
const seen = new Map();
for (const a of out.apps ?? []) {
  if (seen.has(a.id)) {
    console.error(`ERROR: duplicate app id "${a.id}" in dirs "${seen.get(a.id)}" and "${a.dir}" — fix the id in app-meta.json`);
    process.exit(1);
  }
  seen.set(a.id, a.dir);
}

process.stdout.write(JSON.stringify(out, null, 2) + "\n");
