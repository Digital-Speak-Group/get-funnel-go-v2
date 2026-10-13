import type { SlideType } from "@/lib/slides/schema";

export const SLIDE_TYPE_LABELS: Record<SlideType, string> = {
  cover: "Couverture",
  statement: "Déclaration",
  authority: "Autorité",
  problem: "Problème",
  definition: "Définition",
  why: "Pourquoi",
  objectives: "Objectifs",
  flow: "Flux",
  architecture: "Architecture",
  capture: "Capture",
  qualification: "Qualification",
  automation: "Automatisation",
  channel: "Canal",
  crm: "CRM",
  analytics: "Analytique",
  gallery: "Galerie",
  proof: "Preuve",
  benefits: "Bénéfices",
  kpi: "KPI",
  mistakes: "Erreurs",
  plan: "Plan",
  pricing: "Tarifs",
  faq: "FAQ",
  comparison: "Comparaison",
  timeline: "Chronologie",
  team: "Équipe",
  cta: "Appel à l'action",
  embed: "Page intégrée",
  showcase: "Vitrine de pages",
  screenshots: "Captures (preuves)",
  gauge: "Jauges",
  mockup: "Maquette de page",
  blanks: "Blancs en direct",
  free: "Libre",
};

export const STATUS_LABELS: Record<string, string> = {
  idle: "À jour",
  pending: "Modifications en attente",
  saving: "Enregistrement…",
  saved: "Enregistré",
  invalid: "Corrigez les erreurs avant d'enregistrement",
  error: "Échec de l'enregistrement",
};

export const REGENERATE_MESSAGES = {
  button: "Regénérer (IA)",
  busy: "Regénération…",
  label: "Instructions pour l'IA",
  optional: "facultatif",
  placeholder: "Ex. : utilise 94 % de satisfaction et 12 000 athlètes équipés",
  failed: "La régénération a échoué. Réessayez dans un instant.",
  noCredits: "Crédits IA insuffisants pour régénérer ce slide.",
  rateLimited: "Trop de régénérations d'affilée. Patientez une minute.",
} as const;

export const REGENERATE_INSTRUCTIONS_MAX = 500;

export const PLACEHOLDER_MESSAGES = {
  badge: "À compléter",
  badgeLabel: (count: number) => `${count} élément${count > 1 ? "s" : ""} à compléter`,
  notice: "Remplacez ces éléments par vos propres informations :",
} as const;

const FIELD_LABELS: Record<string, string> = {
  headline: "Titre",
  title: "Titre",
  kicker: "Sur-titre",
  subtitle: "Sous-titre",
  presenterName: "Présentateur",
  eyebrow: "Accroche",
  highlight: "Mise en avant",
  sub: "Sous-titre",
  intro: "Introduction",
  body: "Contenu",
  points: "Points",
  painPoints: "Points de douleur",
  reasons: "Raisons",
  goals: "Objectifs",
  steps: "Étapes",
  layers: "Couches",
  fields: "Champs",
  ctaLabel: "Libellé du bouton",
  questions: "Questions",
  scripts: "Scripts",
  pipelines: "Étapes du pipeline",
  metrics: "Métriques",
  items: "Éléments",
  benefits: "Bénéfices",
  mistakes: "Erreurs",
  phases: "Phases",
  tiers: "Offres",
  columns: "Colonnes",
  rows: "Lignes",
  milestones: "Jalons",
  members: "Membres",
  actions: "Actions",
  notes: "Notes du présentateur",
  script: "Script",
  icon: "Icône",
  text: "Texte",
  label: "Libellé",
  target: "Cible",
  channel: "Canal",
  trigger: "Déclencheur",
  action: "Action",
  delay: "Délai",
  moment: "Moment",
  message: "Message",
  stage: "Étape",
  definition: "Définition",
  name: "Nom",
  caption: "Légende",
  quote: "Citation",
  role: "Rôle",
  result: "Résultat",
  value: "Valeur",
  delta: "Variation",
  fix: "Solution",
  duration: "Durée",
  deliverables: "Livrables",
  price: "Prix",
  features: "Fonctionnalités",
  q: "Question",
  a: "Réponse",
  when: "Quand",
  proof: "Preuve",
  kind: "Type",
  options: "Options",
  question: "Question",
  type: "Type",
  assetId: "Ressource",
  url: "Adresse de la page (https)",
  gauges: "Jauges",
  max: "Maximum",
  suffix: "Suffixe",
  prefix: "Préfixe",
  note: "Note",
  page: "Type de page",
  blocks: "Blocs",
  detail: "Détail",
  cta: "Bouton",
  aside: "Commentaire",
  summary: "Synthèse",
  hint: "Aide pour le présentateur",
};

/** Illustration picker (Task 61). Keys are names from ILLUSTRATIONS. */
export const ILLUSTRATION_MESSAGES = {
  section: "Illustration",
  hint: "Décor facultatif, dans les couleurs du thème. Animé uniquement côté audience.",
  none: "Aucune",
  names: {
    funnel: "Entonnoir",
    automation: "Automatisation",
    dashboard: "Tableau de bord",
    datastream: "Flux de données",
    network: "Réseau",
    orbit: "Orbite",
    target: "Cible",
    shapes: "Formes",
    wave: "Vagues",
    radar: "Radar",
    packets: "Paquets",
    honeycomb: "Alvéoles",
  } as Record<string, string>,
} as const;

