/** Billing copy (billing settings page, plan cards, limit dialog). French-first; keep i18n-ready. */
/** Included in every plan. */
const SHARED_FEATURES = [
  "Les 7 modèles de funnel et tous les thèmes",
  "Édition directe sur la slide et slides libres",
  "Présentateur et lien audience synchronisé",
  "Export PDF et PowerPoint",
] as const;

export const billingMessages = {
  metaTitle: "Facturation — GetFunnels",
  priceLabel: {
    trial: "Gratuit",
    pro: "29€ / mois",
    agency: "99€ / mois",
  } as Record<string, string>,
  // Only the monthly AI generation budget differs between plans (credits.ts); every
  // feature is available on all of them. Keep this list to what the product does.
  planFeatures: {
    trial: ["1 deck généré par l'IA par mois", ...SHARED_FEATURES],
    pro: ["50 decks générés par l'IA par mois", ...SHARED_FEATURES],
    agency: ["500 decks générés par l'IA par mois", ...SHARED_FEATURES],
  } as Record<string, readonly string[]>,
  plan: {
    current: "Plan actuel",
    recommended: "Recommandé",
    credits: (n: number) => `${n} crédit${n > 1 ? "s" : ""} / mois`,
    upgrade: (name: string) => `Passer au plan ${name}`,
    redirecting: "Redirection...",
    includedOnSignup: "Inclus à l'inscription",
  },
  current: {
    title: "Plan actuel",
    description: "Votre abonnement et sa période en cours.",
    subscription: (plan: string) => `Abonnement ${plan}`,
    renewsOn: (date: string) => `Renouvellement le ${date}`,
    cancelsOn: (date: string) => `Annulation prévue le ${date}`,
    status: (status: string) => `Statut : ${status}`,
    noSubscription: "Aucun abonnement payant en cours.",
    active: "Actif",
    canceling: "Annulation prévue",
    comparePlans: "Comparer les plans",
  },
  usage: {
    title: "Consommation ce mois",
    description: "Votre utilisation sur la période en cours.",
    credits: "Budget IA",
    decks: "Decks créés",
    atLimit: "Limite atteinte pour cette période. Passez à un plan supérieur pour continuer.",
    nearLimit: "Vous approchez de votre limite. Pensez à passer à un plan supérieur.",
  },
  plans: {
    title: "Plans disponibles",
    description: "Changez de plan à tout moment. Le paiement est géré par Stripe.",
  },
  invoices: {
    title: "Factures",
    description: "L'historique de vos paiements.",
    emptyTitle: "Aucune facture à afficher",
    emptyDescription: "Vos factures apparaîtront ici après votre premier paiement.",
  },
  checkoutFailed: "Impossible d'ouvrir la page de paiement. Réessayez.",
  limitDialog: {
    title: "Limite atteinte",
    body: (current: string, suggested: string) =>
      `Vous avez atteint la limite de votre plan ${current}. Passez au plan ${suggested} pour continuer à créer des decks et générer du contenu IA.`,
    later: "Plus tard",
  },
} as const;
