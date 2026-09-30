import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Presentation, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full max-w-6xl px-4 md:px-8 pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden flex flex-col items-center text-center">
        {/* Abstract Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-sm font-medium text-violet-300 mb-8 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-violet-500 mr-2 animate-pulse"></span>
          Nouveau : Templates Webinaire et VSL disponibles
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mb-8 leading-tight">
          De votre script à un <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">deck de vente</span> en quelques secondes.
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed">
          GetFunnels transforme vos textes de vente bruts en présentations dynamiques, thémées et prêtes à convertir. Conçu pour les copywriters et les entrepreneurs.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Button size="lg" asChild className="w-full sm:w-auto h-14 px-8 text-base shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] transition-all">
            <Link href="/signup">
              Créer mon premier deck <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto h-14 px-8 text-base border-white/10 hover:bg-white/5">
            <Link href="/#how-it-works">Voir comment ça marche</Link>
          </Button>
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section className="w-full border-y border-white/5 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-center items-center gap-8 md:gap-24 text-zinc-400">
          <div className="flex flex-col items-center">
            <p className="text-3xl font-bold text-white mb-1">10x</p>
            <p className="text-sm">Plus rapide</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-3xl font-bold text-white mb-1">7</p>
            <p className="text-sm">Frameworks prouvés</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-3xl font-bold text-white mb-1">100%</p>
            <p className="text-sm">Généré par IA</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="w-full max-w-6xl px-4 md:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">L'outil ultime pour vos lancements</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg">Ne perdez plus d'heures sur Keynote ou PowerPoint. Concentrez-vous sur le message, nous gérons le design.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Zap className="h-8 w-8 text-violet-400" />}
            title="Génération Instantanée"
            description="Collez votre texte, choisissez un framework (Webinaire, VSL, etc.) et laissez l'IA créer vos slides."
          />
          <FeatureCard 
            icon={<Presentation className="h-8 w-8 text-violet-400" />}
            title="Vue Présentateur"
            description="Un tableau de bord avec vos notes, un chronomètre et le script pour une livraison parfaite."
          />
          <FeatureCard 
            icon={<Users className="h-8 w-8 text-violet-400" />}
            title="Synchronisation Audience"
            description="Partagez un lien public. L'audience voit vos slides en temps réel, synchronisés avec vous."
          />
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="w-full max-w-6xl px-4 md:px-8 py-24 relative">
        <div className="absolute top-1/2 left-0 w-full h-[300px] bg-violet-900/10 blur-[100px] rounded-full pointer-events-none -z-10" />
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-8">Comment ça marche ?</h2>
            <div className="space-y-8">
              <Step number="1" title="Collez votre script">
                Apportez votre texte de vente brut ou vos idées. Pas besoin de mise en page.
              </Step>
              <Step number="2" title="L'IA structure le deck">
                Notre pipeline d'IA analyse le texte, l'adapte à un framework éprouvé et génère le contenu des slides.
              </Step>
              <Step number="3" title="Présentez et convertissez">
                Utilisez notre interface de présentation intégrée. Partagez le lien avec votre audience en un clic.
              </Step>
            </div>
            <Button size="lg" className="mt-10" asChild>
              <Link href="/signup">Essayer maintenant</Link>
            </Button>
          </div>
          <div className="relative rounded-2xl border border-white/10 bg-zinc-900/50 p-2 shadow-2xl backdrop-blur-sm overflow-hidden aspect-video flex items-center justify-center">
            {/* Mockup UI representation */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent" />
            <div className="relative w-full h-full rounded-xl border border-white/5 bg-zinc-950 flex flex-col">
              <div className="h-8 border-b border-white/5 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 p-6 flex flex-col justify-center items-center text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Le Secret de la Conversion</h3>
                <p className="text-zinc-400">Généré par GetFunnels AI</p>
                <div className="mt-8 grid grid-cols-3 gap-2 w-full max-w-sm">
                  <div className="h-2 rounded bg-violet-500/50 w-full" />
                  <div className="h-2 rounded bg-zinc-800 w-full" />
                  <div className="h-2 rounded bg-zinc-800 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Teaser */}
      <section id="templates" className="w-full bg-zinc-900/30 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-24 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-6">Des thèmes qui marquent les esprits</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto text-lg mb-12">
            Passez d'un mode sombre élégant à un thème d'autorité en un clic. Tout s'adapte automatiquement.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["GetFunnels Dark", "Authority Blue", "Minimal Light", "Startup Gradient"].map((theme, i) => (
              <div key={i} className="aspect-[16/9] rounded-lg border border-white/10 bg-zinc-900 flex items-center justify-center p-4 hover:border-violet-500/50 transition-colors group cursor-pointer relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-sm font-medium text-zinc-300 relative z-10">{theme}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full max-w-4xl mx-auto px-4 py-32 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[200px] bg-violet-600/20 blur-[100px] rounded-full pointer-events-none" />
        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-8">Prêt à transformer vos scripts ?</h2>
        <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          Rejoignez les créateurs qui utilisent GetFunnels pour captiver leur audience et augmenter leurs ventes.
        </p>
        <Button size="lg" asChild className="h-14 px-10 text-lg shadow-[0_0_30px_rgba(139,92,246,0.4)]">
          <Link href="/signup">Démarrer gratuitement</Link>
        </Button>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 hover:bg-white/[0.04] transition-colors">
      <div className="h-14 w-14 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, children }: { number: string, title: string, children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-full border border-violet-500/30 bg-violet-500/10 flex items-center justify-center text-violet-300 font-bold text-lg">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-white mb-2 mt-2">{title}</h3>
        <p className="text-zinc-400">{children}</p>
      </div>
    </div>
  );
}