// Browser-level probe: catches *silent client-side* breakage that an HTTP
// smoke test misses — a page that still returns 200 while a JS feature is dead
// (e.g. a secret pulled out of client code leaves `process.env.X` as an
// undefined/`process is not defined` ReferenceError at module eval, so the
// widget never renders). Drives the system Chrome via puppeteer-core, so no
// Chromium download is required.
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

export interface BrowserAssertion {
  path: string;
  /** Fail if any uncaught exception fires during load. Default true. */
  expectNoUncaughtErrors?: boolean;
  /** Fail if anything is logged to console.error. Default false (noisy apps). */
  expectNoConsoleErrors?: boolean;
  /** Element that must exist after render. */
  expectSelector?: string;
  /** Text that must appear in the rendered body. */
  expectText?: string;
}

export interface BrowserResult {
  ok: boolean;
  failures: string[];
}

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

/** Locate an installed Chrome-family browser; overridable via CHROME_PATH. */
export function findChrome(): string | undefined {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  return CHROME_CANDIDATES.find((p) => existsSync(p));
}

export async function runBrowserProbe(
  base: string,
  assertions: BrowserAssertion[],
): Promise<BrowserResult> {
  const executablePath = findChrome();
  if (!executablePath) {
    return { ok: false, failures: ["no Chrome found (set CHROME_PATH)"] };
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-gpu"],
  });

  const failures: string[] = [];
  try {
    for (const a of assertions) {
      const page = await browser.newPage();
      const uncaught: string[] = [];
      const consoleErrors: string[] = [];
      page.on("pageerror", (e) => uncaught.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") consoleErrors.push(m.text());
      });

      try {
        await page.goto(base + a.path, { waitUntil: "networkidle0", timeout: 8000 });
      } catch (e) {
        failures.push(`${a.path}: navigation failed: ${(e as Error).message}`);
        await page.close();
        continue;
      }

      if ((a.expectNoUncaughtErrors ?? true) && uncaught.length) {
        failures.push(`${a.path}: uncaught error: ${uncaught[0]}`);
      }
      if (a.expectNoConsoleErrors && consoleErrors.length) {
        failures.push(`${a.path}: console.error: ${consoleErrors[0]}`);
      }
      if (a.expectSelector) {
        const found = await page.$(a.expectSelector);
        if (!found) failures.push(`${a.path}: selector "${a.expectSelector}" not found`);
      }
      if (a.expectText) {
        const body = (await page.evaluate(() => document.body.innerText)) ?? "";
        if (!body.includes(a.expectText)) {
          failures.push(`${a.path}: rendered text missing "${a.expectText}"`);
        }
      }
      await page.close();
    }
    return { ok: failures.length === 0, failures };
  } finally {
    await browser.close();
  }
}
