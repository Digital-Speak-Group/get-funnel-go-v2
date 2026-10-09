"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, LayoutTemplate, PanelLeftClose, PanelLeftOpen, Settings, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LogoMark } from "./patterns/Logo";
import { CreditsMeter } from "./CreditsMeter";
import { shellMessages as m } from "./messages";

export interface WorkspaceInfo {
  orgName: string;
  planName: string;
  decksCreated: number;
  decksLimit: number;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Pathname prefixes (besides href) that mark this item active. */
  match?: string[];
}

const primaryNav: NavItem[] = [
  { label: m.nav.decks, href: "/app", icon: LayoutGrid, match: ["/app/decks"] },
  { label: m.nav.newDeck, href: "/app/new", icon: Sparkles },
  { label: m.nav.templates, href: "/app/templates", icon: LayoutTemplate },
];

const settingsNav: NavItem = { label: m.nav.settings, href: "/app/settings", icon: Settings };

function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  const prefixes = item.href === "/app" ? item.match ?? [] : [item.href, ...(item.match ?? [])];
  return prefixes.some((prefix) => pathname.startsWith(prefix + "/"));
}

function NavLink({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isActive(pathname, item);
  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={cn(
        "flex h-8 items-center gap-2.5 rounded-md px-2 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed && "justify-center px-0",
        active
          ? "bg-surface-3 text-foreground"
          : "text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      )}
    >
      <item.icon className={cn("size-4 shrink-0", active && "text-brand")} aria-hidden="true" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

interface SidebarContentProps {
  workspace: WorkspaceInfo;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
}

/** Shared by the desktop rail and the mobile drawer. */
export function SidebarContent({ workspace, collapsed = false, onToggleCollapsed, onNavigate }: SidebarContentProps) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-14 shrink-0 items-center gap-2.5 border-b border-border", collapsed ? "justify-center px-2" : "px-4")}>
        <Link href="/app" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <LogoMark />
          {collapsed ? (
            <span className="sr-only">{workspace.orgName}</span>
          ) : (
            <span className="truncate text-sm font-semibold tracking-tight text-foreground">{workspace.orgName}</span>
          )}
        </Link>
        {!collapsed && (
          <Badge variant="neutral" className={cn("ml-auto", !onToggleCollapsed && "mr-7")}>
            {workspace.planName}
          </Badge>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label={m.nav.label}>
        {primaryNav.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="space-y-2 border-t border-border p-2">
        {!collapsed && (
          <CreditsMeter used={workspace.decksCreated} limit={workspace.decksLimit} />
        )}
        <NavLink item={settingsNav} collapsed={collapsed} onNavigate={onNavigate} />
        {onToggleCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? m.nav.expand : m.nav.collapse}
            aria-expanded={!collapsed}
            className={cn("w-full text-faint", collapsed ? "justify-center px-0" : "justify-start px-2")}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            {!collapsed && <span>{m.nav.collapse}</span>}
          </Button>
        )}
      </div>
    </div>
  );
}

interface SidebarProps {
  workspace: WorkspaceInfo;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

/** Desktop rail (lg and up). Below lg the same content renders in a Sheet from the Topbar. */
export function Sidebar({ workspace, collapsed, onToggleCollapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-background transition-[width] duration-200 ease-out lg:block",
        collapsed ? "w-14" : "w-60"
      )}
    >
      <SidebarContent workspace={workspace} collapsed={collapsed} onToggleCollapsed={onToggleCollapsed} />
    </aside>
  );
}
