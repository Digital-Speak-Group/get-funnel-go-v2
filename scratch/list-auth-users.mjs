// Lists auth users in the Supabase project from .env (emails only, no secrets printed).
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env", "utf-8")
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map(([, k, v]) => [k, v.replace(/^["']|["']$/g, "")]),
);

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const { data, error } = await sb.auth.admin.listUsers();
if (error) {
  console.error("ERROR:", error.message);
  process.exit(1);
}
console.log(`project: ${new URL(env.NEXT_PUBLIC_SUPABASE_URL).host}`);
for (const u of data.users) console.log(`${u.email}  confirmed=${!!u.email_confirmed_at}  id=${u.id}`);
console.log(`total: ${data.users.length}`);
