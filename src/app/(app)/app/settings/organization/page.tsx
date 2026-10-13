import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrganization } from "@/lib/db/repositories/organizations";
import { listOrgMembers } from "@/lib/db/repositories/memberships";
import { Building2, CreditCard, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/app/patterns/SectionCard";
import { PLANS, type PlanType } from "@/server/services/billing";
import { FieldList, FieldRow } from "../_components/FieldList";
import { MembersTable } from "../_components/MembersTable";
import { settingsMessages } from "../messages";

const m = settingsMessages.organization;

export const metadata = { title: m.metaTitle };

export default async function OrganizationSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const ctx = { orgId: session.activeOrgId };
  const [org, members] = await Promise.all([
    getOrganization(ctx),
    listOrgMembers(ctx),
  ]);

  const planName = org ? (PLANS[org.plan as PlanType]?.name ?? org.plan) : settingsMessages.empty;

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
          <FieldRow icon={Building2} label={m.name}>
            {org?.name ?? settingsMessages.empty}
          </FieldRow>
          <FieldRow icon={Link2} label={m.slug} mono>
            {org?.slug ?? settingsMessages.empty}
          </FieldRow>
          <FieldRow icon={CreditCard} label={m.plan}>
            {planName}
          </FieldRow>
        </FieldList>
      </SectionCard>

      <SectionCard
        title={settingsMessages.members.title}
        description={settingsMessages.members.description(members.length)}
        footerNote={settingsMessages.members.comingSoon}
      >
        <MembersTable members={members} currentUserId={session.userId} />
      </SectionCard>
    </div>
  );
}
