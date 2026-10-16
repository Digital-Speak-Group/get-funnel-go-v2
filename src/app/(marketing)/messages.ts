/**
 * Marketing copy (landing, pricing, header, footer, OG image). French-first, one place for i18n.
 * Every claim here must be backed by the product: numbers come from `_lib/facts.ts`, which
 * counts them from the code, and features are listed only once they ship.
 */
export const marketingMessages = {
  meta: {
    title: "GetFunnels — Du script de vente au deck prêt à présenter",
    description:
      "Collez votre script de vente, choisissez un framework et un thème : l'IA génère un deck que vous présentez avec votre script sous les yeux, pendant que l'audience suit en direct.",
    pricingTitle: "Tarifs — GetFunnels",
    pricingDescription: "Trois plans, un nombre de decks par mois, paiement sécurisé par Stripe.",
  },
  nav: {
    label: "Navigation principale",
    features: "Fonctionnalités",
    frameworks: "Frameworks",
    presenter: "Présentation",
    pricing: "Tarifs",
    login: "Se connecter",
    signup: "Commencer gratuitement",
    home: "GetFunnels, accueil",
  },
  hero: {
    kicker: (frameworks: number) => `${frameworks} frameworks de vente prêts à remplir`,
    titleStart: "De votre script",
    titleEnd: " à un deck de vente prêt à présenter.",
    lead: "Collez votre script de vente, choisissez un framework et un thème : l'IA remplit les slides. Vous présentez avec votre script sous les yeux, votre audience suit en direct depuis un simple lien.",
    primary: "Créer mon premier deck",
    secondary: "Voir les tarifs",
    note: "Plan gratuit inclus à l'inscription : 1 crédit par mois, soit environ un deck.",
  },
  preview: {
    label: (template: string) => `Aperçu des slides du template ${template}`,
    caption: (template: string, theme: string) => `${template} · thème ${theme}`,
    counter: (n: number, total: number) => `${n} / ${total}`,
    goTo: (n: number) => `Afficher la slide ${n}`,
    pause: "Mettre l'aperçu en pause",
    play: "Relancer l'aperçu",
  },
  facts: {
    label: "GetFunnels en chiffres",
    frameworks: "frameworks de funnel",
    slideTypes: "types de slides",
    themes: "thèmes intégrés",
    slideRange: "slides par deck généré",
  },
  frameworks: {
    kicker: "Templates",
    title: "Sept frameworks de vente, prêts à remplir",
    lead: "Chaque template reprend la structure complète d'un funnel. L'IA remplit ce cadre avec votre script au lieu d'inventer une structure, et chaque framework a son thème Signature.",
    slides: (n: number) => `${n} slides`,
    themeLabel: (name: string) => `Thème ${name}`,
    moreTitle: "Aussi inclus",
    moreText: "Deux templates de plus, Webinaire Live et Système Commercial, et tous les thèmes pour habiller n'importe quel deck.",
  },
  features: {
    kicker: "Fonctionnalités",
    title: "Générez, ajustez, exportez",
    lead: "L'IA fait le premier jet. Vous gardez la main sur chaque mot, chaque slide et chaque export.",
    items: {
      generate: {
        title: "Génération depuis votre script",
        text: (min: string, max: string, minSlides: number, maxSlides: number) =>
          `De ${min} à ${max} caractères de script, de ${minSlides} à ${maxSlides} slides, le ton de votre choix. L'IA suit la structure du template choisi.`,
      },
      edit: {
        title: "Édition directement sur la slide",
        text: "Cliquez sur un texte pour le réécrire. Déplacez, dupliquez ou supprimez les éléments d'une liste, ajoutez ou remplacez une image sans quitter le canevas.",
      },
      free: {
        title: "Slides Libre",
        text: "Placez textes, formes, images et icônes où vous voulez : déplacer, redimensionner, faire pivoter, aligner. Toute slide peut être convertie en slide Libre.",
      },
      regenerate: {
        title: "Une slide à la fois",
        text: "Une slide ne vous convient pas ? Régénérez-la seule, sans toucher au reste du deck.",
      },
      export: {
        title: "Export PDF et PowerPoint",
        text: "Un PDF fidèle à l'écran, et un PowerPoint avec une image par slide et votre script en notes du présentateur.",
      },
      themes: {
        title: "Thèmes interchangeables",
        text: (themes: number) =>
          `${themes} thèmes intégrés. Changez de thème à tout moment : tout le deck se met à jour, slides Libre comprises.`,
      },
    },
  },
  presenter: {
    kicker: "Présentation",
    title: "Vous voyez le script. Votre audience voit les slides.",
    lead: "La vue présentateur affiche la slide en cours, la suivante, votre script et le temps passé. L'audience ouvre un lien public, sans compte, et suit chaque changement de slide en direct.",
    presenterLabel: "Vue présentateur",
    presenterHint: "Rendue avec les vrais composants, sur le template RDV Classique.",
    current: "En cours",
    next: "Suivante",
    shortcuts: "Raccourcis",
    shortcutKeys: [
      { keys: ["←", "→"], label: "slide précédente / suivante" },
      { keys: ["F"], label: "plein écran" },
      { keys: ["P"], label: "vue présentateur" },
    ],
    audienceLabel: "Vue audience",
    audienceStatus: "Synchronisée en direct",
    audienceText: "La slide en plein écran, sans aucun contrôle visible. L'audience ouvre le lien sur son propre écran, aucun compte n'est nécessaire.",
  },
  pricingTeaser: {
    kicker: "Tarifs",
    title: "Commencez gratuitement, passez à l'échelle ensuite",
    lead: "Chaque plan inclut un budget mensuel de crédits, environ un deck généré par crédit. Paiement sécurisé par Stripe.",
    credits: (n: number) => (n > 1 ? `${n} crédits par mois` : "1 crédit par mois"),
    cta: "Comparer les plans",
  },
  faq: {
    kicker: "Questions fréquentes",
    title: "Ce qu'il faut savoir",
  },
  finalCta: {
    title: "Votre prochain deck commence par votre script.",
    lead: "Créez un compte, collez votre script, présentez.",
    primary: "Créer mon premier deck",
  },
  footer: {
    tagline: "Du script de vente au deck prêt à présenter.",
    product: "Produit",
    account: "Compte",
    login: "Se connecter",
    signup: "Créer un compte",
    legal: "Légal",
    terms: "CGV / CGU",
    privacy: "Confidentialité",
    mentions: "Mentions légales",
    rights: (year: number) => `© ${year} GetFunnels. Tous droits réservés.`,
  },
  pricing: {
    title: "Des tarifs simples, sans surprise",
    lead: "Chaque plan inclut un budget mensuel de crédits pour générer vos decks. Le paiement est géré par Stripe.",
    signup: "Créer un compte gratuit",
    plansLabel: "Plans",
    creditsTitle: "Comment fonctionnent les crédits ?",
    creditsBody: [
      "Un crédit correspond à environ une génération de deck ; régénérer une seule slide en consomme une petite fraction. Le budget se renouvelle chaque mois selon votre plan, et une génération qui échoue est remboursée.",
      "Éditer, présenter et exporter un deck ne consomme aucun crédit : vos decks restent utilisables même quand le budget du mois est épuisé.",
    ],
  },
  og: {
    alt: "GetFunnels — Du script de vente au deck prêt à présenter",
    title: "De votre script à un deck de vente prêt à présenter.",
    facts: (frameworks: number, slideTypes: number, themes: number) =>
      `${frameworks} frameworks · ${slideTypes} types de slides · ${themes} thèmes · Export PDF et PowerPoint`,
  },
} as const;

