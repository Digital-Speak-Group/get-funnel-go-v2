import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/auth/supabase";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Shell } from "@/components/app/Shell";
import { SIDEBAR_COOKIE } from "@/components/app/shell-config";
import { getWorkspaceSummary } from "@/server/services/workspace";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // First check: is the user authenticated at all?
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Second check: do they have an org/session?
  const session = await getSession();

  if (!session) {
    // Authenticated but no org → needs onboarding
    redirect("/onboarding");
  }

  const [summary, cookieStore] = await Promise.all([
    getWorkspaceSummary({ orgId: session.activeOrgId }),
    cookies(),
  ]);

  if (!summary) {
    redirect("/onboarding");
  }

  return (
    <Shell
      userName={user.email?.split("@")[0] ?? "Utilisateur"}
      userEmail={user.email ?? ""}
      initialCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "1"}
      workspace={{
        orgName: summary.orgName,
        planName: summary.planName,
        decksCreated: summary.decksCreated,
        decksLimit: summary.decksLimit,
      }}
    >
      {children}
    </Shell>
  );
}
