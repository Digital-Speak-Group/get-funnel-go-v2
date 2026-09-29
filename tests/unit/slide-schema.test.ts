import { describe, it, expect } from "vitest";
import {
  SLIDE_TYPES,
  SlideSchema,
  DeckSchema,
  type Slide,
  type Deck,
} from "@/lib/slides/schema";

function uuid() {
  return "00000000-0000-4000-8000-000000000001";
}

function baseSlide(type: (typeof SLIDE_TYPES)[number], content: Record<string, unknown>) {
  return {
    id: uuid(),
    position: 0,
    type,
    content,
    notes: "Notes du présentateur",
    script: "Script pour le présentateur",
  };
}

describe("SlideSchema — 27 types", () => {
  it("cover — valid", () => {
    const slide = baseSlide("cover", {
      kicker: "Bienvenue",
      title: "Ma Présentation",
      subtitle: "Sous-titre optionnel",
      presenterName: "Jean Dupont",
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("cover — rejects missing title", () => {
    const slide = baseSlide("cover", { subtitle: "Only subtitle" });
    expect(() => SlideSchema.parse(slide)).toThrow();
  });

  it("statement — valid", () => {
    const slide = baseSlide("statement", {
      eyebrow: "Étiquette",
      headline: "Titre principal",
      highlight: "Mis en évidence",
      sub: "Sous-titre",
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("statement — rejects empty headline", () => {
    const slide = baseSlide("statement", { headline: "" });
    expect(() => SlideSchema.parse(slide)).toThrow();
  });

  it("authority — valid", () => {
    const slide = baseSlide("authority", {
      headline: "Mon expertise",
      points: [
        { icon: "🏆", title: "Point 1", text: "Description 1" },
        { title: "Point 2", text: "Description 2" },
        { title: "Point 3", text: "Description 3" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("authority — rejects less than 2 points", () => {
    const slide = baseSlide("authority", {
      headline: "Test",
      points: [{ title: "Seul", text: "Un seul" }],
    });
    expect(() => SlideSchema.parse(slide)).toThrow();
  });

  it("authority — rejects more than 4 points", () => {
    const slide = baseSlide("authority", {
      headline: "Test",
      points: [
        { title: "1", text: "a" },
        { title: "2", text: "b" },
        { title: "3", text: "c" },
        { title: "4", text: "d" },
        { title: "5", text: "e" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).toThrow();
  });

  it("problem — valid", () => {
    const slide = baseSlide("problem", {
      headline: "Le problème",
      intro: "Introduction optionnelle",
      painPoints: [
        { icon: "😰", title: "Douleur 1", text: "Description" },
        { title: "Douleur 2", text: "Description" },
        { title: "Douleur 3", text: "Description" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("problem — rejects less than 3 painPoints", () => {
    const slide = baseSlide("problem", {
      headline: "Test",
      painPoints: [{ title: "1", text: "a" }, { title: "2", text: "b" }],
    });
    expect(() => SlideSchema.parse(slide)).toThrow();
  });

  it("definition — valid", () => {
    const slide = baseSlide("definition", {
      headline: "Définition",
      body: "Corps de texte",
      pillars: [
        { title: "Pilier 1", text: "Desc" },
        { title: "Pilier 2", text: "Desc" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("definition — pillars optional", () => {
    const slide = baseSlide("definition", { headline: "Test", body: "Body only" });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("why — valid", () => {
    const slide = baseSlide("why", {
      headline: "Pourquoi",
      reasons: [
        { title: "Raison 1", text: "Desc" },
        { title: "Raison 2", text: "Desc" },
        { title: "Raison 3", text: "Desc" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("objectives — valid", () => {
    const slide = baseSlide("objectives", {
      headline: "Objectifs",
      goals: [
        { label: "Obj 1", target: "Cible 1", text: "Description" },
        { label: "Obj 2", target: "Cible 2", text: "Description" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("flow — valid", () => {
    const slide = baseSlide("flow", {
      headline: "Processus",
      steps: [
        { label: "1", title: "Étape 1", text: "Desc", channel: "email" },
        { label: "2", title: "Étape 2", text: "Desc" },
        { label: "3", title: "Étape 3", text: "Desc" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("flow — rejects less than 3 steps", () => {
    const slide = baseSlide("flow", {
      headline: "Test",
      steps: [
        { label: "1", title: "Étape 1", text: "Desc" },
        { label: "2", title: "Étape 2", text: "Desc" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).toThrow();
  });

  it("architecture — valid", () => {
    const slide = baseSlide("architecture", {
      headline: "Architecture",
      layers: [
        { name: "Couche 1", items: ["Item 1", "Item 2"] },
        { name: "Couche 2", items: ["Item 3"] },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("capture — valid", () => {
    const slide = baseSlide("capture", {
      headline: "Capture",
      fields: [
        { label: "Email", type: "email" },
        { label: "Téléphone", type: "phone" },
      ],
      ctaLabel: "S'inscrire",
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("qualification — valid", () => {
    const slide = baseSlide("qualification", {
      headline: "Qualification",
      questions: [
        { question: "Q1 ?", options: ["A", "B"] },
        { question: "Q2 ?", options: ["C", "D"] },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("automation — valid", () => {
    const slide = baseSlide("automation", {
      headline: "Automatisation",
      items: [
        { trigger: "Déclencheur 1", action: "Action 1", delay: "1h" },
        { trigger: "Déclencheur 2", action: "Action 2" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("channel — valid", () => {
    const slide = baseSlide("channel", {
      headline: "Canal",
      channel: "whatsapp",
      scripts: [{ moment: "Début", message: "Message" }],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("channel — rejects invalid channel", () => {
    const slide = baseSlide("channel", {
      headline: "Test",
      channel: "telegram",
      scripts: [{ moment: "M", message: "Msg" }],
    });
    expect(() => SlideSchema.parse(slide)).toThrow();
  });

  it("crm — valid", () => {
    const slide = baseSlide("crm", {
      headline: "CRM",
      pipelines: [
        { stage: "Prospect", definition: "Définition" },
        { stage: "Qualifié", definition: "Définition" },
        { stage: "Proposition", definition: "Définition" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("analytics — valid", () => {
    const slide = baseSlide("analytics", {
      headline: "Analytics",
      metrics: [
        { name: "Métrique 1", definition: "Def", target: "100" },
        { name: "Métrique 2", definition: "Def", target: "200" },
        { name: "Métrique 3", definition: "Def" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("gallery — valid", () => {
    const slide = baseSlide("gallery", {
      headline: "Galerie",
      items: [
        { caption: "Image 1", assetId: uuid() },
        { caption: "Image 2" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("proof — valid", () => {
    const slide = baseSlide("proof", {
      headline: "Preuves",
      items: [
        { name: "Client 1", role: "CEO", result: "+50%", quote: "Témoignage" },
        { name: "Client 2", role: "CTO" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("benefits — valid", () => {
    const slide = baseSlide("benefits", {
      headline: "Avantages",
      benefits: [
        { title: "Avantage 1", text: "Description" },
        { title: "Avantage 2", text: "Description" },
        { title: "Avantage 3", text: "Description" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("kpi — valid", () => {
    const slide = baseSlide("kpi", {
      headline: "KPIs",
      metrics: [
        { value: "100", label: "Métrique 1", delta: "+10%" },
        { value: "200", label: "Métrique 2" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("mistakes — valid", () => {
    const slide = baseSlide("mistakes", {
      headline: "Erreurs",
      mistakes: [
        { mistake: "Erreur 1", fix: "Correction 1" },
        { mistake: "Erreur 2", fix: "Correction 2" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("plan — valid", () => {
    const slide = baseSlide("plan", {
      headline: "Plan",
      phases: [
        { name: "Phase 1", duration: "1 mois", deliverables: ["Livrable 1", "Livrable 2"] },
        { name: "Phase 2", deliverables: ["Livrable 3"] },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("pricing — valid", () => {
    const slide = baseSlide("pricing", {
      headline: "Tarifs",
      tiers: [
        {
          name: "Basique",
          price: "99€",
          features: ["Fonctionnalité 1", "Fonctionnalité 2"],
          highlight: false,
        },
        {
          name: "Pro",
          price: "299€",
          features: ["Tout du basique", "Plus"],
          highlight: true,
        },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("pricing — rejects more than 3 tiers", () => {
    const slide = baseSlide("pricing", {
      headline: "Test",
      tiers: [
        { name: "1", features: ["a"] },
        { name: "2", features: ["b"] },
        { name: "3", features: ["c"] },
        { name: "4", features: ["d"] },
      ],
    });
    expect(() => SlideSchema.parse(slide)).toThrow();
  });

  it("faq — valid", () => {
    const slide = baseSlide("faq", {
      headline: "FAQ",
      questions: [
        { q: "Question 1 ?", a: "Réponse 1" },
        { q: "Question 2 ?", a: "Réponse 2" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("comparison — valid", () => {
    const slide = baseSlide("comparison", {
      headline: "Comparaison",
      columns: ["Notre", "Concurrent"],
      rows: [
        { label: "Fonctionnalité", values: ["Oui", "Non"] },
        { label: "Prix", values: ["99€", "199€"] },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("timeline — valid", () => {
    const slide = baseSlide("timeline", {
      headline: "Timeline",
      milestones: [
        { when: "Mois 1", title: "Lancement", text: "Description" },
        { when: "Mois 2", title: "Croissance" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("team — valid", () => {
    const slide = baseSlide("team", {
      headline: "Équipe",
      members: [
        { name: "Jean", role: "CEO", proof: "10 ans exp" },
        { name: "Marie", role: "CTO" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("cta — valid", () => {
    const slide = baseSlide("cta", {
      headline: "Agir maintenant",
      sub: "Sous-titre",
      actions: [
        { label: "Réserver", kind: "calendar" },
        { label: "Contact", kind: "whatsapp" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).not.toThrow();
  });

  it("cta — rejects more than 2 actions", () => {
    const slide = baseSlide("cta", {
      headline: "Test",
      actions: [
        { label: "1", kind: "calendar" },
        { label: "2", kind: "link" },
        { label: "3", kind: "form" },
      ],
    });
    expect(() => SlideSchema.parse(slide)).toThrow();
  });

  it("rejects unknown type", () => {
    const slide = { ...baseSlide("cover", { title: "Test" }), type: "unknown" };
    expect(() => SlideSchema.parse(slide)).toThrow();
  });

  it("rejects invalid UUID", () => {
    const slide = { ...baseSlide("cover", { title: "Test" }), id: "not-a-uuid" };
    expect(() => SlideSchema.parse(slide)).toThrow();
  });

  it("rejects negative position", () => {
    const slide = { ...baseSlide("cover", { title: "Test" }), position: -1 };
    expect(() => SlideSchema.parse(slide)).toThrow();
  });

  it("rejects notes too long", () => {
    const slide = {
      ...baseSlide("cover", { title: "Test" }),
      notes: "a".repeat(2001),
    };
    expect(() => SlideSchema.parse(slide)).toThrow();
  });

  it("rejects script too long", () => {
    const slide = {
      ...baseSlide("cover", { title: "Test" }),
      script: "a".repeat(4001),
    };
    expect(() => SlideSchema.parse(slide)).toThrow();
  });
});

describe("DeckSchema", () => {
  function validSlide(type: (typeof SLIDE_TYPES)[number], index: number) {
    return {
      id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      position: index,
      type,
      content:
        type === "cover"
          ? { title: `Slide ${index}` }
          : type === "statement"
          ? { headline: `Slide ${index}` }
          : type === "authority"
          ? {
              headline: `Slide ${index}`,
              points: [
                { title: "A", text: "B" },
                { title: "C", text: "D" },
              ],
            }
          : type === "problem"
          ? {
              headline: `Slide ${index}`,
              painPoints: [
                { title: "A", text: "B" },
                { title: "C", text: "D" },
                { title: "E", text: "F" },
              ],
            }
          : type === "definition"
          ? { headline: `Slide ${index}`, body: "Body" }
          : type === "why"
          ? {
              headline: `Slide ${index}`,
              reasons: [
                { title: "A", text: "B" },
                { title: "C", text: "D" },
                { title: "E", text: "F" },
              ],
            }
          : type === "objectives"
          ? {
              headline: `Slide ${index}`,
              goals: [
                { label: "G1", target: "T1", text: "D" },
                { label: "G2", target: "T2", text: "D" },
              ],
            }
          : type === "flow"
          ? {
              headline: `Slide ${index}`,
              steps: [
                { label: "1", title: "S1", text: "D" },
                { label: "2", title: "S2", text: "D" },
                { label: "3", title: "S3", text: "D" },
              ],
            }
          : type === "architecture"
          ? {
              headline: `Slide ${index}`,
              layers: [
                { name: "L1", items: ["I1"] },
                { name: "L2", items: ["I2"] },
              ],
            }
          : type === "capture"
          ? {
              headline: `Slide ${index}`,
              fields: [{ label: "Email", type: "email" }],
              ctaLabel: "OK",
            }
          : type === "qualification"
          ? {
              headline: `Slide ${index}`,
              questions: [
                { question: "Q1?", options: ["A", "B"] },
                { question: "Q2?", options: ["C", "D"] },
              ],
            }
          : type === "automation"
          ? {
              headline: `Slide ${index}`,
              items: [{ trigger: "T", action: "A" }, { trigger: "T", action: "A" }],
            }
          : type === "channel"
          ? {
              headline: `Slide ${index}`,
              channel: "email",
              scripts: [{ moment: "M", message: "Msg" }],
            }
          : type === "crm"
          ? {
              headline: `Slide ${index}`,
              pipelines: [
                { stage: "S1", definition: "D" },
                { stage: "S2", definition: "D" },
                { stage: "S3", definition: "D" },
              ],
            }
          : type === "analytics"
          ? {
              headline: `Slide ${index}`,
              metrics: [
                { name: "M1", definition: "D" },
                { name: "M2", definition: "D" },
                { name: "M3", definition: "D" },
              ],
            }
          : type === "gallery"
          ? {
              headline: `Slide ${index}`,
              items: [{ caption: "C1" }, { caption: "C2" }],
            }
          : type === "proof"
          ? {
              headline: `Slide ${index}`,
              items: [{ name: "N1" }],
            }
          : type === "benefits"
          ? {
              headline: `Slide ${index}`,
              benefits: [
                { title: "B1", text: "T" },
                { title: "B2", text: "T" },
                { title: "B3", text: "T" },
              ],
            }
          : type === "kpi"
          ? {
              headline: `Slide ${index}`,
              metrics: [
                { value: "1", label: "L1" },
                { value: "2", label: "L2" },
              ],
            }
          : type === "mistakes"
          ? {
              headline: `Slide ${index}`,
              mistakes: [
                { mistake: "M1", fix: "F1" },
                { mistake: "M2", fix: "F2" },
              ],
            }
          : type === "plan"
          ? {
              headline: `Slide ${index}`,
              phases: [
                { name: "P1", deliverables: ["D1"] },
                { name: "P2", deliverables: ["D2"] },
              ],
            }
          : type === "pricing"
          ? {
              headline: `Slide ${index}`,
              tiers: [{ name: "T1", features: ["F1"] }],
            }
          : type === "faq"
          ? {
              headline: `Slide ${index}`,
              questions: [
                { q: "Q1", a: "A1" },
                { q: "Q2", a: "A2" },
              ],
            }
          : type === "comparison"
          ? {
              headline: `Slide ${index}`,
              columns: ["A", "B"],
              rows: [
                { label: "L1", values: ["V1", "V2"] },
                { label: "L2", values: ["V3", "V4"] },
              ],
            }
          : type === "timeline"
          ? {
              headline: `Slide ${index}`,
              milestones: [
                { when: "W1", title: "T1" },
                { when: "W2", title: "T2" },
              ],
            }
          : type === "team"
          ? {
              headline: `Slide ${index}`,
              members: [{ name: "N1", role: "R1" }],
            }
          : {
              headline: `Slide ${index}`,
              actions: [{ label: "Act", kind: "link" }],
            },
    };
  }

  it("accepts valid deck with 5 slides (minimum)", () => {
    const deck = {
      title: "Mon Deck",
      language: "fr",
      slides: SLIDE_TYPES.slice(0, 5).map((t, i) => validSlide(t, i)),
    };
    expect(() => DeckSchema.parse(deck)).not.toThrow();
  });

  it("accepts valid deck with 40 slides (maximum)", () => {
    const slides: Slide[] = [];
    for (let i = 0; i < 40; i++) {
      slides.push(validSlide(SLIDE_TYPES[i % SLIDE_TYPES.length], i));
    }
    const deck = { title: "Mon Deck", language: "fr", slides };
    expect(() => DeckSchema.parse(deck)).not.toThrow();
  });

  it("rejects deck with less than 5 slides", () => {
    const deck = {
      title: "Mon Deck",
      language: "fr",
      slides: SLIDE_TYPES.slice(0, 4).map((t, i) => validSlide(t, i)),
    };
    expect(() => DeckSchema.parse(deck)).toThrow();
  });

  it("rejects deck with more than 40 slides", () => {
    const slides: Slide[] = [];
    for (let i = 0; i < 41; i++) {
      slides.push(validSlide(SLIDE_TYPES[i % SLIDE_TYPES.length], i));
    }
    const deck = { title: "Mon Deck", language: "fr", slides };
    expect(() => DeckSchema.parse(deck)).toThrow();
  });

  it("rejects invalid language code (not 2 chars)", () => {
    const deck = {
      title: "Mon Deck",
      language: "fra",
      slides: SLIDE_TYPES.slice(0, 5).map((t, i) => validSlide(t, i)),
    };
    expect(() => DeckSchema.parse(deck)).toThrow();
  });

  it("rejects empty title", () => {
    const deck = {
      title: "",
      language: "fr",
      slides: SLIDE_TYPES.slice(0, 5).map((t, i) => validSlide(t, i)),
    };
    expect(() => DeckSchema.parse(deck)).toThrow();
  });

  it("rejects title too long", () => {
    const deck = {
      title: "a".repeat(121),
      language: "fr",
      slides: SLIDE_TYPES.slice(0, 5).map((t, i) => validSlide(t, i)),
    };
    expect(() => DeckSchema.parse(deck)).toThrow();
  });

  it("exports usable types", () => {
    const _slide: Slide = validSlide("cover", 0);
    const _deck: Deck = {
      title: "Test",
      language: "fr",
      slides: SLIDE_TYPES.slice(0, 5).map((t, i) => validSlide(t, i)),
    };
    expect(_slide.type).toBe("cover");
    expect(_deck.slides.length).toBe(5);
  });
});