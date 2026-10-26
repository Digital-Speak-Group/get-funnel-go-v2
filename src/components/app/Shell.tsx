"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar, type WorkspaceInfo } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandMenu } from "./CommandMenu";
import { SIDEBAR_COOKIE } from "./shell-config";

interface ShellProps {
  children: React.ReactNode;
  workspace: WorkspaceInfo;
  userName?: string;
  userEmail?: string;
  /** Read from SIDEBAR_COOKIE on the server so the first paint has the right width. */
  initialCollapsed?: boolean;
}

export function Shell({ children, workspace, userName, userEmail, initialCollapsed = false }: ShellProps) {
  const [collapsed, setCollapsed] = React.useState(initialCollapsed);
  const [commandOpen, setCommandOpen] = React.useState(false);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      document.cookie = `${SIDEBAR_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        <Sidebar workspace={workspace} collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
        <div className={cn("transition-[padding] duration-200 ease-out", collapsed ? "lg:pl-14" : "lg:pl-60")}>
          <Topbar
            workspace={workspace}
            userName={userName}
            userEmail={userEmail}
            onOpenCommand={() => setCommandOpen(true)}
          />
          <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
      <Toaster />
    </TooltipProvider>
  );
}
