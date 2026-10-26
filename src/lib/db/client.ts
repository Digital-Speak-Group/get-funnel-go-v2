import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import { resolveDatabaseSsl } from "@/lib/db/ssl";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: resolveDatabaseSsl(env.DATABASE_URL, env.DATABASE_SSL),
});

export const db = drizzle({ client: pool });

export async function closePool() {
  await pool.end();
}