export type FaqItem = { question: string; answer: string };

/** Landing FAQ. Answers only state what the product does today. */
export function landingFaq(facts: {
  frameworks: number;
  minSlides: number;
  maxSlides: number;
  scriptMin: string;
  scriptMax: string;
}): FaqItem[] {
  return [
    {
      question: "Mon audience a-t-elle besoin d'un compte ?",
      answer:
        "Non. Vous partagez un lien public : l'audience l'ouvre dans son navigateur et suit vos slides en direct, sans inscription.",
    },
    {
      question: "Puis-je modifier ce que l'IA a généré ?",
      answer:
        "Oui, entièrement. Vous éditez les textes directement sur la slide, changez les images, régénérez une slide seule, ajoutez des slides Libre ou changez de thème.",
    },
    {
      question: "Quel script puis-je coller ?",
      answer: `Un script de vente de ${facts.scriptMin} à ${facts.scriptMax} caractères. Vous choisissez ensuite le template, le thème, le nombre de slides (de ${facts.minSlides} à ${facts.maxSlides}) et le ton.`,
    },
    {
      question: "Quels formats d'export sont disponibles ?",
      answer:
        "PDF et PowerPoint. L'export PowerPoint contient une image par slide, fidèle à l'écran, avec votre script en notes du présentateur ; les slides n'y sont pas modifiables.",
    },
    {
      question: "Quels frameworks sont inclus ?",
      answer: `Les ${facts.frameworks} frameworks présentés plus haut : RDV Classique, Lancement Orchestré, VSL, Webinaire, Evergreen, Tunnel Pay et Pitch Commercial, chacun avec son thème.`,
    },
    {
      question: "Comment se passe le paiement ?",
      answer:
        "Le plan gratuit est inclus à l'inscription, sans paiement. Les plans Pro et Agency sont des abonnements mensuels réglés via Stripe ; nous ne stockons aucune donnée bancaire.",
    },
  ];
}

/** Pricing page FAQ. */
export const pricingFaq: FaqItem[] = [
  {
    question: "Que se passe-t-il quand je n'ai plus de crédits ?",
    answer:
      "La génération IA est en pause jusqu'au renouvellement de votre budget le mois suivant, ou jusqu'à ce que vous passiez à un plan supérieur. Vos decks restent modifiables, présentables et exportables.",
  },
  {
    question: "Le paiement est-il sécurisé ?",
    answer:
      "Oui. Les paiements sont traités par Stripe ; nous ne stockons aucune donnée bancaire sur nos serveurs.",
  },
  {
    question: "Qu'est-ce qu'un deck ?",
    answer:
      "Une présentation générée à partir d'un script, avec son script présentateur slide par slide. Vous pouvez la modifier, la présenter et l'exporter en PDF ou PowerPoint.",
  },
];
