import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LEGAL_DOCUMENTS } from "../content";
import { LegalPage } from "../LegalPage";

export const dynamicParams = false;

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((doc) => ({ slug: doc.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const doc = LEGAL_DOCUMENTS.find((d) => d.slug === slug);
  return doc ? { title: `${doc.title} — GetFunnels`, description: doc.description } : {};
}

export default async function LegalDocumentPage({ params }: { params: Params }) {
  const { slug } = await params;
  const doc = LEGAL_DOCUMENTS.find((d) => d.slug === slug);
  if (!doc) notFound();
  return <LegalPage doc={doc} />;
}
