import type { SlideType } from "@/lib/slides/schema";
import type { SlideComponent } from "../registry";
import { CoverEditorial, CoverSplit } from "./cover";
import { StatementBanner, StatementLeft } from "./statement";
import { ProblemAside, ProblemList } from "./problem";
import { BenefitsChecklist, BenefitsFeatured } from "./benefits";
import { FlowGrid, FlowTimeline } from "./flow";
import { KpiCards, KpiHero } from "./kpi";
import { ProofQuote, ProofTable } from "./proof";
import { CtaBanner, CtaSplit } from "./cta";

/**
 * Renderers for the non-default layouts in SLIDE_LAYOUTS (src/lib/slides/layouts.ts). The
 * first layout of each type is the type's original component in the registry, so it is not
 * listed here.
 */
const LAYOUT_COMPONENTS: Partial<Record<SlideType, Record<string, unknown>>> = {
  cover: { split: CoverSplit, editorial: CoverEditorial },
  statement: { left: StatementLeft, banner: StatementBanner },
  problem: { list: ProblemList, aside: ProblemAside },
  benefits: { checklist: BenefitsChecklist, featured: BenefitsFeatured },
  flow: { timeline: FlowTimeline, grid: FlowGrid },
  kpi: { cards: KpiCards, hero: KpiHero },
  proof: { quote: ProofQuote, table: ProofTable },
  cta: { split: CtaSplit, banner: CtaBanner },
};

export function getLayoutComponent(type: SlideType, layout?: string): SlideComponent | undefined {
  if (!layout) return undefined;
  return LAYOUT_COMPONENTS[type]?.[layout] as SlideComponent | undefined;
}
