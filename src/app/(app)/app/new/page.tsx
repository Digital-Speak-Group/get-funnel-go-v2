import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listSystemThemes } from "@/lib/db/repositories/themes";
import { listSystemTemplates } from "@/lib/db/repositories/templates";
import { GenerationWizard } from "@/components/app/wizard/GenerationWizard";

export const metadata = { title: "Nouveau deck — GetFunnels" };

export default async function NewDeckPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [themes, templates] = await Promise.all([
    listSystemThemes(),
    listSystemTemplates()
  ]);

  return (
    <div className="flex-1 flex flex-col">
      <GenerationWizard themes={themes} templates={templates} />
    </div>
  );
}
