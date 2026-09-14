// Core types for the vibegate measurement pipeline.
// Every check implements `Check` so the harness can record yield and friction
// uniformly across checks — that uniformity is what makes the speed–safety
// frontier computable (see vibe-gate-design.md §3, §6).

export type ExposureClass =
  | "missing-security-header"
  | "permissive-cors"
  | "client-secret"
  | "open-storage-rule"
  | "unauthenticated-endpoint"
  | "vulnerable-dependency";

export type Rung = "detect" | "warn" | "block" | "auto-fix";

/** Where a check runs. `pre` inspects the built repo; `post` probes the live
 *  preview URL. Post-surface fixes generally force a second deploy — a real,
 *  measured friction cost. */
export type Surface = "pre" | "post";

export type Platform = "vercel" | "netlify" | "cloudflare" | "unknown";

export interface Finding {
  checkId: string;
  exposureClass: ExposureClass;
  /** Stable identifier for this specific exposure within the app, so a
   *  post-fix re-scan can confirm the same finding is gone. */
  key: string;
  detail: string;
  /** Severity weight in [0,1]; used to weight yield on the frontier. */
  severity: number;
  location?: string; // file:line or URL+header
  /** The matched sensitive literal, carried so a fix can rewrite it. */
  evidence?: string;
}

export interface FixResult {
  applied: boolean;
  /** Did a re-scan confirm the exposure is actually gone? Unreverified fixes
   *  do NOT count toward yield. */
  reverified: boolean;
  /** Did a smoke test fail after the fix? Auto-fixes that break apps are a
   *  first-class negative result. */
  brokeApp?: boolean;
  note?: string;
}

export interface CheckContext {
  surface: Surface;
  /** Present for pre-surface runs: path to the built app repo. */
  appDir?: string;
  /** Present for post-surface runs: the live preview URL (must be on the
   *  local deploy allowlist — enforced by the CLI, not here). */
  previewUrl?: string;
  platform: Platform;
}

export interface Check {
  id: string;
  exposureClass: ExposureClass;
  surface: Surface;
  /** Highest remediation rung this check can reach. */
  maxRung: Rung;
  /** True if applying the fix needs a human decision (e.g. which CORS origin
   *  to allow) — a friction penalty on the frontier. */
  requiresHumanDecision: boolean;
  /** True if the fix can only take effect via a second deploy. */
  forcesRedeploy: boolean;

  detect(ctx: CheckContext): Promise<Finding[]>;
  /** Omitted => detect-only (cannot reach `auto-fix`). */
  fix?(ctx: CheckContext, finding: Finding): Promise<FixResult>;
}

/** One row per (app, check, finding, variant) — the raw material for the
 *  frontier. Serialized as JSONL by the harness. */
export interface MeasurementRow {
  timestamp: string;
  appId: string;
  tool: string; // generating tool: v0 / lovable / bolt / ...
  platform: Platform;
  checkId: string;
  exposureClass: ExposureClass;
  variant: string; // e.g. "block-and-guide" vs "auto-move" for secrets
  surface: Surface;

  /** Identifies WHICH finding this row is — required for FP labeling. */
  location: string | null;
  detail: string;

  baselinePresent: boolean; // was the exposure there before the gate?
  detected: boolean;
  truePositive: boolean | null; // hand-labeled on a validation subset; else null

  fixApplied: boolean;
  reverified: boolean;
  /** The check's static prediction of whether its fix breaks the app. */
  brokeApp: boolean | null;
  /** Measured at runtime by the smoke test (baseline ok && post-fix broken);
   *  null when no smoke spec was supplied. Recorded alongside the prediction
   *  so the paper can report predicted-vs-measured agreement. */
  brokeAppMeasured: boolean | null;

  addedSeconds: number;
  humanDecision: boolean;
  extraDeploy: boolean;

  severityWeight: number;
}
