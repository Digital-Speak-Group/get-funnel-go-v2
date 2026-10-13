import Link from "next/link";
import { Logo } from "@/components/app/patterns/Logo";
import { onboardingMessages as m } from "./messages";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 py-6 sm:px-10">
      <header>
        <Link
          href="/"
          aria-label={m.home}
          className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-card sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
