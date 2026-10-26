// Recreates the e2e test account: Supabase auth user (E2E_EMAIL/E2E_PASSWORD from .env)
// + trial org, profile and owner membership in DATABASE_URL, mirroring onboarding.ts.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const env = Object.fromEntries(
  readFileSync(".env", "utf-8")
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map(([, k, v]) => [k, v.replace(/^["']|["']$/g, "")]),
);
const { E2E_EMAIL: email, E2E_PASSWORD: password } = env;
if (!email || !password) throw new Error("E2E_EMAIL / E2E_PASSWORD missing in .env");

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: list, error: listErr } = await sb.auth.admin.listUsers();
if (listErr) throw listErr;
let user = list.users.find((u) => u.email === email);
if (!user) {
  const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  user = data.user;
  console.log("auth user created");
} else {
  console.log("auth user already exists");
}

const client = new pg.Client({ connectionString: env.DATABASE_URL.replace(/\?schema=\w+/, "") });
await client.connect();
try {
  await client.query("BEGIN");
  const { rows: existing } = await client.query(
    "select org_id from memberships where user_id = $1 limit 1",
    [user.id],
  );
  if (existing.length) {
    console.log("membership already exists");
  } else {
    const { rows } = await client.query(
      "insert into organizations (name, slug, plan) values ('E2E Test', $1, 'trial') returning id",
      [`e2e-test-${Date.now().toString(36)}`],
    );
    await client.query(
      "insert into profiles (id, email) values ($1, $2) on conflict (id) do nothing",
      [user.id, email],
    );
    await client.query(
      "insert into memberships (org_id, user_id, role) values ($1, $2, 'owner')",
      [rows[0].id, user.id],
    );
    console.log("org + profile + membership created");
  }
  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  await client.end();
}
