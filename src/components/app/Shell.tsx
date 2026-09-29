"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface ShellProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
  orgName?: string;
}

export function Shell({ children, userName, userEmail, orgName }: ShellProps) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <div className="lg:pl-64">
        <Topbar
          userName={userName}
          userEmail={userEmail}
          orgName={orgName}
        />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}