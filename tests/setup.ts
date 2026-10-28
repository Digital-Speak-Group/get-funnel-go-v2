import { beforeAll, afterAll, vi } from "vitest";
import * as dotenv from "dotenv";

dotenv.config();
vi.mock("server-only", () => ({}));

// Provide defaults for test runs when .env is not present (e.g. in CI)
const defaultTestEnv: Record<string, string> = {
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/getfunnels_test",
  SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key-dummy",
  AUTH_SECRET: "12345678901234567890123456789012",
  GROQ_API_KEY: "test-groq-dummy",
  AI_MODEL_FAST: "openai/gpt-oss-20b",
  AI_MODEL_QUALITY: "openai/gpt-oss-120b",
  STRIPE_SECRET_KEY: "sk_test_dummy",
  STRIPE_WEBHOOK_SECRET: "whsec_dummy",
  RESEND_API_KEY: "re_dummy",
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-dummy",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_dummy",
  NEXT_PUBLIC_APP_URL: "http://localhost:3005",
};

for (const [key, value] of Object.entries(defaultTestEnv)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

beforeAll(() => {
  // Test setup - e.g., start test containers
});

afterAll(() => {
  // Test teardown
});