import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { User, Mail, Globe } from "lucide-react";

export const metadata = { title: "Profil — GetFunnels" };

export default async function ProfileSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.userId))
    .limit(1);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Profil utilisateur</h2>
        <p className="text-sm text-zinc-400 mb-6">
          Informations associées à votre compte.
        </p>

        <dl className="space-y-4">
          <div className="flex items-center gap-3 py-3 border-b border-zinc-800">
            <User className="h-4 w-4 text-zinc-500 shrink-0" />
            <div className="min-w-0">
              <dt className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">Nom complet</dt>
              <dd className="text-sm text-white font-medium truncate">
                {profile?.fullName ?? "—"}
              </dd>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 border-b border-zinc-800">
            <Mail className="h-4 w-4 text-zinc-500 shrink-0" />
            <div className="min-w-0">
              <dt className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">Adresse email</dt>
              <dd className="text-sm text-white font-medium truncate">
                {profile?.email ?? "—"}
              </dd>
            </div>
          </div>

          <div className="flex items-center gap-3 py-3">
            <Globe className="h-4 w-4 text-zinc-500 shrink-0" />
            <div className="min-w-0">
              <dt className="text-xs text-zinc-500 uppercase tracking-wide mb-0.5">Langue</dt>
              <dd className="text-sm text-white font-medium">
                {profile?.locale === "fr" ? "Français" : profile?.locale ?? "—"}
              </dd>
            </div>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-sm text-zinc-500">
          La modification du profil sera disponible prochainement.
        </p>
      </div>
    </div>
  );
}
