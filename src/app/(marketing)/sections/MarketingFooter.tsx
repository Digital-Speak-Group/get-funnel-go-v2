import Link from "next/link";
import { Logo } from "@/components/app/patterns/Logo";
import { cn } from "@/lib/utils";
import { marketingMessages } from "../messages";
import { MARKETING_NAV } from "./MarketingHeader";
import { containerClass } from "./Section";

const m = marketingMessages.footer;

const COLUMNS = [
  { title: m.product, links: MARKETING_NAV },
  {
    title: m.account,
    links: [
      { href: "/login", label: m.login },
      { href: "/signup", label: m.signup },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className={cn(containerClass, "grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-4")}>
        <div className="sm:col-span-2">
          <Link href="/" aria-label={marketingMessages.nav.home} className="inline-flex rounded-md">
            <Logo />
          </Link>
          <p className="mt-3 max-w-xs text-small text-muted-foreground">{m.tagline}</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-label-caps text-faint">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-small text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <p className={cn(containerClass, "py-6 text-xs text-faint")}>{m.rights(new Date().getFullYear())}</p>
      </div>
    </footer>
  );
}
