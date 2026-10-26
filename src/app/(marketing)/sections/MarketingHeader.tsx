import Link from "next/link";
import { Logo } from "@/components/app/patterns/Logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { marketingMessages } from "../messages";
import { containerClass } from "./Section";

const m = marketingMessages.nav;

export const MARKETING_NAV = [
  { href: "/#features", label: m.features },
  { href: "/#frameworks", label: m.frameworks },
  { href: "/#presenter", label: m.presenter },
  { href: "/pricing", label: m.pricing },
] as const;

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className={cn(containerClass, "flex h-14 items-center justify-between gap-6")}>
        <div className="flex items-center gap-8">
          <Link href="/" aria-label={m.home} className="rounded-md transition-opacity duration-150 hover:opacity-80">
            <Logo />
          </Link>
          <nav aria-label={m.label} className="hidden items-center gap-6 md:flex">
            {MARKETING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-small text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">{m.login}</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/signup">{m.signup}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
