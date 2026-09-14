// Measurement harness: runs a check, times detect/fix, re-verifies, and emits
// one MeasurementRow per finding. This is the instrument that produces the
// dataset behind the speed–safety frontier (vibe-gate-design.md §5, §6).
//
// When a smoke spec is supplied, the harness measures breakage for real: it
// runs the app before any fix (baseline) and again after the fixes, and marks
// the app broken when it worked before but not after. That measured signal
// takes precedence over each check's static `brokeApp` prediction for the
// yield count, while both are recorded so the paper can compare them.
import { appendFileSync } from "node:fs";
import { runSmoke, type SmokeSpec } from "./smoke.js";
import type { Check, CheckContext, Finding, MeasurementRow } from "./types.js";

export interface AppMeta {
  appId: string;
  tool: string;
}

export interface RunOptions {
  /** When true, apply fixes; when false, detect-only (baseline pass). */
  applyFix: boolean;
  /** Variant label, e.g. "block-and-guide" vs "auto-move" for the secret check. */
  variant?: string;
  /** JSONL sink; each row appended as one line. */
  outFile?: string;
  /** Optional runtime smoke test to measure breakage around the fixes. */
  smoke?: SmokeSpec;
}

function now(): number {
  return Number(process.hrtime.bigint() / 1_000_000n); // ms
}

export interface RunSummary {
  rows: MeasurementRow[];
  detectedFindings: Finding[];
  findingsBefore: number;
  findingsRemoved: number;
  addedSecondsTotal: number;
  /** Whether the smoke test ran and what it found (null if no spec). */
  brokeAppMeasured: boolean | null;
}

interface Interim {
  finding: Finding;
  fixApplied: boolean;
  reverified: boolean;
  predictedBroke: boolean | null;
  fixSeconds: number;
}

export async function runCheck(
  check: Check,
  ctx: CheckContext,
  app: AppMeta,
  opts: RunOptions,
): Promise<RunSummary> {
  const variant = opts.variant ?? "default";
  const willFix = opts.applyFix && !!check.fix;

  const tDetectStart = now();
  const findings = await check.detect(ctx);
  const detectMs = now() - tDetectStart;
  const perFindingDetect = detectMs / Math.max(findings.length, 1) / 1000;

  // Baseline smoke BEFORE any mutation, so post-fix breakage is attributable.
  let baselineOk: boolean | null = null;
  if (willFix && opts.smoke) baselineOk = (await runSmoke(opts.smoke)).ok;

  const interims: Interim[] = [];
  for (const finding of findings) {
    let fixApplied = false;
    let reverified = false;
    let predictedBroke: boolean | null = null;
    let fixSeconds = 0;

    if (willFix) {
      const tFixStart = now();
      const result = await check.fix!(ctx, finding);
      fixSeconds = (now() - tFixStart) / 1000;
      fixApplied = result.applied;
      reverified = result.reverified;
      predictedBroke = result.brokeApp ?? null;
    }
    interims.push({ finding, fixApplied, reverified, predictedBroke, fixSeconds });
  }

  // Post-fix smoke to MEASURE breakage (app-level: attributed to every fix in
  // this run, since a single boot can't isolate which fix broke it).
  let brokeAppMeasured: boolean | null = null;
  if (willFix && opts.smoke && baselineOk != null) {
    const postOk = (await runSmoke(opts.smoke)).ok;
    brokeAppMeasured = baselineOk && !postOk;
  }

  let removed = 0;
  let addedSecondsTotal = detectMs / 1000;
  const rows: MeasurementRow[] = [];

  for (const it of interims) {
    addedSecondsTotal += it.fixSeconds;
    // Prefer the measured signal; fall back to the static prediction.
    const broke = brokeAppMeasured ?? it.predictedBroke ?? false;
    if (it.fixApplied && it.reverified && !broke) removed++;

    rows.push({
      timestamp: new Date().toISOString(),
      appId: app.appId,
      tool: app.tool,
      platform: ctx.platform,
      checkId: check.id,
      exposureClass: it.finding.exposureClass,
      variant,
      surface: ctx.surface,
      location: it.finding.location ?? null,
      detail: it.finding.detail,
      baselinePresent: true, // this finding existed at detect time
      detected: true,
      truePositive: null, // hand-labeled later on the validation subset
      fixApplied: it.fixApplied,
      reverified: it.reverified,
      brokeApp: it.predictedBroke,
      brokeAppMeasured: it.fixApplied ? brokeAppMeasured : null,
      addedSeconds: Number((perFindingDetect + it.fixSeconds).toFixed(4)),
      humanDecision: check.requiresHumanDecision,
      extraDeploy: check.forcesRedeploy,
      severityWeight: it.finding.severity,
    });
  }

  if (opts.outFile) {
    for (const r of rows) appendFileSync(opts.outFile, JSON.stringify(r) + "\n");
  }

  return {
    rows,
    detectedFindings: findings,
    findingsBefore: findings.length,
    findingsRemoved: removed,
    addedSecondsTotal: Number(addedSecondsTotal.toFixed(4)),
    brokeAppMeasured,
  };
}
