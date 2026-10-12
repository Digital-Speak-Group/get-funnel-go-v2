import "server-only";
import { existsSync } from "node:fs";
import type { Page } from "puppeteer-core";

/**
 * Headless Chrome over the public audience route (/p/[token]) at 1920×1080: steps through
 * the requested slides and hands each one to a capture callback (PDF page, screenshot…).
 * Shared by the PDF and PowerPoint exports so both match the on-screen rendering.
 */

export class BrowserNotFoundError extends Error {}

export const SLIDE_WIDTH = 1920;
export const SLIDE_HEIGHT = 1080;

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
  // Let images and fonts of the new slide finish before capturing.
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

export async function captureSlides(
  appUrl: string,
  presentToken: string,
  slideIndices: number[],
  capture: (page: Page) => Promise<Buffer>
): Promise<Buffer[]> {
  // Dynamic import — keeps puppeteer out of the main bundle
  const puppeteer = await import("puppeteer-core");
  const { executablePath, args } = await resolveBrowser();

  const browser = await puppeteer.default.launch({
    executablePath,
    args,
    headless: true,
    defaultViewport: { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, deviceScaleFactor: 1 },
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: SLIDE_WIDTH, height: SLIDE_HEIGHT });
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

    const captures: Buffer[] = [];
    for (const targetIndex of slideIndices) {
      await showSlide(page, targetIndex);
      captures.push(await capture(page));
    }
    return captures;
  } finally {
    await browser.close();
  }
}
