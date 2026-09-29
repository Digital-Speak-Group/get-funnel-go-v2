import * as React from "react";
import { SLIDE_TYPES, type SlideType } from "@/lib/slides/schema";
import type { FC } from "react";
import { CoverSlide } from "./types/cover";
import { StatementSlide } from "./types/statement";
import { AuthoritySlide } from "./types/authority";
import { ProblemSlide } from "./types/problem";
import { DefinitionSlide } from "./types/definition";
import { WhySlide } from "./types/why";
import { BenefitsSlide } from "./types/benefits";
import { ObjectivesSlide } from "./types/objectives";
import { FlowSlide } from "./types/flow";
import { ArchitectureSlide } from "./types/architecture";
import { CaptureSlide } from "./types/capture";
import { QualificationSlide } from "./types/qualification";
import { AutomationSlide } from "./types/automation";
import { ChannelSlide } from "./types/channel";
import { CrmSlide } from "./types/crm";
import { AnalyticsSlide } from "./types/analytics";
import { GallerySlide } from "./types/gallery";
import { ProofSlide } from "./types/proof";
import { KpiSlide } from "./types/kpi";
import { MistakesSlide } from "./types/mistakes";
import { PlanSlide } from "./types/plan";
import { PricingSlide } from "./types/pricing";
import { FaqSlide } from "./types/faq";
import { ComparisonSlide } from "./types/comparison";
import { TimelineSlide } from "./types/timeline";
import { TeamSlide } from "./types/team";
import { CtaSlide } from "./types/cta";

export type SlideComponentProps = {
  content: Record<string, unknown>;
  theme: Record<string, string>;
  notes?: string;
  script?: string;
};

export type SlideComponent = FC<SlideComponentProps>;

const registry = new Map<SlideType, SlideComponent>();

// Register batch 1 (narrative) components
registerSlideComponent("cover", CoverSlide as unknown as SlideComponent);
registerSlideComponent("statement", StatementSlide as unknown as SlideComponent);
registerSlideComponent("authority", AuthoritySlide as unknown as SlideComponent);
registerSlideComponent("problem", ProblemSlide as unknown as SlideComponent);
registerSlideComponent("definition", DefinitionSlide as unknown as SlideComponent);
registerSlideComponent("why", WhySlide as unknown as SlideComponent);
registerSlideComponent("benefits", BenefitsSlide as unknown as SlideComponent);

// Register batch 2 (system) components
registerSlideComponent("objectives", ObjectivesSlide as unknown as SlideComponent);
registerSlideComponent("flow", FlowSlide as unknown as SlideComponent);
registerSlideComponent("architecture", ArchitectureSlide as unknown as SlideComponent);
registerSlideComponent("capture", CaptureSlide as unknown as SlideComponent);
registerSlideComponent("qualification", QualificationSlide as unknown as SlideComponent);
registerSlideComponent("automation", AutomationSlide as unknown as SlideComponent);
registerSlideComponent("channel", ChannelSlide as unknown as SlideComponent);

// Register batch 3 (proof, plan, cta) components
registerSlideComponent("crm", CrmSlide as unknown as SlideComponent);
registerSlideComponent("analytics", AnalyticsSlide as unknown as SlideComponent);
registerSlideComponent("gallery", GallerySlide as unknown as SlideComponent);
registerSlideComponent("proof", ProofSlide as unknown as SlideComponent);
registerSlideComponent("kpi", KpiSlide as unknown as SlideComponent);
registerSlideComponent("mistakes", MistakesSlide as unknown as SlideComponent);
registerSlideComponent("plan", PlanSlide as unknown as SlideComponent);
registerSlideComponent("pricing", PricingSlide as unknown as SlideComponent);
registerSlideComponent("faq", FaqSlide as unknown as SlideComponent);
registerSlideComponent("comparison", ComparisonSlide as unknown as SlideComponent);
registerSlideComponent("timeline", TimelineSlide as unknown as SlideComponent);
registerSlideComponent("team", TeamSlide as unknown as SlideComponent);
registerSlideComponent("cta", CtaSlide as unknown as SlideComponent);

export function registerSlideComponent(type: SlideType, component: SlideComponent) {
  registry.set(type, component);
}

export function getSlideComponent(type: SlideType): SlideComponent | undefined {
  return registry.get(type);
}

export function hasSlideComponent(type: SlideType): boolean {
  return registry.has(type);
}

export function getRegisteredTypes(): SlideType[] {
  return Array.from(registry.keys());
}

export function assertRegistryComplete(): void {
  const missing = SLIDE_TYPES.filter((t) => !registry.has(t));
  if (missing.length > 0) {
    throw new Error(`Missing slide components for types: ${missing.join(", ")}`);
  }
}

export const UnknownSlide: SlideComponent = ({ content }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      padding: "48px",
      background: "var(--slide-surface)",
      border: "2px dashed var(--slide-muted)",
      borderRadius: "var(--slide-radius)",
      color: "var(--slide-muted)",
      fontFamily: "var(--slide-font-body)",
      gap: "16px",
    }}
  >
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <div>
      <p style={{ fontWeight: 600, fontSize: "18px" }}>Type de slide inconnu</p>
      <p style={{ fontSize: "14px" }}>Aucun composant enregistré pour ce type</p>
      <pre style={{ fontSize: "11px", opacity: 0.6, marginTop: "8px", textAlign: "left" }}>
        {JSON.stringify(content, null, 2)}
      </pre>
    </div>
  </div>
);