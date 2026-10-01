ALTER TABLE "ai_generations" ALTER COLUMN "input_tokens" SET DATA TYPE integer USING "input_tokens"::integer;--> statement-breakpoint
ALTER TABLE "ai_generations" ALTER COLUMN "output_tokens" SET DATA TYPE integer USING "output_tokens"::integer;--> statement-breakpoint
ALTER TABLE "ai_generations" ALTER COLUMN "cost_cents" SET DATA TYPE integer USING "cost_cents"::integer;--> statement-breakpoint
ALTER TABLE "ai_generations" ALTER COLUMN "duration_ms" SET DATA TYPE integer USING "duration_ms"::integer;--> statement-breakpoint
ALTER TABLE "usage_counters" ALTER COLUMN "period_start" SET DATA TYPE date USING "period_start"::date;--> statement-breakpoint
ALTER TABLE "usage_counters" ALTER COLUMN "ai_credits_used" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "usage_counters" ALTER COLUMN "ai_credits_used" SET DATA TYPE integer USING "ai_credits_used"::integer;--> statement-breakpoint
ALTER TABLE "usage_counters" ALTER COLUMN "ai_credits_used" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "usage_counters" ALTER COLUMN "decks_created" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "usage_counters" ALTER COLUMN "decks_created" SET DATA TYPE integer USING "decks_created"::integer;--> statement-breakpoint
ALTER TABLE "usage_counters" ALTER COLUMN "decks_created" SET DEFAULT 0;