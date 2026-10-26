import * as React from "react";
import { MonitorPlay, Presentation } from "lucide-react";
import { Kbd } from "@/components/app/patterns/Kbd";
import { MetricsPanel } from "@/components/presenter/MetricsPanel";
import { ScriptPanel } from "@/components/presenter/ScriptPanel";
import { Badge } from "@/components/ui/badge";
import { presenterShowcase as demo } from "../_lib/showcase";
import { marketingMessages } from "../messages";
import { LazySlide } from "./LazySlide";
import { Section, SectionHeading } from "./Section";

const m = marketingMessages.presenter;

function PanelHeader({ icon: Icon, label, children }: { icon: typeof Presentation; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border px-4 py-3">
      <h3 className="flex items-center gap-2 text-small font-medium text-foreground">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        {label}
      </h3>
      {children}
    </div>
  );
}

/**
 * The presenter and audience views, built from the real presenter components (script panel,
 * pace metrics) and the real slide renderer, fed with the RDV Classique template.
 */
export function PresenterAudience() {
  return (
    <Section id="presenter" aria-labelledby="presenter-title">
      <SectionHeading id="presenter-title" kicker={m.kicker} title={m.title} lead={m.lead} />

      <div className="mt-12 space-y-4">
        <div className="rounded-lg border border-border bg-surface">
          <PanelHeader icon={Presentation} label={m.presenterLabel}>
            <dl className="hidden items-center gap-4 text-xs text-faint md:flex" aria-label={m.shortcuts}>
              {m.shortcutKeys.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <dt className="flex gap-1">
                    {s.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </dt>
                  <dd>{s.label}</dd>
                </div>
              ))}
            </dl>
          </PanelHeader>

          <div className="grid gap-6 p-4 md:grid-cols-2 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-5">
              <div>
                <p className="mb-2 text-label-caps text-faint">{m.current}</p>
                <LazySlide slide={demo.currentVisual} theme={demo.theme} className="rounded-md border border-border" />
              </div>
              <div className="w-1/2">
                <p className="mb-2 text-label-caps text-faint">{m.next}</p>
                <LazySlide slide={demo.nextVisual} theme={demo.theme} className="rounded-md border border-border" />
              </div>
            </div>
            <div className="lg:col-span-4">
              <ScriptPanel slide={demo.current} index={demo.index} total={demo.total} />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <MetricsPanel
                slides={demo.paceSlides}
                slideSeconds={demo.slideSeconds}
                currentIndex={demo.index}
                elapsedSec={demo.elapsedSec}
              />
            </div>
          </div>
          <p className="border-t border-border px-4 py-3 text-xs text-faint">{m.presenterHint}</p>
        </div>

        <div className="grid overflow-hidden rounded-lg border border-border bg-surface md:grid-cols-12">
          <div className="md:col-span-7">
            <LazySlide slide={demo.currentVisual} theme={demo.theme} />
          </div>
          <div className="flex flex-col border-t border-border md:col-span-5 md:border-l md:border-t-0">
            <PanelHeader icon={MonitorPlay} label={m.audienceLabel}>
              <Badge variant="success">
                <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
                {m.audienceStatus}
              </Badge>
            </PanelHeader>
            <p className="p-4 text-small leading-relaxed text-muted-foreground">{m.audienceText}</p>
          </div>
        </div>
      </div>
    </Section>
  );
}
