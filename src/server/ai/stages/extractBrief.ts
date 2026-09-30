import type { AIProvider, CompletionUsage } from "@/lib/ai/provider";
import { BriefSchema, type Brief } from "../schema";
import { EXTRACT_BRIEF_SYSTEM_PROMPT } from "../prompts/extractBrief";

export async function extractBrief(
  provider: AIProvider,
  script: string
): Promise<{ brief: Brief; usage: CompletionUsage | undefined }> {
  const trimmed = script.trim();
  if (trimmed.length < 300) {
    throw new Error("Script is too short. Please provide at least 300 characters.");
  }
  if (trimmed.length > 30000) {
    throw new Error("Script is too long. Please provide a maximum of 30,000 characters.");
  }

  const result = await provider.complete({
    tier: "fast",
    system: EXTRACT_BRIEF_SYSTEM_PROMPT,
    input: `<SCRIPT>\n${trimmed}\n</SCRIPT>`,
    schema: BriefSchema,
    temperature: 0.2, // low temp for extraction
  });

  if (!result.success) {
    throw new Error(`Failed to extract brief: ${result.error}`);
  }

  // If the model is not confident it's a sales script, we might want to warn or fail.
  // For now, we return it and let the caller decide.
  return {
    brief: result.data,
    usage: result.usage,
  };
}
