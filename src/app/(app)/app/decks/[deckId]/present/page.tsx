import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ deckId: string }>;
}

/** Redirect from the old shell-wrapped present route to the bare presenter. */
export default async function PresentRedirectPage({ params }: Props) {
  const { deckId } = await params;
  redirect(`/present/${deckId}`);
}