/** Layout picker (Task 59). Keys are layout names from SLIDE_LAYOUTS. */
export const LAYOUT_MESSAGES = {
  section: "Mise en page",
  hint: "Le contenu reste le même, seule la disposition change.",
  names: {
    center: "Centrée",
    split: "Deux colonnes",
    editorial: "Éditoriale",
    left: "Alignée à gauche",
    banner: "Bandeau",
    grid: "Grille",
    list: "Liste",
    aside: "Latérale",
    checklist: "Liste cochée",
    featured: "Mise en avant",
    cards: "Cartes",
    timeline: "Frise",
    row: "En ligne",
    hero: "Chiffre phare",
    quote: "Citation",
    table: "Tableau",
  } as Record<string, string>,
} as const;

/** Image field (gallery items): upload to the org's storage, preview, remove. */
export const ASSET_MESSAGES = {
  label: "Image",
  upload: "Importer une image",
  replace: "Remplacer",
  remove: "Retirer",
  uploading: "Import…",
  hint: "PNG, JPEG, WebP ou GIF — 4 Mo max.",
  canvasAdd: "Ajouter une image",
  canvasReplace: "Remplacer l'image",
  canvasRemove: "Retirer l'image",
  errors: {
    TOO_LARGE: "Image trop lourde (4 Mo max).",
    UNSUPPORTED_TYPE: "Format non pris en charge (PNG, JPEG, WebP ou GIF).",
    RATE_LIMITED: "Trop d'imports d'affilée, réessayez dans une minute.",
    FAILED: "L'import a échoué.",
  } as Record<string, string>,
} as const;

/** Presenter cue inputs (structured script, Task 62). */
export const CUE_MESSAGES = {
  section: "Repères du présentateur",
  hint: "Affichés dans le panneau Script pendant la présentation.",
  punchline: "Accroche",
  tag: "Étiquette",
  durationSec: "Durée cible (secondes)",
  transition: "Transition vers la slide suivante",
  bullets: "Conseils (un par ligne)",
  closing: "Phrase de clôture",
} as const;

/** Labels for enum values shown in selects; values without one are shown as-is. */
const OPTION_LABELS: Record<string, string> = {
  optin: "Page d'opt-in",
  sales: "Page de vente",
  checkout: "Page de paiement",
  registration: "Page d'inscription",
  thankyou: "Page de remerciement",
};

export function optionLabel(option: string): string {
  return OPTION_LABELS[option] ?? option;
}

export function fieldLabel(key: string): string {
  const label = FIELD_LABELS[key];
  if (label) return label;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export const EXPORT_MESSAGES = {
  label: "Exporter",
  pdf: "PDF",
  pptx: "PowerPoint (images + notes)",
  busy: "Export…",
  failed: "L'export a échoué. Réessayez dans un instant.",
} as const;

export const THEME_MESSAGES = {
  label: "Thème",
  title: "Thème du deck",
  description: "S'applique à tous les slides, en présentation comme dans la vue audience.",
} as const;

export const CANVAS_MESSAGES = {
  hint: "Cliquez sur un texte de la slide pour le modifier.",
  focus: "Agrandir la slide",
  unfocus: "Afficher le panneau",
} as const;

export const ITEM_MESSAGES = {
  before: "Déplacer avant",
  after: "Déplacer après",
  duplicate: "Dupliquer",
  remove: "Supprimer",
  removed: "Élément supprimé",
  undo: "Annuler",
} as const;

/** Freeform "Libre" slides (Task 68). */
export const FREE_MESSAGES = {
  fieldsHint:
    "Slide libre : sélectionnez, déplacez et redimensionnez les éléments directement sur la slide. Les notes et le script restent ci-dessous.",
  toolbarLabel: "Outils de la slide libre",
  add: "Ajouter",
  addKinds: {
    text: "Texte",
    rect: "Rectangle",
    ellipse: "Cercle",
    line: "Ligne",
    image: "Image",
    icon: "Icône",
  },
  limit: "60 éléments maximum par slide.",
  hint: "Double-cliquez sur un texte pour l'écrire. Suppr pour effacer, Ctrl+Z pour annuler.",
  textStyle: "Style du texte",
  textStyles: { title: "Titre", subtitle: "Sous-titre", body: "Texte", caption: "Légende" },
  align: { left: "Aligner à gauche", center: "Centrer", right: "Aligner à droite" },
  bold: "Gras",
  color: "Couleur",
  fill: "Remplissage",
  roles: {
    text: "Texte",
    muted: "Discret",
    primary: "Principale",
    accent: "Accent",
    surface: "Surface",
    bg: "Fond",
    danger: "Alerte",
    success: "Succès",
  },
  icon: "Changer l'icône",
  image: "Choisir une image",
  fit: { cover: "Remplir", contain: "Ajuster" },
  arrange: "Disposition",
  forward: "Avancer",
  backward: "Reculer",
  front: "Premier plan",
  back: "Arrière-plan",
  alignSelection: {
    left: "Aligner à gauche",
    center: "Centrer horizontalement",
    right: "Aligner à droite",
    top: "Aligner en haut",
    middle: "Centrer verticalement",
    bottom: "Aligner en bas",
  },
  duplicate: "Dupliquer",
  remove: "Supprimer",
  undo: "Annuler",
  redo: "Rétablir",
  convert: "Convertir en libre",
  convertTitle: "Convertir cette slide en slide libre ?",
  convertDescription:
    "Chaque texte, carte et image reste à sa place et devient un élément que vous pouvez déplacer, redimensionner et faire pivoter. La régénération IA et les mises en page automatiques ne s'appliqueront plus à cette slide ; le thème, si. Les icônes et décorations des cartes ne sont pas reprises.",
  convertConfirm: "Convertir",
  convertCancel: "Garder la slide",
  converted: "Slide convertie en slide libre",
} as const;
