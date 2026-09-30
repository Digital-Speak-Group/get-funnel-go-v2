import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Tarifs | GetFunnels",
  description: "Des plans simples et transparents pour générer vos decks de vente.",
};

export default function PricingPage() {
  return (
    <div className="flex flex-col items-center pb-24">
      {/* Header */}
      <section className="w-full max-w-4xl px-4 md:px-8 pt-24 md:pt-32 pb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
          Des tarifs simples, sans surprise
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
          Payez pour ce que vous utilisez. Obtenez un accès complet à tous nos frameworks de conversion et thèmes premium.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="w-full max-w-6xl px-4 md:px-8 mb-24">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          
          {/* Trial / Free */}
          <PricingCard
            name="Découverte"
            price="Gratuit"
            description="Idéal pour tester la puissance de l'IA sur un premier projet."
            features={[
              "1 deck gratuit",
              "500 crédits IA inclus",
              "Accès à tous les thèmes",
              "Lien de présentation public",
              "Export PDF avec filigrane"
            ]}
            ctaText="Créer mon compte"
            ctaHref="/signup"
            variant="outline"
          />

          {/* Pro */}
          <PricingCard
            name="Pro"
            price="29€"
            interval="/mois"
            description="Pour les créateurs et copywriters réguliers."
            features={[
              "Decks illimités",
              "10,000 crédits IA par mois (~20 decks)",
              "Export PDF sans filigrane",
              "Accès prioritaire aux nouveaux frameworks",
              "Support par email"
            ]}
            ctaText="Commencer l'essai de 7 jours"
            ctaHref="/signup"
            variant="default"
            popular
          />

          {/* Agency */}
          <PricingCard
            name="Agence"
            price="99€"
            interval="/mois"
            description="Pour les agences et les gros volumes de lancements."
            features={[
              "Decks illimités",
              "50,000 crédits IA par mois",
              "Toutes les fonctionnalités Pro",
              "Marque blanche sur le lien de présentation (Bientôt)",
              "Support prioritaire 24/7"
            ]}
            ctaText="Contacter les ventes"
            ctaHref="mailto:sales@getfunnels.co"
            variant="outline"
          />
        </div>
      </section>

      {/* Credit Explanation */}
      <section className="w-full max-w-4xl px-4 md:px-8 py-16 bg-white/[0.02] border border-white/5 rounded-3xl mx-4 mb-24">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-4">Comment fonctionnent les crédits ?</h2>
            <p className="text-zinc-400 mb-4">
              L'IA consomme des crédits en fonction de la taille de votre script et du modèle choisi.
              Générer un deck complet pour un webinaire de 45 minutes coûte environ 500 crédits avec notre modèle de base, et jusqu'à 1500 crédits avec nos modèles de raisonnement avancés.
            </p>
            <p className="text-zinc-400">
              Les plans Pro et Agence incluent une recharge mensuelle. Les crédits non utilisés ne sont pas reportés.
            </p>
          </div>
          <div className="w-48 h-48 rounded-full bg-violet-500/10 border border-violet-500/30 flex flex-col items-center justify-center shrink-0">
            <span className="text-4xl font-bold text-violet-300">1 c.</span>
            <span className="text-sm text-violet-400/80 text-center mt-2 px-4">=<br/>~1000 mots générés</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full max-w-3xl px-4 md:px-8">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">Questions fréquentes</h2>
        <div className="space-y-8">
          <FaqItem 
            question="Puis-je annuler à tout moment ?"
            answer="Oui, tous nos abonnements sont sans engagement. Vous pouvez annuler votre abonnement depuis les paramètres de votre compte à tout moment."
          />
          <FaqItem 
            question="Qu'est-ce qu'un deck ?"
            answer="Un deck est une présentation (composée de slides) générée à partir d'un script. Un deck peut contenir autant de slides que nécessaire."
          />
          <FaqItem 
            question="Que se passe-t-il si je n'ai plus de crédits ?"
            answer="L'IA ne pourra plus générer de nouveaux slides. Vous pourrez acheter une recharge de crédits ponctuelle ou attendre le renouvellement de votre abonnement le mois suivant. Vos decks existants restent bien sûr modifiables et présentables."
          />
          <FaqItem 
            question="Le paiement est-il sécurisé ?"
            answer="Oui, tous les paiements sont traités par Stripe, le leader mondial du paiement en ligne. Nous ne stockons aucune information bancaire sur nos serveurs."
          />
        </div>
      </section>
    </div>
  );
}

function PricingCard({ 
  name, 
  price, 
  interval = "", 
  description, 
  features, 
  ctaText, 
  ctaHref, 
  variant = "outline",
  popular = false
}: { 
  name: string, 
  price: string, 
  interval?: string,
  description: string, 
  features: string[], 
  ctaText: string, 
  ctaHref: string,
  variant?: "default" | "outline",
  popular?: boolean
}) {
  return (
    <div className={`relative flex flex-col p-8 rounded-3xl border ${popular ? 'border-violet-500 shadow-[0_0_40px_rgba(139,92,246,0.15)] bg-zinc-900/80' : 'border-white/10 bg-white/[0.02]'} backdrop-blur-sm`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full">
          Le plus choisi
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-xl font-medium text-white mb-2">{name}</h3>
        <p className="text-zinc-400 text-sm h-10">{description}</p>
      </div>
      <div className="mb-8 flex items-baseline gap-1">
        <span className="text-5xl font-extrabold text-white">{price}</span>
        <span className="text-zinc-500 font-medium">{interval}</span>
      </div>
      <Button asChild variant={variant} size="lg" className="w-full mb-8">
        <Link href={ctaHref}>{ctaText}</Link>
      </Button>
      <div className="space-y-4 flex-1">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <Check className="h-5 w-5 text-violet-500 shrink-0" />
            <span className="text-zinc-300 text-sm leading-tight">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-violet-500" />
        {question}
      </h3>
      <p className="text-zinc-400 pl-7">{answer}</p>
    </div>
  );
}
