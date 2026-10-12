import "server-only";
import { existsSync } from "node:fs";
import type { Page } from "puppeteer-core";

/**
 * Deck → PDF via headless Chrome: each slide is rendered by the public audience
 * route (/p/[token]) at 1920×1080 and printed as one 16:9 page.
 */

export class BrowserNotFoundError extends Error {}

/** Flags for a regular desktop/server Chrome (not the serverless Chromium build). */
const LOCAL_CHROME_ARGS = ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"];

function localChromeCandidates(): string[] {
  if (process.platform === "win32") {
    const roots = [
      process.env.PROGRAMFILES,
      process.env["PROGRAMFILES(X86)"],
      process.env.LOCALAPPDATA,
    ].filter((r): r is string => Boolean(r));
    return [
      ...roots.map((r) => `${r}\\Google\\Chrome\\Application\\chrome.exe`),
      ...roots.map((r) => `${r}\\Microsoft\\Edge\\Application\\msedge.exe`),
    ];
  }
  if (process.platform === "darwin") {
    return [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ];
  }
  return [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
}

/**
 * Which browser to drive, in order:
 * 1. `CHROMIUM_EXECUTABLE_PATH` — an installed Chrome/Chromium (VPS, Docker, local).
 * 2. `CHROMIUM_PACK_URL` — serverless: `@sparticuz/chromium-min` downloads and unpacks
 *    that Chromium pack (its `executablePath()` takes a pack location, not a binary).
 * 3. The first Chrome/Edge found at the platform's usual install paths.
 */
async function resolveBrowser(): Promise<{ executablePath: string; args: string[] }> {
  const explicit = process.env.CHROMIUM_EXECUTABLE_PATH;
  if (explicit) return { executablePath: explicit, args: LOCAL_CHROME_ARGS };

  const packUrl = process.env.CHROMIUM_PACK_URL;
  if (packUrl) {
    const { default: chromium } = await import("@sparticuz/chromium-min");
    return { executablePath: await chromium.executablePath(packUrl), args: chromium.args };
  }

  const found = localChromeCandidates().find((p) => existsSync(p));
  if (!found) throw new BrowserNotFoundError("No Chrome/Chromium executable found");
  return { executablePath: found, args: LOCAL_CHROME_ARGS };
}

/** Steps the audience view to `target` and waits until it reports that slide. */
async function showSlide(page: Page, target: number): Promise<void> {
  const current = await page.$eval("[data-slide-index]", (el) =>
    Number(el.getAttribute("data-slide-index"))
  );
  const key = target > current ? "ArrowRight" : "ArrowLeft";
  for (let j = 0; j < Math.abs(target - current); j++) {
    await page.keyboard.press(key);
  }
  await page.waitForSelector(`[data-slide-index="${target}"]`, { timeout: 5000 });
  // Let images and fonts of the new slide finish before printing.
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map((img) => new Promise((resolve) => img.addEventListener("load", resolve, { once: true })))
    );
  });
  await new Promise((r) => setTimeout(r, 150));
}

export async function renderDeckPdf(
  appUrl: string,
  presentToken: string,
  slideIndices: number[]
): Promise<Buffer> {
  // Dynamic import — keeps puppeteer out of the main bundle
  const puppeteer = await import("puppeteer-core");
  const { executablePath, args } = await resolveBrowser();

  const browser = await puppeteer.default.launch({
    executablePath,
    args,
    headless: true,
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    // Render what the audience sees on screen, without entrance animations mid-way.
    await page.emulateMediaType("screen");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);

    const audienceUrl = `${appUrl}/p/${encodeURIComponent(presentToken)}`;
    const response = await page.goto(audienceUrl, { waitUntil: "networkidle0", timeout: 30000 });
    if (!response?.ok()) {
      throw new Error(`Audience view returned ${response?.status() ?? "no response"} for export`);
    }
    await page.waitForSelector("[data-slide-index]", { timeout: 10000 });
    await page.addStyleTag({
      content: "[data-export-hide]{display:none!important}*{animation:none!important;transition:none!important}",
    });

    const pages: Buffer[] = [];
    for (const targetIndex of slideIndices) {
      await showSlide(page, targetIndex);
      const pdf = await page.pdf({
        width: "1920px",
        height: "1080px",
        printBackground: true,
        pageRanges: "1",
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      pages.push(Buffer.from(pdf));
    }

    return await mergePdfs(pages);
  } finally {
    await browser.close();
  }
}

/** Merge individual single-page PDFs into one multi-page PDF. */
async function mergePdfs(pdfBuffers: Buffer[]): Promise<Buffer> {
  if (pdfBuffers.length === 1) return pdfBuffers[0];

  const { PDFDocument } = await import("pdf-lib");
  const merged = await PDFDocument.create();
  for (const buf of pdfBuffers) {
    const src = await PDFDocument.load(buf);
    const [page] = await merged.copyPages(src, [0]);
    merged.addPage(page);
  }
  return Buffer.from(await merged.save());
}
