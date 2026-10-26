import type { Metadata } from "next";
import { supabaseAuthService } from "@/lib/auth/supabase";
import { ResetPasswordContent } from "./ResetPasswordContent";

export const metadata: Metadata = { title: "Nouveau mot de passe — GetFunnels" };

type SearchParams = Promise<{ code?: string }>;

/**
 * The recovery email lands here with `?code=`. Without a code the form is only usable when the
 * visitor already holds a session (the code was exchanged, then the URL was reloaded).
 */
export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const { code } = await searchParams;
  const hasSession = code ? false : Boolean(await supabaseAuthService.getUser());
  return <ResetPasswordContent code={code ?? null} hasSession={hasSession} />;
}
