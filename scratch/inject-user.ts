import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const userId = '9325c740-c68d-4b06-9aa8-cfcb55e96caa';
  const orgId = '255d1153-c6b1-4d0a-a6de-3750f6780452';

  try {
    console.log("Injecting user and org into local database...");
    
    // Insert organization
    await pool.query(
      `INSERT INTO organizations (id, slug, name, plan) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (id) DO NOTHING`,
      [orgId, 'user-org-' + orgId.substring(0, 8), 'User Organization', 'pro']
    );
    console.log("Organization injected.");

    // Insert profile
    await pool.query(
      `INSERT INTO profiles (id, email, full_name, locale) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (id) DO NOTHING`,
      [userId, 'devuser@example.com', 'Developer User', 'fr']
    );
    console.log("Profile injected.");

    // Insert membership
    await pool.query(
      `INSERT INTO memberships (org_id, user_id, role) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (org_id, user_id) DO NOTHING`,
      [orgId, userId, 'owner']
    );
    console.log("Membership injected.");

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();
