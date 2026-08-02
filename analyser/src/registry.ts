// Check registry. Checks are assembled per-run so the secret-handling variant
// can be selected (design §4.3). Add new checks here as implemented.
import type { Check } from "./types.js";
import { securityHeaders } from "./checks/security-headers.js";
import { clientSecretBlock, clientSecretAutoMove } from "./checks/client-secret.js";
import { makeCorsCheck } from "./checks/cors.js";
import { endpointAuth } from "./checks/endpoint-auth.js";
import { storageRules } from "./checks/storage-rules.js";
import { depVuln } from "./checks/dep-vuln.js";

export type SecretMode = "block" | "auto-move" | "both";

export interface BuildOptions {
  secretMode?: SecretMode;
  /** Origin to restrict permissive CORS to; when set, cors-tighten auto-fixes,
   *  otherwise it blocks and asks a human. */
  allowedOrigin?: string;
}

export function buildChecks(opts: BuildOptions = {}): Check[] {
  const secretMode = opts.secretMode ?? "block"; // safe default: block, don't rewrite
  const checks: Check[] = [securityHeaders];

  if (secretMode === "block" || secretMode === "both") checks.push(clientSecretBlock);
  if (secretMode === "auto-move" || secretMode === "both") checks.push(clientSecretAutoMove);

  checks.push(makeCorsCheck(opts.allowedOrigin));
  checks.push(endpointAuth);
  checks.push(storageRules);
  checks.push(depVuln);

  return checks;
}

export function preChecks(opts?: BuildOptions): Check[] {
  return buildChecks(opts).filter((c) => c.surface === "pre");
}

export function postChecks(opts?: BuildOptions): Check[] {
  return buildChecks(opts).filter((c) => c.surface === "post");
}
