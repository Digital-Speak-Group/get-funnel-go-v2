import type { PoolConfig } from "pg";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * DATABASE_SSL wins when set. Unset falls back to "SSL unless localhost", which
 * suits hosted Postgres (Supabase) but not a private-network host like the
 * compose `postgres` service, so set DATABASE_SSL=false there.
 */
export function resolveDatabaseSsl(databaseUrl: string, flag?: boolean): PoolConfig["ssl"] {
  const useSsl = flag ?? !LOCAL_HOSTS.has(new URL(databaseUrl).hostname);
  return useSsl ? { rejectUnauthorized: false } : false;
}
