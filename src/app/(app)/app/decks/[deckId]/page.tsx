import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDeckWithSlides } from "@/server/services/decks";
import { listSystemThemes } from "@/lib/db/repositories/themes";
import { EditorShell } from "@/components/app/editor/EditorShell";

interface DeckEditorPageProps {
  params: Promise<{ deckId: string }>;
}

export default async function DeckEditorPage({ params }: DeckEditorPageProps) {
  const { deckId } = await params;

  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getDeckWithSlides(deckId, {
    orgId: session.activeOrgId,
    userId: session.userId,
  });
  if (!data) notFound();

  const themes = await listSystemThemes();

  return (
    <EditorShell
      deck={data.deck}
      initialSlides={data.slides}
      themes={themes}
    />
  );
}
