import Link from "next/link";
import { Logo } from "@/components/app/patterns/Logo";
import { AuthShowcase } from "./_components/AuthShowcase";
import { authMessages } from "./messages";

const legal = authMessages.legal;

/** Split screen: form column on the left, live slide preview on the right (desktop only). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="flex min-h-dvh flex-col px-6 py-6 sm:px-10">
        <header>
          <Link
            href="/"
            aria-label={authMessages.home}
            className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo />
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <footer className="mx-auto max-w-sm text-center text-small text-faint">
          {legal.prefix}{" "}
          <Link href="/legal/terms" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            {legal.terms}
          </Link>{" "}
          {legal.and}{" "}
          <Link href="/legal/privacy" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            {legal.privacy}
          </Link>
        </footer>
      </div>

      <AuthShowcase />
    </div>
  );
}
