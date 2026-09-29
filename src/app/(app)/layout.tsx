import { createSupabaseServerClient } from "@/lib/auth/supabase";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Shell } from "@/components/app/Shell";

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

  return (
    <Shell
      userName={user.email?.split("@")[0] ?? "Utilisateur"}
      userEmail={user.email ?? ""}
      orgName="Mon Organisation"
    >
      {children}
    </Shell>
  );
}