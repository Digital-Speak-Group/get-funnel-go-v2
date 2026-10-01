import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const orgRes = await pool.query("SELECT id FROM organizations WHERE id = $1", ['255d1153-c6b1-4d0a-a6de-3750f6780452']);
    console.log("Org exists?", orgRes.rowCount > 0);

    const userRes = await pool.query("SELECT id FROM profiles WHERE id = $1", ['9325c740-c68d-4b06-9aa8-cfcb55e96caa']);
    console.log("Profile exists?", userRes.rowCount > 0);

    const templateRes = await pool.query("SELECT id FROM templates WHERE id = $1", ['60000000-0000-4000-8000-000000000004']);
    console.log("Template exists?", templateRes.rowCount > 0);

    const themeRes = await pool.query("SELECT id FROM themes WHERE id = $1", ['40000000-0000-4000-8000-000000000002']);
    console.log("Theme exists?", themeRes.rowCount > 0);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
