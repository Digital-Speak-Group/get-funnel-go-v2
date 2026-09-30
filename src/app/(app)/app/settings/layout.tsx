import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { User, Building2, CreditCard } from "lucide-react";
import Link from "next/link";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const navItems = [
    { href: "/app/settings/profile", label: "Profil", icon: User },
    { href: "/app/settings/organization", label: "Organisation", icon: Building2 },
    { href: "/app/settings/billing", label: "Facturation", icon: CreditCard },
  ];

  return (
    <div className="flex-1 p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">Paramètres</h1>
        <div className="flex gap-6">
          {/* Sidebar nav */}
          <nav className="w-48 shrink-0">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {/* Content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
