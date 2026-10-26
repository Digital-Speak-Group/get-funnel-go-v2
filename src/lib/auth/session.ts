/// <reference types="react/canary" />
import "server-only";
import * as React from "react";
import { supabaseAuthService } from "@/lib/auth/supabase";
import type { Session } from "@/lib/auth/types";

// Memoize per request only. A module-level cache would be shared by every request the
// server handles, leaking one user's session (and org) to another.
// React.cache exists in the React build Next.js uses for server rendering; outside it
// (e.g. unit tests on stock React 18) fall back to no memoization.
const perRequest: <T extends (...args: never[]) => unknown>(fn: T) => T =
  typeof React.cache === "function" ? React.cache : (fn) => fn;

export const getSession: () => Promise<Session | null> = perRequest(() =>
  supabaseAuthService.getSession()
);
