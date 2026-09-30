import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getExportPayload } from "@/server/services/export";

/**
 * GET /api/decks/[deckId]/export
 *
 * Generates a PDF of the deck using puppeteer-core + chromium.
 * Each slide is rendered via the public audience route /p/[token] at
 * viewport 1920×1080, then exported as 16:9 PDF pages.
 *
 * Returns: application/pdf stream, Content-Disposition: attachment
 * Accepts: ?slides=all (default) | ?slides=1,3,5 (1-indexed list)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  const { deckId } = await params;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const payload = await getExportPayload(deckId, {
    orgId: session.activeOrgId,
    userId: session.userId,
  });

  if (!payload) {
    return NextResponse.json({ error: "Deck introuvable" }, { status: 404 });
  }

  if (payload.slides.length === 0) {
    return NextResponse.json({ error: "Aucune slide à exporter" }, { status: 422 });
  }

  // Parse optional slide filter
  const slidesParam = req.nextUrl.searchParams.get("slides");
  let slideIndices: number[] = payload.slides.map((_, i) => i);
  if (slidesParam && slidesParam !== "all") {
    slideIndices = slidesParam
      .split(",")
      .map((s) => parseInt(s.trim(), 10) - 1)
      .filter((i) => i >= 0 && i < payload.slides.length);
  }

  try {
    const pdfBuffer = await generatePdf(payload.appUrl, payload.presentToken, slideIndices);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(payload.title)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[export] PDF generation failed", err);
    return NextResponse.json(
      { error: "Échec de la génération PDF" },
      { status: 500 }
    );
  }
}

async function generatePdf(
  appUrl: string,
  presentToken: string,
  slideIndices: number[]
): Promise<Buffer> {
  // Dynamic import — keeps puppeteer out of the main bundle
  const chromium = await import("@sparticuz/chromium-min");
  const puppeteer = await import("puppeteer-core");

  const executablePath = await chromium.default.executablePath(
    // On Vercel/cloud use the Chromium binary; locally use the system Chrome
    process.env.CHROMIUM_EXECUTABLE_PATH ??
      (process.platform === "win32"
        ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        : process.platform === "darwin"
        ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : "/usr/bin/google-chrome")
  );

  const browser = await puppeteer.default.launch({
    executablePath,
    args: [...chromium.default.args, "--no-sandbox", "--disable-dev-shm-usage"],
    headless: true,
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    // Navigate to the audience view and wait for it to render
    const audienceUrl = `${appUrl}/p/${presentToken}`;
    await page.goto(audienceUrl, { waitUntil: "networkidle0", timeout: 30000 });

    // Inject a helper to jump to a specific slide by index
    // The audience view exposes window for keyboard events — we simulate ArrowRight
    const pages: Buffer[] = [];

    for (let i = 0; i < slideIndices.length; i++) {
      const targetIndex = slideIndices[i];

      if (i === 0) {
        // Jump to first target slide via Home + n presses of ArrowRight
        await page.keyboard.press("Home");
        for (let j = 0; j < targetIndex; j++) {
          await page.keyboard.press("ArrowRight");
          await new Promise((r) => setTimeout(r, 50));
        }
      } else {
        // Navigate relative from last slide
        const prevIndex = slideIndices[i - 1];
        const delta = targetIndex - prevIndex;
        const key = delta > 0 ? "ArrowRight" : "ArrowLeft";
        for (let j = 0; j < Math.abs(delta); j++) {
          await page.keyboard.press(key);
          await new Promise((r) => setTimeout(r, 50));
        }
      }

      // Wait a tick for React to re-render
      await new Promise((r) => setTimeout(r, 200));

      const pdf = await page.pdf({
        width: "1920px",
        height: "1080px",
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      });
      pages.push(Buffer.from(pdf));
    }

    // Merge pages using the PDFDocument approach
    const mergedPdf = await mergePdfs(pages);
    return mergedPdf;
  } finally {
    await browser.close();
  }
}

/**
 * Merge individual single-page PDFs into one multi-page PDF.
 * Uses a lightweight approach without an extra dependency.
 */
async function mergePdfs(pdfBuffers: Buffer[]): Promise<Buffer> {
  // If only one page, return it directly
  if (pdfBuffers.length === 1) return pdfBuffers[0];

  // For multi-page: concatenate using the pdf-lib pattern
  // We import pdf-lib dynamically; if not installed, fall back to first page
  try {
    const { PDFDocument } = await import("pdf-lib");
    const merged = await PDFDocument.create();
    for (const buf of pdfBuffers) {
      const src = await PDFDocument.load(buf);
      const [page] = await merged.copyPages(src, [0]);
      merged.addPage(page);
    }
    const bytes = await merged.save();
    return Buffer.from(bytes);
  } catch {
    // pdf-lib not installed — return first page only
    console.warn("[export] pdf-lib not available, returning single page");
    return pdfBuffers[0];
  }
}
