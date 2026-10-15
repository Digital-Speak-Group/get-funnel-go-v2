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

/** "Réécrire" on a text of the slide (Task 79). */
export const REWRITE_MESSAGES = {
  button: "Réécrire",
  busy: "Réécriture…",
  hint: "Cliquez dans un texte de la slide, puis choisissez comment le réécrire.",
  actions: {
    shorter: "Plus court",
    persuasive: "Plus percutant",
    formal: "Plus formel",
    simpler: "Plus simple",
    fix: "Corriger l'orthographe",
    custom: "Instruction libre…",
  },
  customTitle: "Réécrire avec votre instruction",
  customLabel: "Instruction",
  customPlaceholder: "Ex. : ajoute un appel à l'action, tutoie le client…",
  customConfirm: "Réécrire",
  cancel: "Annuler",
  done: "Texte réécrit",
  undo: "Annuler",
  failed: "La réécriture a échoué. Réessayez dans un instant.",
  noCredits: "Crédits IA insuffisants pour réécrire ce texte.",
  rateLimited: "Trop de réécritures d'affilée. Patientez une minute.",
  richNote: "La mise en forme du texte (gras, listes…) n'est pas conservée.",
} as const;

/** Quick instructions under "Régénérer ce slide" (Task 79). */
export const REGENERATE_CHIPS = [
  "Plus court et plus percutant",
  "Ton plus formel",
  "Mets en avant les bénéfices client",
  "Utilise les chiffres du script",
] as const;

export const PLACEHOLDER_MESSAGES = {
  badge: "À compléter",
  badgeLabel: (count: number) => `${count} élément${count > 1 ? "s" : ""} à compléter`,
  notice: "Remplacez ces éléments par vos propres informations :",
} as const;

/** Slide background and transition (Tasks 73–74). */
export const SLIDE_STYLE_MESSAGES = {
  section: "Fond et transition",
  background: "Fond",
  kinds: { theme: "Thème", color: "Couleur", gradient: "Dégradé", image: "Image" },
  color: "Couleur",
  from: "Début",
  to: "Fin",
  angle: "Direction",
  angleValue: (deg: number) => `${deg}°`,
  pickImage: "Choisir une image",
  replaceImage: "Remplacer l'image",
  uploading: "Envoi…",
  overlay: "Voile",
  overlayHint: "Un voile de la couleur du thème garde le texte lisible.",
  transition: "Transition à l'arrivée",
  transitions: { fade: "Fondu", slide: "Glissement", zoom: "Zoom", none: "Aucune" },
  transitionHint: "Visible par l'audience quand ce slide apparaît.",
} as const;

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
  emptyTitle: "Ce deck n'a pas encore de slide",
  emptyBody: "Ajoutez un slide dans la liste à gauche pour commencer à construire votre présentation.",
  hint: "Cliquez sur un texte de la slide pour le modifier.",
  focus: "Agrandir la slide",
  unfocus: "Afficher le panneau",
  cell: "Cellule",
  zoomIn: "Zoom avant",
  zoomOut: "Zoom arrière",
  zoomFit: "Ajuster à l'écran",
  zoomLabel: (percent: number) => `Zoom : ${percent} % (cliquer pour ajuster)`,
} as const;

export const ITEM_MESSAGES = {
  before: "Déplacer avant",
  after: "Déplacer après",
  duplicate: "Dupliquer",
  remove: "Supprimer",
  removed: "Élément supprimé",
  undo: "Annuler",
} as const;

export { fieldLabel, optionLabel } from "./field-labels";
export { FREE_MESSAGES } from "./free/messages";

/** Editor top bar (Task 46). */
export const TOPBAR_MESSAGES = {
  back: "Retour au tableau de bord",
  slides: (n: number) => `${n} slide${n > 1 ? "s" : ""}`,
  rename: "Renommer le deck",
  titleLabel: "Titre du deck",
  renameFailed: "Le renommage a échoué.",
  present: "Présenter",
  undo: "Annuler la dernière modification",
  redo: "Rétablir la modification",
  inspector: "Propriétés du slide",
  inspectorEmpty: "Ajoutez un slide pour commencer l'édition.",
} as const;

/** Inspector form (Task 46). */
export const FIELD_MESSAGES = {
  optional: "facultatif",
  emptyList: "Aucun élément pour l'instant.",
  add: "Ajouter",
  remove: "Supprimer",
  content: "Contenu",
  presenter: "Présentateur",
} as const;

/** Slide rail (Task 46). */
export const SLIDE_LIST_MESSAGES = {
  title: "Slides",
  empty: "Aucun slide. Ajoutez le premier pour commencer.",
  newSlide: "Nouveau slide",
  add: "Ajouter un slide",
  moveUp: (n: number) => `Monter le slide ${n}`,
  moveDown: (n: number) => `Descendre le slide ${n}`,
  duplicate: (n: number) => `Dupliquer le slide ${n}`,
  remove: (n: number) => `Supprimer le slide ${n}`,
  menu: { up: "Monter", down: "Descendre", duplicate: "Dupliquer", remove: "Supprimer" },
  dragHint: "Glissez les miniatures pour réordonner les slides.",
} as const;
