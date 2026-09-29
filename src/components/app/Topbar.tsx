"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Moon, Sun, LogOut, User, Building2 } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { signOutAction } from "@/app/(auth)/actions";

interface TopbarProps {
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  orgName?: string;
}

export function Topbar({ userName, userEmail, userAvatar, orgName }: TopbarProps) {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");

  React.useEffect(() => {
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
      <div className="flex h-full items-center justify-between px-4 lg:pl-64">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">GetFunnels</h1>
          <Separator orientation="vertical" className="h-6" />
          <span className="text-sm text-zinc-400 hidden sm:block">
            {orgName || "Organisation"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9" aria-label={theme === "dark" ? "Mode clair" : "Mode sombre"}>
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0" aria-label="Menu utilisateur">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userAvatar} alt={userName || ""} />
                  <AvatarFallback>
                    {userName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName || "Utilisateur"}</p>
                  <p className="text-xs leading-none text-zinc-400">{userEmail || "email@exemple.com"}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app/settings/profile" className="flex w-full items-center gap-2">
                  <User className="h-4 w-4" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/settings/organization" className="flex w-full items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Organisation
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-400 focus:text-red-300"
                onClick={async () => {
                  await signOutAction();
                  window.location.href = "/login";
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}