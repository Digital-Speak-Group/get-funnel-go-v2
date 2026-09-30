"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Plus, FileText, Settings, ChevronLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Tableau de bord", href: "/app", icon: LayoutDashboard },
  { name: "Nouveau deck", href: "/app/new", icon: Plus },
  { name: "Modèles", href: "/app/templates", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-zinc-900/95 backdrop-blur-sm border-r border-zinc-800 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between px-4 border-b border-zinc-800">
          {!collapsed && (
            <Link href="/app" className="text-xl font-bold text-white">
              GetFunnels
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="h-8 w-8"
            aria-label={collapsed ? "Étendre la barre latérale" : "Réduire la barre latérale"}
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3 overflow-y-auto" aria-label="Navigation principale">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-violet-600/20 text-white"
                    : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          {!collapsed && (
            <Link
              href="/app/settings/profile"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <Settings className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>Paramètres</span>
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}