import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { getAudiencePayload } from "@/server/services/audience";

const getCachedAudiencePayload = unstable_cache(
  async (token: string) => getAudiencePayload(token),
  ['audience-payload'],
  { tags: ['deck'], revalidate: 60 } // revalidate every 60s or on-demand
);
import { AudienceView } from "@/components/presenter/AudienceView";
import type { Metadata } from "next";

interface AudiencePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: AudiencePageProps): Promise<Metadata> {
  const { token } = await params;
  const payload = await getCachedAudiencePayload(token);
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
  const payload = await getCachedAudiencePayload(token);
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
