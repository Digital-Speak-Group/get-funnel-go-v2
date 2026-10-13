"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CreditCard, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { settingsMessages as m } from "../messages";

const NAV_ITEMS = [
  { href: "/app/settings/profile", label: m.nav.profile, icon: User },
  { href: "/app/settings/organization", label: m.nav.organization, icon: Building2 },
  { href: "/app/settings/billing", label: m.nav.billing, icon: CreditCard },
] as const;

/** Vertical sub-nav from `md`, a horizontal tab row below it. */
export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label={m.nav.label} className="-mx-4 overflow-x-auto border-b border-border px-4 md:sticky md:top-20 md:mx-0 md:w-48 md:shrink-0 md:self-start md:overflow-visible md:border-b-0 md:px-0">
      <ul className="flex gap-1 md:flex-col md:gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-9 items-center gap-2 whitespace-nowrap px-3 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  // Mobile: underline tabs. Desktop: filled rows, like the app sidebar.
                  "border-b-2 md:h-8 md:rounded-md md:border-b-0 md:px-2",
                  active
                    ? "border-primary text-foreground md:bg-surface-3"
                    : "border-transparent text-muted-foreground hover:text-foreground md:hover:bg-surface-2"
                )}
              >
                <item.icon className={cn("size-4 shrink-0", active && "text-brand")} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
