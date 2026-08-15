import type { Browser } from "puppeteer-core";

export interface LaunchedBrowser {
  browser: Browser;
  close: () => Promise<void>;
}

/**
 * One injectable seam for launching Chromium — everything else in the
 * render pipeline (`render-book-pdf.ts`, the paginator, the template)
 * is identical between local dev and a serverless deployment; only how
 * the browser process itself is obtained differs, per the approved
 * architecture:
 *
 * - Local dev: the full `puppeteer` package, which bundles a Chromium
 *   build guaranteed to match this machine (already a transitive
 *   dependency via `@kira-joo/backend-toolkit-next`'s recipe-PDF path).
 * - Vercel (`process.env.VERCEL` is set automatically by the platform):
 *   `puppeteer-core` + `@sparticuz/chromium`'s prebuilt serverless
 *   binary, per BOOK_PLAN's Phase A/F architecture.
 *
 * The Vercel branch has NOT been exercised on an actual Vercel
 * deployment in this session — that verification is explicitly out of
 * scope here (see the Phase F report's "Vercel/serverless verification
 * status"). It is written to the approved shape and believed correct,
 * but unproven outside local development.
 */
export async function launchBookRenderBrowser(): Promise<LaunchedBrowser> {
  if (process.env.VERCEL) {
    const [{ default: chromium }, { default: puppeteerCore }] = await Promise.all([import("@sparticuz/chromium"), import("puppeteer-core")]);
    const executablePath = await chromium.executablePath();
    const browser = await puppeteerCore.launch({
      executablePath,
      args: chromium.args,
      headless: true,
    });
    return { browser, close: () => browser.close() };
  }

  const { default: puppeteer } = await import("puppeteer");
  const browser = (await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })) as unknown as Browser;
  return { browser, close: () => browser.close() };
}
