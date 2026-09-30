import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDeckWithSlides } from "@/server/services/decks";
import { listSystemThemes } from "@/lib/db/repositories/themes";
import { ThemeTokensSchema } from "@/lib/slides/theme";
import { SlideSchema } from "@/lib/slides/schema";
import { PresenterShell } from "@/components/presenter/PresenterShell";

interface PresentPageProps {
  params: Promise<{ deckId: string }>;
}

export async function generateMetadata({ params }: PresentPageProps) {
  const { deckId } = await params;
  const session = await getSession();
  if (!session) return {};
  const data = await getDeckWithSlides(deckId, {
    orgId: session.activeOrgId,
    userId: session.userId,
  });
  return {
    title: data ? `Présenter : ${data.deck.title} — GetFunnels` : "Présentation — GetFunnels",
  };
}

export default async function PresentPage({ params }: PresentPageProps) {
  const { deckId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getDeckWithSlides(deckId, {
    orgId: session.activeOrgId,
    userId: session.userId,
  });
  if (!data) notFound();

  const { analytics } = await import("@/lib/analytics");
  analytics.track("deck_presented", { userId: session.userId, orgId: session.activeOrgId, deckId });

  // Validate slides
  const parsedSlides = data.slides.flatMap((s) => {
    const result = SlideSchema.safeParse({
      id: s.id,
      position: s.position,
      type: s.type,
      content: s.content,
      notes: s.notes ?? undefined,
      script: s.script ?? undefined,
    });
    return result.success ? [result.data] : [];
  });

  if (parsedSlides.length === 0) notFound();

  // Resolve theme (fall back to first system theme if DB tokens are corrupt)
  const rawTokens = data.deck.theme?.tokens;
  const themeParsed = ThemeTokensSchema.safeParse(rawTokens);

  if (!themeParsed.success) {
    const systemThemes = await listSystemThemes();
    const fallbackTokens = ThemeTokensSchema.safeParse(systemThemes[0]?.tokens);
    if (!fallbackTokens.success) notFound();
    return (
      <PresenterShell
        deck={{ id: data.deck.id, title: data.deck.title, presentToken: data.deck.presentToken }}
        slides={parsedSlides}
        theme={fallbackTokens.data}
      />
    );
  }

  return (
    <PresenterShell
      deck={{ id: data.deck.id, title: data.deck.title, presentToken: data.deck.presentToken }}
      slides={parsedSlides}
      theme={themeParsed.data}
    />
  );
}
