import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { containerClass } from "../sections/Section";
import { LEGAL_DOCUMENTS, TODO_MARKER, type LegalDocument } from "./content";
import { legalMessages } from "./messages";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" });

/** Draft placeholders stand out so nobody ships them by accident. */
function Text({ children }: { children: string }) {
  const parts = children.split(new RegExp(`(\\${TODO_MARKER}[^\\]]*\\])`));
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith(TODO_MARKER) ? (
          <mark key={i} data-testid="legal-placeholder" className="rounded-sm bg-warning/15 px-1 text-warning">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function LegalPage({ doc }: { doc: LegalDocument }) {
  return (
    <div className={cn(containerClass, "pb-24 pt-16 md:pt-24")}>
      <div className="grid gap-12 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <nav aria-label={legalMessages.navLabel} className="lg:sticky lg:top-24">
            <ul className="space-y-2.5">
              {LEGAL_DOCUMENTS.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/legal/${d.slug}`}
                    aria-current={d.slug === doc.slug ? "page" : undefined}
                    className={cn(
                      "text-small transition-colors duration-150 hover:text-foreground",
                      d.slug === doc.slug ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {d.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="lg:col-span-8 lg:col-start-5">
          <header>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">{doc.title}</h1>
            <p className="mt-3 text-small text-faint">
              {legalMessages.updated(dateFormat.format(new Date(doc.updated)))}
            </p>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              <Text>{doc.intro}</Text>
            </p>
          </header>

          {doc.sections.map((section) => (
            <section key={section.title} className="mt-10">
              <h2 className="text-h1 text-foreground">{section.title}</h2>
              <div className="mt-3 space-y-3 text-base leading-relaxed text-muted-foreground">
                {section.paragraphs?.map((p) => (
                  <p key={p}>
                    <Text>{p}</Text>
                  </p>
                ))}
                {section.items && (
                  <ul className="list-disc space-y-2 pl-5">
                    {section.items.map((item) => (
                      <li key={item}>
                        <Text>{item}</Text>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
