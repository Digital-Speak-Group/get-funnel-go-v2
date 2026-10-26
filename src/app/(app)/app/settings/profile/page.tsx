import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getProfile } from "@/lib/db/repositories/profiles";
import { settingsMessages } from "../messages";
import { ProfileForm } from "./ProfileForm";

const m = settingsMessages.profile;

export const metadata = { title: m.metaTitle };

export default async function ProfileSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const profile = await getProfile(session.userId);

  return (
    <div className="space-y-6">
      <ProfileForm
        initialProfile={{
          fullName: profile?.fullName ?? null,
          email: profile?.email ?? "",
          locale: profile?.locale ?? "fr",
        }}
      />
    </div>
  );
}

