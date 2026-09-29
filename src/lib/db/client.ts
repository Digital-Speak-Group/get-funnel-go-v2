import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

export const db = drizzle({ client: pool });

export async function closePool() {
  await pool.end();
}