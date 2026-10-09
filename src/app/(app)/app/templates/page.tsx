import { redirect } from "next/navigation";
import { LayoutTemplate } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { listTemplateGallery } from "@/lib/db/repositories/templates";
import { EmptyState } from "@/components/app/patterns/EmptyState";
import { PageHeader } from "@/components/app/patterns/PageHeader";
import { TemplateGallery } from "@/components/app/templates/TemplateGallery";
import { dashboardMessages } from "@/components/app/dashboard/messages";

export const metadata = { title: "Modèles — GetFunnels" };

const m = dashboardMessages.templates;

export default async function TemplatesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const templates = await listTemplateGallery();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={m.title} description={m.description} />
      {templates.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title={m.emptyTitle} description={m.emptyDescription} />
      ) : (
        <TemplateGallery templates={templates} />
      )}
    </div>
  );
}
