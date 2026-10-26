/** Generation wizard copy (Task 45), French-first. */
export const WIZARD_MESSAGES = {
  title: "Nouveau deck IA",
  description: "Collez votre script : l'IA le transforme en deck prêt à présenter, dans le modèle et le thème de votre choix.",
  steps: ["Script", "Modèle & thème", "Paramètres"] as const,
  stepLabel: (n: number, total: number, name: string) => `Étape ${n} sur ${total} : ${name}`,
  next: "Suivant",
  back: "Retour",
  script: {
    label: "Votre script",
    placeholder:
      "Collez votre script de vente, page de vente, ou script de VSL ici… (300 caractères minimum)",
    hint: "Script d'appel, page de vente, VSL ou webinaire : plus il est complet, moins l'IA laisse de « à compléter ».",
    count: (n: number, max: number) => `${n.toLocaleString("fr-FR")} / ${max.toLocaleString("fr-FR")} caractères`,
    tooShort: (missing: number) => `Encore ${missing} caractères au minimum.`,
    tooLong: "Le script dépasse 30 000 caractères : raccourcissez-le.",
  },
  design: {
    template: "Modèle",
    templateHint: "La structure du funnel que l'IA va suivre.",
    stages: (n: number) => `${n} étapes`,
    theme: "Thème",
    themeHint: "Couleurs et typographies. Modifiable ensuite dans l'éditeur.",
  },
  settings: {
    slideCount: "Nombre de slides",
    slideCountValue: (n: number) => `${n} slides`,
    tone: "Ton",
    tones: {
      professional: "Professionnel",
      casual: "Décontracté",
      urgent: "Urgent",
      empathetic: "Empathique",
      authoritative: "Autoritaire",
    } as Record<string, string>,
    summary: "Récapitulatif",
    cost: "Coût",
    costValue: "1 deck de votre forfait",
    remaining: (used: number, limit: number) => `Decks ce mois-ci : ${used} / ${limit}`,
    limitReached: "Vous avez utilisé tous les decks de votre forfait ce mois-ci.",
    upgrade: "Passer au forfait supérieur",
  },
  generate: "Générer le deck",
  progress: {
    title: "Génération en cours",
    hint: "Comptez une à deux minutes. Ne fermez pas cet onglet.",
    stages: {
      credits: "Réservation des crédits",
      brief: "Analyse du script",
      plan: "Plan du deck",
      slides: "Rédaction des slides",
      saving: "Enregistrement",
      done: "Terminé",
    },
    slidesCount: (done: number, total: number) => `${done} / ${total}`,
    cancel: "Annuler",
    cancelled:
      "Suivi arrêté. Si l'IA avait déjà commencé, le deck peut encore apparaître dans votre tableau de bord.",
    failed: "La génération a échoué. Les crédits réservés vous sont rendus.",
    interrupted:
      "La connexion a été interrompue avant la fin. Si l'IA avait terminé, le deck apparaîtra dans votre tableau de bord.",
    retry: "Modifier et réessayer",
  },
  errors: {
    rateLimited: "Trop de générations d'affilée. Réessayez dans une minute.",
    start: "Impossible de lancer la génération. Réessayez dans un instant.",
  },
} as const;
