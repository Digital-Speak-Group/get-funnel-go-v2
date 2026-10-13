import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listSystemThemes } from "@/lib/db/repositories/themes";
import { listSystemTemplates, listTemplateGallery } from "@/lib/db/repositories/templates";
import { getWorkspaceSummary } from "@/server/services/workspace";
import { creditLimitCents } from "@/server/services/credits";
import { ESTIMATED_COST_CENTS } from "@/server/services/generation";
import { GenerationWizard } from "@/components/app/wizard/GenerationWizard";

export const metadata = { title: "Nouveau deck — GetFunnels" };

export default async function NewDeckPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const ctx = { orgId: session.activeOrgId };
  const [themes, templates, gallery, workspace] = await Promise.all([
    listSystemThemes(),
    listSystemTemplates(),
    listTemplateGallery(),
    getWorkspaceSummary(ctx),
  ]);

  const covers = new Map(gallery.map((g) => [g.id, g]));
  const wizardTemplates = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: covers.get(t.id)?.category ?? "",
    stages: t.config.stages,
    cover: covers.get(t.id)?.slides[0],
  }));

  const plan = workspace?.plan ?? "trial";
  // Same rule as reserveCredits: the next generation must fit in the plan's monthly budget.
  const exhausted = (workspace?.creditsUsed ?? 0) + ESTIMATED_COST_CENTS > creditLimitCents(plan);

  return (
    <div className="flex flex-1 flex-col">
      <GenerationWizard
        themes={themes}
        templates={wizardTemplates}
        plan={plan}
        budget={{ decksUsed: workspace?.decksCreated ?? 0, decksLimit: workspace?.decksLimit ?? 0, exhausted }}
      />
    </div>
  );
}
