import type { AIProvider, CompletionUsage } from "@/lib/ai/provider";
import type { Brief, SlidePlan } from "../schema";
import { SlideSchema, type Slide } from "@/lib/slides/schema";
import { GENERATE_SLIDE_SYSTEM_PROMPT } from "../prompts/generateSlide";

export async function generateSlide(
  provider: AIProvider,
  script: string,
  brief: Brief,
  planItem: SlidePlan,
  position: number
): Promise<{ slide: Slide | null; usage: CompletionUsage | null; error?: string }> {
  const input = `
SLIDE TO GENERATE:
Type: ${planItem.type}
Headline / Message: ${planItem.headline}
Purpose: ${planItem.purpose}

BRIEF CONTEXT:
Offer: ${brief.offer}
Audience: ${brief.audience}
Tone: ${brief.tone}
Language: ${brief.language}

RAW SCRIPT (Extract facts from here!):
<SCRIPT>
${script}
</SCRIPT>
`;

  try {
    const result = await provider.complete({
      tier: "quality",
      system: GENERATE_SLIDE_SYSTEM_PROMPT,
      input,
      schema: SlideSchema,
      temperature: 0.7, // Higher temp for copy generation
    });

    if (!result.success) {
      return { slide: null, usage: result.usage ?? null, error: result.error };
    }

    const slide = result.data;
    slide.id = crypto.randomUUID();
    slide.position = position;

    return { slide, usage: result.usage };
  } catch (err: unknown) {
    return { slide: null, usage: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function generateSlides(
  provider: AIProvider,
  script: string,
  brief: Brief,
  plan: SlidePlan[],
  onProgress?: (progress: { completed: number; total: number; currentUsage: CompletionUsage }) => void
): Promise<{ slides: Slide[]; usage: CompletionUsage; failures: number }> {
  const concurrency = 5;
  
  // Helper to run promises with a concurrency limit
  async function asyncPool<T, R>(
    concurrency: number,
    items: T[],
    iteratorFn: (item: T, index: number) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];
    let executing: Promise<void>[] = [];
    let index = 0;

    for (const item of items) {
      const p = Promise.resolve().then(() => iteratorFn(item, index++));
      results.push(p as unknown as R);
      
      const e: Promise<void> = p.then(() => {
        executing = executing.filter(x => x !== e);
      });
      executing.push(e);
      
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
    
    return Promise.all(results);
  }

  const totalUsage: CompletionUsage = { inputTokens: 0, outputTokens: 0, model: "", costCents: 0 };
  let completedCount = 0;
  let failures = 0;

  const results = await asyncPool(concurrency, plan, async (planItem, index) => {
    const res = await generateSlide(provider, script, brief, planItem, index);
    
    if (res.usage) {
      totalUsage.inputTokens += res.usage.inputTokens;
      totalUsage.outputTokens += res.usage.outputTokens;
      totalUsage.costCents += res.usage.costCents;
      totalUsage.model = res.usage.model; 
    }
    
    completedCount++;
    if (!res.slide) {
      failures++;
    }
    
    if (onProgress) {
      onProgress({ completed: completedCount, total: plan.length, currentUsage: totalUsage });
    }

    return res.slide;
  });
  
  // Filter out failed slides. We don't fail the whole deck for one failed slide.
  const slides = results.filter((s): s is Slide => s !== null);

  // Fix positions if any slides failed
  slides.forEach((s, i) => {
    s.position = i;
  });

  return {
    slides,
    usage: totalUsage,
    failures,
  };
}
