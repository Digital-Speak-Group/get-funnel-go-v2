import { createSupabaseServerClient } from "@/lib/auth/supabase";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

/** Bare layout for full-bleed views — no sidebar, no topbar */
export default async function PresentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const session = await getSession();
  if (!session) redirect("/onboarding");

  return <>{children}</>;
}
