/** Presenter view copy (French-first, one place for future i18n). */
export const PRESENTER_MESSAGES = {
  panelLabel: "Script, notes et temps",
  script: {
    empty: "Aucun script pour cette slide.",
    tips: (n: number) => `Conseils présentateur (${n})`,
    transition: "Transition",
  },
  pace: {
    elapsed: "Écoulé",
    target: "Cible",
    onTrack: "Dans les temps",
    ahead: (t: string) => `En avance de ${t}`,
    behind: (t: string) => `En retard de ${t}`,
    noTarget: "Ajoutez une durée cible aux slides (Repères du présentateur) pour suivre le rythme.",
    untimed: (n: number) => (n === 1 ? "1 slide sans durée cible" : `${n} slides sans durée cible`),
    overBudget: "Temps dépassé",
  },
  blanks: {
    title: "Valeurs en direct",
    hint: "Visibles par l'audience pendant la présentation, jamais enregistrées.",
  },
  strip: {
    label: (n: number, type: string) => `Slide ${n} : ${type}`,
  },
  tabs: { script: "Script", notes: "Notes", metrics: "Métriques" },
  notes: { title: "Notes présentateur", empty: "Aucune note pour cette slide." },
  next: "Suivante",
  goNext: "Aller à la slide suivante",
  nav: { previous: "Slide précédente (←)", next: "Slide suivante (→)" },
  timer: { start: "Démarrer (P)", pause: "Pause (P)", reset: "Réinitialiser le timer", label: "Temps écoulé" },
  fullscreen: "Plein écran (F)",
  link: {
    live: "Lien audience actif",
    connecting: "Connexion…",
    offline: "Lien audience hors ligne",
  },
  keys: {
    label: "Raccourcis clavier",
    navigate: "naviguer",
    timer: "timer",
    fullscreen: "plein écran",
  },
} as const;

/** Audience link button copy (editor + presenter). */
export const AUDIENCE_LINK_MESSAGES = {
  copy: "Lien audience",
  copied: "Lien copié",
  opened: "Lien ouvert",
  hint: "Copier le lien public que l'audience ouvre pour suivre la présentation",
} as const;

/** Audience view copy (Task 47). */
export const AUDIENCE_MESSAGES = {
  waiting: "En attente du présentateur",
} as const;
