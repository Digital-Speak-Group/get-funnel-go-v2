import Groq from "groq-sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import { env } from "@/lib/env";
import { calculateCostCents } from "./pricing";
import type {
  AIProvider,
  CompletionArgs,
  CompletionResult,
  CompletionUsage,
} from "./provider";

export class GroqProvider implements AIProvider {
  private client: Groq;

  constructor() {
    this.client = new Groq({
      apiKey: env.GROQ_API_KEY,
    });
  }

  async complete<T>(args: CompletionArgs<T>): Promise<CompletionResult<T>> {
    const model = args.tier === "fast" ? env.AI_MODEL_FAST : env.AI_MODEL_QUALITY;
    // @ts-expect-error zod-to-json-schema type mismatch on strict mode
    const jsonSchema = zodToJsonSchema(args.schema, "OutputSchema");

    const tool = {
      type: "function" as const,
      function: {
        name: "record_output",
        description: "Record the structured output matching the required schema.",
        parameters: (jsonSchema as Record<string, unknown>).definitions
          ? (jsonSchema as { definitions: { OutputSchema: unknown } }).definitions.OutputSchema
          : jsonSchema,
      },
    };

    let inputTokens = 0;
    let outputTokens = 0;
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: args.system },
      { role: "user", content: args.input },
    ];

    try {
      // First attempt
      const response1 = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: args.maxTokens ?? 4096,
        temperature: args.temperature ?? 0.2,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [tool as any],
        tool_choice: { type: "function", function: { name: "record_output" } },
      });

      inputTokens += response1.usage?.prompt_tokens ?? 0;
      outputTokens += response1.usage?.completion_tokens ?? 0;

      const toolCall1 = response1.choices[0]?.message?.tool_calls?.find(
        (c) => c.function.name === "record_output"
      );

      if (!toolCall1) {
        return {
          success: false,
          error: "Model did not use the requested output tool.",
          usage: this.buildUsage(inputTokens, outputTokens, model),
        };
      }

      // Validate against Zod schema
      const parsed1 = args.schema.safeParse(JSON.parse(toolCall1.function.arguments));
      if (parsed1.success) {
        return {
          success: true,
          data: parsed1.data,
          usage: this.buildUsage(inputTokens, outputTokens, model),
        };
      }

      // Second attempt (schema-retry logic)
      messages.push(response1.choices[0].message);
      messages.push({
        role: "tool",
        tool_call_id: toolCall1.id,
        content: `Your previous output failed validation. Please fix the following errors and try again:\n${parsed1.error.message}`,
      });

      const response2 = await this.client.chat.completions.create({
        model,
        messages,
        max_tokens: args.maxTokens ?? 4096,
        temperature: args.temperature ?? 0.2,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [tool as any],
        tool_choice: { type: "function", function: { name: "record_output" } },
      });

      inputTokens += response2.usage?.prompt_tokens ?? 0;
      outputTokens += response2.usage?.completion_tokens ?? 0;

      const toolCall2 = response2.choices[0]?.message?.tool_calls?.find(
        (c) => c.function.name === "record_output"
      );

      if (!toolCall2) {
        return {
          success: false,
          error: "Model did not use the requested output tool on retry.",
          usage: this.buildUsage(inputTokens, outputTokens, model),
        };
      }

      const parsed2 = args.schema.safeParse(JSON.parse(toolCall2.function.arguments));
      if (parsed2.success) {
        return {
          success: true,
          data: parsed2.data,
          usage: this.buildUsage(inputTokens, outputTokens, model),
        };
      }

      // Failed again
      return {
        success: false,
        error: "Model failed schema validation twice.",
        details: parsed2.error.format(),
        usage: this.buildUsage(inputTokens, outputTokens, model),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown provider error",
        details: err,
        usage: this.buildUsage(inputTokens, outputTokens, model),
      };
    }
  }

  private buildUsage(
    inputTokens: number,
    outputTokens: number,
    model: string
  ): CompletionUsage {
    return {
      inputTokens,
      outputTokens,
      model,
      costCents: calculateCostCents(model, inputTokens, outputTokens),
    };
  }
}

// Singleton for app usage
let _provider: GroqProvider | null = null;
export function getAIProvider(): AIProvider {
  if (!_provider) _provider = new GroqProvider();
  return _provider;
}
