import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getExportPayload } from "@/server/services/export";
import { BrowserNotFoundError, renderDeckPdf } from "@/server/services/pdf";

/**
 * GET /api/decks/[deckId]/export
 *
 * PDF of the deck, rendered by headless Chrome from the audience view
 * (see `src/server/services/pdf.ts`).
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
    const pdfBuffer = await renderDeckPdf(payload.appUrl, payload.presentToken, slideIndices);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(payload.title)}.pdf`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[export] PDF generation failed", err);
    const message =
      err instanceof BrowserNotFoundError
        ? "Export PDF indisponible : Chrome est introuvable sur le serveur (CHROMIUM_EXECUTABLE_PATH)."
        : "Échec de la génération PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
