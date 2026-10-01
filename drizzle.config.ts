import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

import { env } from "./src/lib/env";

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});