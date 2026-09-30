import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-50 overflow-x-hidden selection:bg-violet-500/30">
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                <span className="text-lg font-bold leading-none text-white tracking-tighter">G</span>
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:inline-block">GetFunnels</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
              <Link href="/pricing" className="transition-colors hover:text-zinc-50">Tarifs</Link>
              <Link href="/#features" className="transition-colors hover:text-zinc-50">Fonctionnalités</Link>
              <Link href="/#templates" className="transition-colors hover:text-zinc-50">Templates</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Se connecter</Link>
            </Button>
            <Button asChild className="shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] hover:-translate-y-0.5">
              <Link href="/signup">Commencer gratuitement</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-white/5 bg-zinc-950 py-12">
        <div className="container mx-auto px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-violet-600">
                <span className="text-sm font-bold leading-none text-white tracking-tighter">G</span>
              </div>
              <span className="font-bold text-lg tracking-tight">GetFunnels</span>
            </Link>
            <p className="text-sm text-zinc-400 max-w-xs">
              Générez des decks de vente présentables en quelques minutes. Propulsé par l'IA, conçu pour la conversion.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-zinc-100">Produit</h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="/#features" className="hover:text-zinc-50 transition-colors">Fonctionnalités</Link></li>
              <li><Link href="/#templates" className="hover:text-zinc-50 transition-colors">Templates</Link></li>
              <li><Link href="/pricing" className="hover:text-zinc-50 transition-colors">Tarifs</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-zinc-100">Légal</h3>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="#" className="hover:text-zinc-50 transition-colors">CGV</Link></li>
              <li><Link href="#" className="hover:text-zinc-50 transition-colors">Confidentialité</Link></li>
              <li><Link href="#" className="hover:text-zinc-50 transition-colors">Mentions légales</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 md:px-8 mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-sm text-zinc-500">
          <p>© {new Date().getFullYear()} GetFunnels. Tous droits réservés.</p>
          <p className="mt-2 md:mt-0">Fait avec ❤️ pour les créateurs.</p>
        </div>
      </footer>
    </div>
  );
}
