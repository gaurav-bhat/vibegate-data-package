// Platform adapters: detect the host from repo contents and resolve where its
// header/config lives, so the same check emits host-correct fixes (RQ4).
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Platform } from "./types.js";

export function detectPlatform(appDir: string): Platform {
  if (existsSync(join(appDir, "vercel.json"))) return "vercel";
  if (existsSync(join(appDir, "netlify.toml"))) return "netlify";
  if (existsSync(join(appDir, "wrangler.toml"))) return "cloudflare";
  // _headers is used by both Netlify and Cloudflare Pages; default to netlify.
  if (existsSync(join(appDir, "_headers"))) return "netlify";
  return "unknown";
}

/** Which file this platform expects response-header config in. For Vercel we
 *  use vercel.json; Netlify and Cloudflare Pages both honor a `_headers` file,
 *  which is the simplest cross-host fix target. */
export function headerConfigFile(platform: Platform, appDir: string): string {
  // Vercel uses vercel.json; everything else (incl. any unrecognized value)
  // defaults to the `_headers` file that Netlify/Cloudflare Pages honor.
  return platform === "vercel"
    ? join(appDir, "vercel.json")
    : join(appDir, "_headers");
}
