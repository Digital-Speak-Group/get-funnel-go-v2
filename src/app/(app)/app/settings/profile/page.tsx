import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { User, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/app/patterns/SectionCard";
import { FieldList, FieldRow } from "../_components/FieldList";
import { settingsMessages } from "../messages";

const m = settingsMessages.profile;

export const metadata = { title: m.metaTitle };

export default async function ProfileSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.userId))
    .limit(1);

  const locale = profile?.locale ? (m.locales[profile.locale] ?? profile.locale) : settingsMessages.empty;

  return (
    <div className="space-y-6">
      <SectionCard
        title={m.title}
        description={m.description}
        footerNote={m.comingSoon}
        footer={
          <Button size="sm" disabled>
            {settingsMessages.save}
          </Button>
        }
      >
        <FieldList>
          <FieldRow icon={User} label={m.fullName}>
            {profile?.fullName ?? settingsMessages.empty}
          </FieldRow>
          <FieldRow icon={Mail} label={m.email}>
            {profile?.email ?? settingsMessages.empty}
          </FieldRow>
          <FieldRow icon={Globe} label={m.locale}>
            {locale}
          </FieldRow>
        </FieldList>
      </SectionCard>
    </div>
  );
}
