import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { parseScriptCue } from "@/lib/slides/schema";
import { getExportPayload } from "@/server/services/export";
import { BrowserNotFoundError } from "@/server/services/slide-capture";
import { renderDeckPdf } from "@/server/services/pdf";
import { renderDeckPptx } from "@/server/services/pptx";

const FORMATS = {
  pdf: { contentType: "application/pdf", label: "PDF" },
  pptx: {
    contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    label: "PowerPoint",
  },
} as const;

type ExportFormat = keyof typeof FORMATS;

/**
 * GET /api/decks/[deckId]/export
 *
 * The deck rendered by headless Chrome from the audience view
 * (see `src/server/services/slide-capture.ts`): a PDF, or a PowerPoint of slide
 * pictures with the presenter script as speaker notes.
 *
 * Returns: the file, Content-Disposition: attachment
 * Accepts: ?format=pdf (default) | ?format=pptx
 *          ?slides=all (default) | ?slides=1,3,5 (1-indexed list)
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

  const formatParam = req.nextUrl.searchParams.get("format") ?? "pdf";
  if (!(formatParam in FORMATS)) {
    return NextResponse.json({ error: "Format d'export inconnu" }, { status: 400 });
  }
  const format = formatParam as ExportFormat;

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
    const file =
      format === "pptx"
        ? await renderDeckPptx(
            payload.appUrl,
            payload.presentToken,
            payload.title,
            slideIndices.map((index) => {
              const slide = payload.slides[index];
              return {
                index,
                material: { script: slide.script, notes: slide.notes, cue: parseScriptCue(slide.cue) },
              };
            })
          )
        : await renderDeckPdf(payload.appUrl, payload.presentToken, slideIndices);

    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": FORMATS[format].contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(payload.title)}.${format}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(`[export] ${format} generation failed`, err);
    const label = FORMATS[format].label;
    const message =
      err instanceof BrowserNotFoundError
        ? `Export ${label} indisponible : Chrome est introuvable sur le serveur (CHROMIUM_EXECUTABLE_PATH).`
        : `Échec de la génération ${label}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
