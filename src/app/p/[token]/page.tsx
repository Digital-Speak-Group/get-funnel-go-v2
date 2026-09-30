import { notFound } from "next/navigation";
import { getAudiencePayload } from "@/server/services/audience";
import { AudienceView } from "@/components/presenter/AudienceView";
import type { Metadata } from "next";

interface AudiencePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: AudiencePageProps): Promise<Metadata> {
  const { token } = await params;
  const payload = await getAudiencePayload(token);
  if (!payload) return { title: "Présentation — GetFunnels" };
  return {
    title: `${payload.title} — GetFunnels`,
    robots: { index: false, follow: false }, // don't index public audience links
  };
}

/**
 * Public audience view — no auth, no chrome.
 * Resolves the present token server-side; returns 404 for invalid/rotated tokens.
 * Notes and scripts are stripped from the payload before rendering.
 */
export default async function AudiencePage({ params }: AudiencePageProps) {
  const { token } = await params;

  // Rate limiting would be applied via middleware (edge) in production
  const payload = await getAudiencePayload(token);
  if (!payload) notFound();

  const { analytics } = await import("@/lib/analytics");
  analytics.track("audience_joined", { deckId: payload.deckId });

  return (
    <AudienceView
      slides={payload.slides}
      theme={payload.theme}
      presentToken={payload.presentToken}
      initialIndex={0}
    />
  );
}
