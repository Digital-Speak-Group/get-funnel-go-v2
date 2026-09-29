import { beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@/lib/db/schema";

let pool: Pool;
let testDbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let dbAvailable = false;

export function getTestDb() {
  if (!dbAvailable) {
    throw new Error("Database not available");
  }
  return testDbInstance!;
}

export function isDbAvailable() {
  return dbAvailable;
}

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/getfunnels_test";

async function checkDbConnection() {
  const testPool = new Pool({ connectionString });
  try {
    await testPool.query("SELECT 1");
    await testPool.end();
    return true;
  } catch {
    await testPool.end();
    return false;
  }
}

beforeAll(async () => {
  dbAvailable = await checkDbConnection();
  
  if (!dbAvailable) {
    console.log("Database not available, skipping integration tests");
    return;
  }

  pool = new Pool({ connectionString });
  testDbInstance = drizzle({ client: pool, schema });

  // Run migrations
  const fs = await import("fs");
  const path = await import("path");
  const migrationsDir = path.resolve(process.cwd(), "drizzle");
  
  if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();
    
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
      await pool.query(sql);
    }
  }
});

afterAll(async () => {
  if (pool) {
    await pool.end();
  }
});

beforeEach(async () => {
  if (!dbAvailable) {
    return;
  }
  
  // Truncate all tables in reverse dependency order
  const tables = [
    "assets", "subscriptions", "usage_counters", "ai_generations",
    "session_events", "sessions", "deck_versions", "slides", "decks",
    "templates", "themes", "invites", "memberships", "profiles", "organizations"
  ];
  
  for (const table of tables) {
    await pool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
  }
});

afterEach(async () => {
  // Cleanup if needed
});