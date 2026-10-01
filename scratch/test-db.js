import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT * FROM "organizations"');
    console.log("Organizations count:", res.rows.length);
  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    await pool.end();
  }
}

main();
