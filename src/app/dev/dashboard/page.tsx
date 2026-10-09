import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { notFound } from "next/navigation";
import { Plus, Sparkles } from "lucide-react";
import { Shell } from "@/components/app/Shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/patterns/PageHeader";
import { DeckCard } from "@/components/app/dashboard/DeckCard";
import { TemplateGallery } from "@/components/app/templates/TemplateGallery";
import { SlideSchema } from "@/lib/slides/schema";
import { systemThemes } from "@/lib/slides/theme";
import type { DeckWithRelations } from "@/lib/db/repositories/decks";
import type { TemplateGalleryItem } from "@/lib/db/repositories/templates";

export const metadata = { title: "Dashboard — GetFunnels (dev)", robots: { index: false } };

interface SeedTemplate {
  name: string;
  category: string;
  description: string;
  slides: Record<string, unknown>[];
}

const SLUGS = ["rdv-classique", "vsl-funnel", "webinaire", "commercial"];

function loadTemplates(): TemplateGalleryItem[] {
  return SLUGS.map((slug, i) => {
    const file = path.join(process.cwd(), "scripts/seed/templates", `${slug}.json`);
    const seed = JSON.parse(readFileSync(file, "utf8")) as SeedTemplate;
    const slides = seed.slides.flatMap((raw, position) => {
      const parsed = SlideSchema.safeParse({
        ...raw,
        notes: raw.notes ?? undefined,
        script: raw.script ?? undefined,
        id: randomUUID(),
        position,
      });
      return parsed.success ? [parsed.data] : [];
    });
    return {
      id: randomUUID(),
      name: seed.name,
      category: seed.category,
      description: seed.description,
      theme: systemThemes[i % systemThemes.length],
      slides,
    };
  });
}

function toDeck(template: TemplateGalleryItem, i: number): DeckWithRelations {
  const first = template.slides[0];
  const updatedAt = new Date(Date.now() - [2, 26, 75, 400][i] * 3600_000);
  return {
    id: randomUUID(),
    orgId: "dev",
    ownerId: "dev",
    title: [`Webinaire de lancement — ${template.name}`, `${template.name} · Q4`, "Masterclass closing", "Démo produit"][i],
    description: null,
    themeId: template.theme.id,
    templateId: template.id,
    status: (["ready", "draft", "draft", "archived"] as const)[i],
    presentToken: "dev",
    language: "fr",
    deletedAt: null,
    createdAt: updatedAt,
    updatedAt,
    theme: { id: template.theme.id, name: template.theme.name, tokens: template.theme },
    template: { id: template.id, name: template.name, slug: "dev" },
    slideCount: template.slides.length,
    firstSlide: first ? { ...first, notes: first.notes ?? null, script: first.script ?? null } : null,
  };
}

/** Dev-only preview of the dashboard and template gallery with seed content (no auth or database). */
export default function DevDashboardPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const templates = loadTemplates();
  const decks = templates.map(toDeck);

  return (
    <Shell
      userName="marie.dupont"
      userEmail="marie.dupont@example.com"
      workspace={{ orgName: "Digital Speak", planName: "Pro", decksCreated: 12, decksLimit: 50 }}
    >
      <div className="mx-auto max-w-7xl space-y-12">
        <section className="space-y-6">
          <PageHeader
            title="Tableau de bord"
            description="Vos decks de vente, prêts à présenter."
            actions={
              <>
                <Button variant="secondary">
                  <Plus /> Deck vierge
                </Button>
                <Button>
                  <Sparkles /> Générer un deck
                </Button>
              </>
            }
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </section>
        <section className="space-y-6 border-t border-border pt-10">
          <PageHeader
            title="Modèles"
            description="Démarrez depuis un funnel éprouvé. Chaque modèle inclut la structure, les scripts et les notes."
          />
          <TemplateGallery templates={templates} />
        </section>
      </div>
    </Shell>
  );
}
