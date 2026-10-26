import "server-only";
import { captureSlides, SLIDE_HEIGHT, SLIDE_WIDTH } from "./slide-capture";

/** Deck → PDF: each slide of the audience view printed as one 16:9 page. */
export async function renderDeckPdf(
  appUrl: string,
  presentToken: string,
  slideIndices: number[]
): Promise<Buffer> {
  const pages = await captureSlides(appUrl, presentToken, slideIndices, async (page) =>
    Buffer.from(
      await page.pdf({
        width: `${SLIDE_WIDTH}px`,
        height: `${SLIDE_HEIGHT}px`,
        printBackground: true,
        pageRanges: "1",
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      })
    )
  );
  return mergePdfs(pages);
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
