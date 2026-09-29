import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { AuthService, Session } from "@/lib/auth/types";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

export function createSupabaseServiceRoleClient() {
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function resolveActiveOrgId(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string
): Promise<string | null> {
  const { data: memberships } = await supabase
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", userId)
    .order("role", { ascending: true });

  if (!memberships || memberships.length === 0) {
    return null;
  }

  return memberships[0].org_id;
}

export const supabaseAuthService: AuthService = {
  async getSession(): Promise<Session | null> {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const activeOrgId = await resolveActiveOrgId(supabase, user.id);

    if (!activeOrgId) {
      return null;
    }

    const { data: membership } = await supabase
      .from("memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", activeOrgId)
      .single();

    return {
      userId: user.id,
      activeOrgId,
      role: membership?.role ?? "viewer",
    };
  },

  async signIn(email: string, password: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message };
  },

  async signUp(email: string, password: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${env.NEXT_PUBLIC_APP_URL}/callback`,
      },
    });
    return { error: error?.message };
  },

  async signOut() {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  },

  async resetPassword(email: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });
    return { error: error?.message };
  },

  async updatePassword(password: string) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message };
  },

  async getUser() {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { id: user.id, email: user.email ?? "" };
  },
};