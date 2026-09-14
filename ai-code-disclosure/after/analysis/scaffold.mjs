// Scaffold corpus folders for one tool: creates corpus/<spec>-<tool>-<gen>/
// with a pre-filled app-meta.json (id, spec, tool, platform, and the exact
// prompt read from study/prompts/). Drop the exported app code into each
// folder and fill the REPLACE fields.
//
//   node study/scaffold.mjs v0        # 5 specs x 3 generations = 15 folders
//
// Never overwrites an existing app-meta.json, so re-running is safe.
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROMPT_DIR = join(ROOT, "study", "prompts");
const CORPUS_DIR = join(ROOT, "corpus");
const GENERATIONS = [1, 2, 3];
const PLATFORM = { v0: "vercel", lovable: "netlify", bolt: "netlify", replit: "replit", claude: "vercel" };

const tool = process.argv[2];
if (!tool) {
  console.error("usage: node study/scaffold.mjs <tool>   (v0|lovable|bolt|replit|claude)");
  process.exit(1);
}

/** Extract the verbatim prompt (the single markdown blockquote) from a spec. */
function extractPrompt(file) {
  return readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.startsWith(">"))
    .map((l) => l.replace(/^>\s?/, ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

const specs = readdirSync(PROMPT_DIR).filter((f) => f.endsWith(".md")).sort();
let created = 0;
let skipped = 0;

for (const specFile of specs) {
  const spec = specFile.replace(/\.md$/, ""); // e.g. 01-todo-auth
  const short = spec.replace(/^\d+-/, "").split("-")[0]; // e.g. todo
  const prompt = extractPrompt(join(PROMPT_DIR, specFile));

  for (const gen of GENERATIONS) {
    const id = `${short}-${tool}-${gen}`;
    const dir = join(CORPUS_DIR, id);
    const metaPath = join(dir, "app-meta.json");
    if (existsSync(metaPath)) {
      skipped++;
      continue;
    }
    mkdirSync(dir, { recursive: true });
    const meta = {
      id,
      spec,
      tool,
      toolVersion: "REPLACE — tool build/date shown in the UI at generation time",
      model: "REPLACE — underlying model if shown, else \"\"",
      generatedAt: "REPLACE — YYYY-MM-DD",
      prompt,
      followUps: [],
      platform: PLATFORM[tool] ?? "vercel",
      secretMode: "auto-move",
      // Deploy/runtime fields — leave null for static-only analysis; fill in
      // only if you deploy this app for the Phase 5 live-probe layer.
      allowedOrigin: null,
      smoke: false,
      previewUrl: null,
      notes: ""
    };
    writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");
    created++;
  }
}

console.log(`${tool}: created ${created} folders, skipped ${skipped} existing, under corpus/`);
