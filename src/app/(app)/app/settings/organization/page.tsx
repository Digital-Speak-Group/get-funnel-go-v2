import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getOrganization } from "@/lib/db/repositories/organizations";
import { listOrgMembers } from "@/lib/db/repositories/memberships";
import { SectionCard } from "@/components/app/patterns/SectionCard";
import { PLANS, type PlanType } from "@/server/services/billing";
import { MembersTable } from "../_components/MembersTable";
import { settingsMessages } from "../messages";
import { OrganizationForm } from "./OrganizationForm";


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
  const canEdit = session.role === "owner" || session.role === "admin";

  return (
    <div className="space-y-6">
      <OrganizationForm
        initialOrg={{
          name: org?.name ?? "",
          slug: org?.slug ?? "",
          planName,
        }}
        canEdit={canEdit}
      />


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
