/** Onboarding copy. French-first; keep i18n-ready. */
export const onboardingMessages = {
  loading: "Chargement…",
  home: "Retour à l'accueil",
  progress: (step: number, total: number) => `Étape ${step} sur ${total}`,
  progressLabel: "Progression de l'onboarding",
  steps: [
    {
      label: "Organisation",
      title: "Créez votre organisation",
      description: "Votre espace de travail regroupe vos decks, vos thèmes et votre équipe.",
    },
    {
      label: "Adresse",
      title: "Choisissez votre identifiant",
      description: "Il identifie votre espace de façon unique. Vous pourrez le garder tel quel.",
    },
    {
      label: "C'est parti",
      title: "Votre espace est prêt",
      description: "Redirection vers votre tableau de bord…",
    },
  ],
  name: {
    label: "Nom de l'organisation",
    placeholder: "Ex: Mon Agence",
    hint: "2 à 60 caractères",
    errorLength: "Le nom doit contenir entre 2 et 60 caractères",
  },
  slug: {
    label: "Identifiant (slug)",
    prefix: "getfunnels.io/",
    placeholder: "mon-agence",
    hint: "Lettres minuscules, chiffres et tirets uniquement",
    errorFormat: "2 à 50 caractères : lettres minuscules, chiffres et tirets uniquement",
  },
  summary: {
    name: "Organisation",
    slug: "Identifiant",
  },
  next: "Continuer",
  back: "Retour",
  submit: "Créer mon espace",
  pending: "Création…",
} as const;
