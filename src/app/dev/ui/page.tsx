import { notFound } from "next/navigation";
import { UiShowcase } from "./UiShowcase";

export const metadata = { title: "UI — GetFunnels (dev)", robots: { index: false } };

/** Dev-only review surface for primitives and patterns (Phase 5). Not served in production. */
export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <UiShowcase />;
}
