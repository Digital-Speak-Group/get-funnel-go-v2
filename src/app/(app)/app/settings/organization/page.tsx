import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { organizations, memberships } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Building2, Link2, Users } from "lucide-react";

export const metadata = { title: "Organisation — GetFunnels" };

export default async function OrganizationSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, session.activeOrgId))
    .limit(1);

  const memberCount = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.orgId, session.activeOrgId)));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Organisation</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Informations de votre espace de travail.
        </p>

        <dl className="space-y-4">
          <div className="flex items-center gap-3 py-3 border-b border-zinc-800">
            <Building2 className="h-4 w-4 text-zinc-500 shrink-0" />
            <div className="min-w-0">
              <dt className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">Nom</dt>
              <dd className="text-sm text-white font-medium truncate">
                {org?.name ?? "—"}
              </dd>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 border-b border-zinc-800">
            <Link2 className="h-4 w-4 text-zinc-500 shrink-0" />
            <div className="min-w-0">
              <dt className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">Identifiant (slug)</dt>
              <dd className="text-sm text-zinc-300 font-mono truncate">
                {org?.slug ?? "—"}
              </dd>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 border-b border-zinc-800">
            <Users className="h-4 w-4 text-zinc-500 shrink-0" />
            <div className="min-w-0">
              <dt className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">Membres</dt>
              <dd className="text-sm text-white font-medium">
                {memberCount.length} membre{memberCount.length > 1 ? "s" : ""}
              </dd>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3">
            <div className="h-4 w-4 shrink-0 flex items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">Plan</dt>
              <dd className="text-sm text-white font-medium capitalize">
                {org?.plan ?? "—"}
              </dd>
            </div>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-sm text-zinc-500">
          La gestion des membres et la modification de l'organisation seront disponibles prochainement.
        </p>
      </div>
    </div>
  );
}
