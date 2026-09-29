import { supabaseAuthService } from "@/lib/auth/supabase";
import type { Session } from "@/lib/auth/types";

let cachedSession: Session | null = null;
let sessionPromise: Promise<Session | null> | null = null;

export async function getSession(): Promise<Session | null> {
  if (cachedSession) {
    return cachedSession;
  }

  if (sessionPromise) {
    return sessionPromise;
  }

  sessionPromise = (async () => {
    const session = await supabaseAuthService.getSession();
    cachedSession = session;
    return session;
  })();

  try {
    return await sessionPromise;
  } finally {
    sessionPromise = null;
  }
}

export function clearSessionCache() {
  cachedSession = null;
}