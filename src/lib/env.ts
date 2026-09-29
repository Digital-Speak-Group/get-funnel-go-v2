import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  AUTH_SECRET: z.string().min(32).optional(),
  ANTHROPIC_API_KEY: z.string().min(1),
  AI_MODEL_FAST: z.string().min(1),
  AI_MODEL_QUALITY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  SEED_DEMO_PASSWORD: z.string().min(1).optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

function validateEnv<T extends z.ZodTypeAny>(schema: T, env: Record<string, string | undefined>, prefix: string) {
  const result = schema.safeParse(env);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const msg = Object.entries(errors)
      .map(([k, v]: [string, unknown]) => `${prefix}${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${msg}`);
  }
  return result.data;
}

const serverEnv = validateEnv(serverSchema, process.env, "");
const clientEnv = validateEnv(clientSchema, process.env, "NEXT_PUBLIC_");

export const env = {
  ...serverEnv,
  ...clientEnv,
} as const;

export type Env = typeof env;