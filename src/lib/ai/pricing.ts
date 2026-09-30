/**
 * Costs per 1 million tokens (USD).
 * Updates to models or pricing should be done here.
 */
const PRICING: Record<string, { input: number; output: number }> = {
  // Groq pricing is virtually free or very low, but let's list their current rates if we were paying,
  // or just 0 if we assume free tier. Let's use 0 for the free tier so the cost tracking works but adds $0.
  "llama3-70b-8192": { input: 0.0, output: 0.0 },
  "llama3-8b-8192": { input: 0.0, output: 0.0 },
  "mixtral-8x7b-32768": { input: 0.0, output: 0.0 },
};

/**
 * Calculates the cost in cents (USD) for a given API call.
 */
export function calculateCostCents(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const rates = PRICING[model];
  if (!rates) {
    console.warn(`[pricing] Unknown model "${model}", recording zero cost`);
    return 0;
  }

  const inputCostDollars = (inputTokens / 1_000_000) * rates.input;
  const outputCostDollars = (outputTokens / 1_000_000) * rates.output;

  return (inputCostDollars + outputCostDollars) * 100;
}
