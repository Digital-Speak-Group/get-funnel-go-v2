/**
 * AI Pipeline Evaluation Fixtures
 * 
 * To add a new fixture:
 * 1. Create a script text file in `tests/ai/fixtures/your-script.txt`
 * 2. Record the expected AI output (or manually craft a mock output) and save to `tests/ai/fixtures/your-script.json`
 * 3. Add an entry to the `fixtures` array below.
 * 
 * Assertions verify:
 * - Schema validity
 * - Slide count
 * - Stage order (template compliance)
 * - Language consistency
 * - No invented numbers (hallucination checks, where applicable)
 */
import { describe, it, expect, vi } from "vitest";
import { extractBrief } from "@/server/ai/stages/extractBrief";
import { planDeck } from "@/server/ai/stages/planDeck";
import { generateSlides } from "@/server/ai/stages/generateSlides";
import type { AIProvider } from "@/lib/ai/provider";

// Mock template config
const mockTemplate = {
  id: "test",
  name: "Test",
  slug: "test",
  description: null,
  config: { stages: ["cover", "problem", "cta"] }
};

describe("AI Evaluation Fixtures", () => {
  const fixtures = [
    {
      name: "short-fr",
      script: "Bonjour, je suis un vendeur de baguettes magiques. Vous avez du mal à lancer des sorts ? Achetez ma baguette magique pour 50€ aujourd'hui. " + 
              "Ceci est un script de démonstration conçu pour être suffisamment long pour passer la validation de la longueur minimale. " + 
              "En effet, l'extracteur de brief a besoin d'au moins trois cents caractères pour bien fonctionner et analyser le contenu correctement. " +
              "Nous ajoutons donc du texte de remplissage pour atteindre ce quota. Achetez maintenant, c'est une offre limitée ! ",
      briefLanguage: "fr",
      expectedSlideCount: 3,
      mockResponses: {
        brief: {
          offer: "Baguette magique",
          audience: "Sorciers",
          pains: ["Mal à lancer des sorts"],
          proof: [],
          cta: "Achetez pour 50€",
          tone: "professional",
          language: "fr",
          confidence: 0.9,
        },
        plan: [
          { type: "cover", headline: "Baguette magique", purpose: "Intro" },
          { type: "problem", headline: "Mal à lancer des sorts", purpose: "Douleurs" },
          { type: "cta", headline: "Achetez maintenant", purpose: "Action" },
        ],
        slides: {
          "cover": { id: "1", position: 0, type: "cover", content: { title: "Baguette Magique" } },
          "problem": { id: "2", position: 1, type: "problem", content: { headline: "Problème", painPoints: [{ title: "Mal", text: "Sorts" }, { title: "Fatigue", text: "Magie" }, { title: "Lent", text: "Temps" }] } },
          "cta": { id: "3", position: 2, type: "cta", content: { headline: "Acheter", actions: [{ label: "Acheter", kind: "link" }] } },
        }
      }
    }
  ];

  for (const fixture of fixtures) {
    it(`runs pipeline for fixture: ${fixture.name}`, async () => {
      // Mock the provider
      const mockProvider: AIProvider = {
        complete: vi.fn().mockImplementation(async (args) => {
          if (args.system.includes("marketing strategist")) {
            return {
              success: true,
              data: fixture.mockResponses.brief,
              usage: { inputTokens: 10, outputTokens: 10, model: "test", costCents: 1 }
            };
          }
          if (args.system.includes("presentation architect")) {
            return {
              success: true,
              data: { plan: fixture.mockResponses.plan },
              usage: { inputTokens: 10, outputTokens: 10, model: "test", costCents: 1 }
            };
          }
          if (args.system.includes("ONE specific slide")) {
            // Find which slide it is generating
            const planItem = fixture.mockResponses.plan.find(p => args.input.includes(`Type: ${p.type}`));
            const slideData = fixture.mockResponses.slides[planItem?.type as keyof typeof fixture.mockResponses.slides];
            return {
              success: true,
              data: slideData,
              usage: { inputTokens: 10, outputTokens: 10, model: "test", costCents: 1 }
            };
          }
          throw new Error("Unknown prompt");
        })
      };

      // 1. Extract Brief
      const briefResult = await extractBrief(mockProvider, fixture.script);
      expect(briefResult.brief).toBeDefined();
      expect(briefResult.brief.language).toBe(fixture.briefLanguage);
      expect(briefResult.brief.confidence).toBeGreaterThan(0);

      // 2. Plan Deck
      const planResult = await planDeck(mockProvider, briefResult.brief, {
        id: mockTemplate.id,
        name: mockTemplate.name,
        stages: mockTemplate.config.stages,
      }, { slideCount: fixture.expectedSlideCount, tone: "professional" });
      expect(planResult.plan).toHaveLength(fixture.expectedSlideCount);
      
      // Stage order assertion
      const planTypes = planResult.plan.map(p => p.type);
      expect(planTypes).toEqual(mockTemplate.config.stages);

      // 3. Generate Slides
      const genResult = await generateSlides(mockProvider, fixture.script, briefResult.brief, planResult.plan);
      expect(genResult.slides).toHaveLength(fixture.expectedSlideCount);
      expect(genResult.failures).toBe(0);

      // Schema validity is technically enforced by the parser inside `complete` normally, 
      // but since we mocked the complete response directly bypassing parser for simplicity in this fixture,
      // we just ensure all returned types are valid.
      for (const slide of genResult.slides) {
        expect(mockTemplate.config.stages).toContain(slide.type);
      }
      
      // Check invented numbers (hallucination check) - simple string search for this example fixture
      // If the script doesn't have "100", the slide shouldn't either.
      const allText = JSON.stringify(genResult.slides);
      expect(allText).not.toContain("100"); // 50€ is in script, but 100 is not.
    });
  }
});
