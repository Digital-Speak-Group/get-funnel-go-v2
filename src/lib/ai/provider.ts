import { z } from "zod";

export type ModelTier = "fast" | "quality";

export type CompletionArgs<T> = {
  tier: ModelTier;
  system: string;
  input: string;
  schema: z.ZodType<T>;
  maxTokens?: number;
  temperature?: number;
};

export type CompletionUsage = {
  inputTokens: number;
  outputTokens: number;
  model: string;
  costCents: number;
};

export type CompletionResult<T> =
  | { success: true; data: T; usage: CompletionUsage }
  | { success: false; error: string; details?: unknown; usage?: CompletionUsage };

export interface AIProvider {
  complete<T>(args: CompletionArgs<T>): Promise<CompletionResult<T>>;
}
