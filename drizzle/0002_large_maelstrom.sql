ALTER TABLE "ai_generations" ALTER COLUMN "input_tokens" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "ai_generations" ALTER COLUMN "output_tokens" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "ai_generations" ALTER COLUMN "cost_cents" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "ai_generations" ALTER COLUMN "duration_ms" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "usage_counters" ALTER COLUMN "period_start" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "usage_counters" ALTER COLUMN "ai_credits_used" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "usage_counters" ALTER COLUMN "decks_created" SET DATA TYPE integer;