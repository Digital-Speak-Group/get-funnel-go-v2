"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronRight, CreditCard, LogOut, Menu, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { signOutAction } from "@/app/(auth)/actions";
import { Kbd } from "./patterns/Kbd";
import { SidebarContent, type WorkspaceInfo } from "./Sidebar";
import { breadcrumbsFor } from "./breadcrumbs";
import { shellMessages as m } from "./messages";

interface TopbarProps {
  workspace: WorkspaceInfo;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  onOpenCommand: () => void;
}

export function Topbar({ workspace, userName, userEmail, userAvatar, onOpenCommand }: TopbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const crumbs = breadcrumbsFor(pathname);
  const displayName = userName || m.user.fallbackName;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md lg:px-6">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label={m.nav.openMenu}
      >
        <Menu />
      </Button>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">{m.nav.label}</SheetTitle>
          <SidebarContent workspace={workspace} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <nav aria-label="Fil d'Ariane" className="min-w-0 flex-1">
        <ol className="flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={crumb.label} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-faint" aria-hidden="true" />}
                {last ? (
                  <span aria-current="page" className="truncate font-medium text-foreground">
                    {crumb.label}
                  </span>
                ) : (
                  <Link href={crumb.href} className="truncate text-muted-foreground transition-colors hover:text-foreground">
                    {crumb.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <button
        type="button"
        onClick={onOpenCommand}
        aria-label={`${m.command.title} (Ctrl+K)`}
        className="hidden h-8 w-56 items-center gap-2 rounded-md border border-border-strong bg-surface px-2.5 text-sm text-faint transition-colors hover:border-border-strong hover:bg-surface-2 hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring outline-none md:flex"
      >
        <Search className="size-4" aria-hidden="true" />
        <span className="flex-1 text-left">{m.command.trigger}</span>
        <span className="flex items-center gap-0.5" aria-hidden="true">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onOpenCommand} aria-label={m.command.title}>
        <Search />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="size-8 rounded-full p-0" aria-label={m.user.menu}>
            <Avatar className="size-7">
              <AvatarImage src={userAvatar} alt="" />
              <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60" align="end">
          <DropdownMenuLabel className="font-normal">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            {userEmail && <p className="truncate text-xs text-muted-foreground">{userEmail}</p>}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/app/settings/profile">
              <User aria-hidden="true" />
              {m.user.profile}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/settings/organization">
              <Building2 aria-hidden="true" />
              {m.user.organization}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/settings/billing">
              <CreditCard aria-hidden="true" />
              {m.user.billing}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={async () => {
              await signOutAction();
              window.location.href = "/login";
            }}
          >
            <LogOut aria-hidden="true" />
            {m.user.signOut}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
