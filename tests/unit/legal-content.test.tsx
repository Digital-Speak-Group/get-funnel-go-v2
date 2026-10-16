import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { countPlaceholders, LEGAL_DOCUMENTS, TODO_MARKER, todo } from "@/app/(marketing)/legal/content";
import { LegalPage } from "@/app/(marketing)/legal/LegalPage";

describe("legal documents", () => {
  it("covers terms, privacy and mentions, the paths the app links to", () => {
    expect(LEGAL_DOCUMENTS.map((d) => d.slug)).toEqual(["terms", "privacy", "mentions"]);
  });

  it("has a title, description and sections for every document", () => {
    for (const doc of LEGAL_DOCUMENTS) {
      expect(doc.title).not.toBe("");
      expect(doc.description).not.toBe("");
      expect(doc.sections.length).toBeGreaterThan(0);
      expect(Number.isNaN(new Date(doc.updated).getTime())).toBe(false);
    }
  });

  it("marks every company fact it does not know as a visible placeholder", () => {
    expect(todo("SIREN")).toBe(`${TODO_MARKER} : SIREN]`);
    for (const doc of LEGAL_DOCUMENTS) expect(countPlaceholders(doc)).toBeGreaterThan(0);
  });

  it("names the sub-processors the product really uses", () => {
    const privacy = LEGAL_DOCUMENTS.find((d) => d.slug === "privacy")!;
    const text = JSON.stringify(privacy);
    for (const name of ["Supabase", "Stripe", "Groq", "Resend", "PostHog", "Sentry"]) {
      expect(text).toContain(name);
    }
  });

  it("renders each placeholder highlighted, once per marker", () => {
    for (const doc of LEGAL_DOCUMENTS) {
      const html = renderToStaticMarkup(<LegalPage doc={doc} />);
      expect(html.split('data-testid="legal-placeholder"').length - 1).toBe(countPlaceholders(doc));
      expect(html.replaceAll("&#x27;", "'")).toContain(`>${doc.title}</h1>`);
    }
  });
});
