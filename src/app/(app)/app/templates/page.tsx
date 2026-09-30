import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { templates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Modèles — GetFunnels" };

const CATEGORY_LABELS: Record<string, string> = {
  Diagnostic: "Diagnostic",
  Conversion: "Conversion",
  Formation: "Formation",
  "Vente Directe": "Vente Directe",
};

export default async function TemplatesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const systemTemplates = await db
    .select({
      id: templates.id,
      slug: templates.slug,
      name: templates.name,
      category: templates.category,
      description: templates.description,
      slideCount: templates.slideCount,
      themeId: templates.themeId,
    })
    .from(templates)
    .where(eq(templates.isSystem, true))
    .orderBy(templates.name);

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Modèles</h1>
          <p className="text-sm text-zinc-400">
            Démarrez depuis un funnel éprouvé. Chaque modèle inclut le script, les notes et la structure complète.
          </p>
        </div>

        {systemTemplates.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
            <FileText className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 text-sm">Aucun modèle disponible.</p>
            <p className="text-zinc-500 text-xs mt-1">
              Exécutez <code className="font-mono bg-zinc-800 px-1 rounded">npm run db:seed</code> pour charger les modèles système.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {systemTemplates.map((template) => (
              <div
                key={template.id}
                className="group rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <span className="text-xs font-medium text-violet-400 uppercase tracking-wide">
                      {CATEGORY_LABELS[template.category] ?? template.category}
                    </span>
                    <h2 className="text-base font-semibold text-white mt-0.5">
                      {template.name}
                    </h2>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500 bg-zinc-800 rounded-full px-2 py-0.5">
                    {template.slideCount} slides
                  </span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed mb-5">
                  {template.description}
                </p>
                <Link
                  href={`/app?template=${template.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors group-hover:gap-2"
                >
                  Utiliser ce modèle
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
