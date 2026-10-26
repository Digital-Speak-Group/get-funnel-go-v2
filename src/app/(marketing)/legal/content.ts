/**
 * Legal copy (French). DRAFT written from what the product does today; it has not been reviewed
 * by a lawyer. Every company fact we do not know is written as `todo("…")` so it shows up as a
 * visible placeholder and the unit test can count what is left before launch.
 */

export const TODO_MARKER = "[À COMPLÉTER";

/** A visible placeholder for a fact only the company can supply. */
export const todo = (what: string) => `${TODO_MARKER} : ${what}]`;

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: string[];
}

export interface LegalDocument {
  slug: "terms" | "privacy" | "mentions";
  title: string;
  description: string;
  /** ISO date of the last edit of the text. */
  updated: string;
  intro: string;
  sections: LegalSection[];
}

const PUBLISHER = todo("dénomination sociale");
const CONTACT = todo("adresse e-mail de contact");

export const termsDocument: LegalDocument = {
  slug: "terms",
  title: "Conditions générales de vente et d'utilisation",
  description: "Les règles qui s'appliquent à l'utilisation de GetFunnels et à la souscription d'un plan payant.",
  updated: "2026-10-16",
  intro: `Les présentes conditions régissent l'accès et l'utilisation du service GetFunnels, édité par ${PUBLISHER} (« l'Éditeur »). En créant un compte, vous les acceptez.`,
  sections: [
    {
      title: "1. Le service",
      paragraphs: [
        "GetFunnels permet de coller un script de vente, de générer avec l'aide d'une intelligence artificielle un deck de présentation, de le modifier, de le présenter avec un écran présentateur et de le partager en lecture seule avec une audience via un lien.",
        "Le service est fourni en l'état, par abonnement ou à l'usage selon le plan choisi. Les fonctionnalités de chaque plan sont décrites sur la page Tarifs.",
      ],
    },
    {
      title: "2. Compte et organisation",
      paragraphs: [
        "Vous devez fournir une adresse e-mail valide et choisir un mot de passe que vous gardez confidentiel. Vous êtes responsable de l'activité réalisée depuis votre compte.",
        "Un compte appartient à une organisation. Les membres d'une organisation voient les decks de cette organisation selon leur rôle (propriétaire, administrateur, éditeur, lecteur). Les données d'une organisation ne sont jamais visibles d'une autre organisation.",
      ],
    },
    {
      title: "3. Plans, crédits et paiement",
      paragraphs: [
        "Chaque plan inclut un budget mensuel de crédits utilisé par les générations et réécritures par IA. Les prix et les budgets en vigueur sont ceux affichés sur la page Tarifs au moment de la souscription.",
        "Les abonnements sont payés par carte via Stripe et se renouvellent automatiquement à chaque période jusqu'à résiliation. Vous pouvez changer de plan ou résilier depuis la page Facturation ; la résiliation prend effet à la fin de la période payée.",
        `Sauf mention contraire, les prix sont indiqués ${todo("HT ou TTC, taux de TVA applicable")}.`,
        "Lorsque le budget de crédits est épuisé, les générations par IA sont bloquées jusqu'au renouvellement ou à un changement de plan. Les crédits non utilisés ne sont pas reportés. Une génération qui échoue est remboursée en crédits.",
      ],
    },
    {
      title: "4. Droit de rétractation et remboursement",
      paragraphs: [
        todo(
          "politique de remboursement et de rétractation (service numérique exécuté dès la souscription ; distinguer clients professionnels et consommateurs)"
        ),
      ],
    },
    {
      title: "5. Votre contenu",
      paragraphs: [
        "Vous restez propriétaire des scripts, textes, images et decks que vous importez ou créez. Vous accordez à l'Éditeur le droit limité de les héberger, les traiter et les afficher dans la seule mesure nécessaire pour fournir le service (y compris les envoyer au fournisseur d'IA pour générer ou réécrire un contenu).",
        "Vous garantissez détenir les droits sur ce que vous importez et que le contenu ne porte pas atteinte aux droits de tiers ni à la loi.",
        "Un deck est visible par toute personne qui possède son lien d'audience. Vous pouvez régénérer ce lien à tout moment depuis les paramètres du deck : l'ancien lien cesse alors de fonctionner.",
      ],
    },
    {
      title: "6. Contenu généré par IA",
      paragraphs: [
        "Les decks et textes générés par IA peuvent contenir des erreurs ou des formulations inadaptées. Vous êtes responsable de les relire avant de les présenter, en particulier les chiffres, les références clients et les promesses commerciales.",
        "Le contenu généré à partir de votre script vous appartient dans les mêmes conditions que le reste de votre contenu.",
      ],
    },
    {
      title: "7. Utilisation acceptable",
      items: [
        "ne pas tenter d'accéder aux données d'une autre organisation ni de contourner les limites techniques ou les plafonds de crédits ;",
        "ne pas utiliser le service pour diffuser des contenus illicites, trompeurs ou portant atteinte aux droits d'autrui ;",
        "ne pas surcharger le service par des appels automatisés non autorisés ;",
        "n'intégrer dans un deck que des pages tierces autorisées par le service.",
      ],
    },
    {
      title: "8. Disponibilité et responsabilité",
      paragraphs: [
        "L'Éditeur met en œuvre les moyens raisonnables pour assurer la disponibilité du service, sans garantir l'absence d'interruption, notamment lors de maintenances ou en cas de défaillance d'un prestataire tiers.",
        `Dans les limites permises par la loi, la responsabilité de l'Éditeur est limitée aux dommages directs et plafonnée ${todo("plafond, par exemple le montant payé sur les 12 derniers mois")}.`,
      ],
    },
    {
      title: "9. Suspension et résiliation",
      paragraphs: [
        "Vous pouvez supprimer votre compte à tout moment en nous contactant. L'Éditeur peut suspendre un compte en cas de manquement grave à ces conditions, après information préalable sauf urgence.",
      ],
    },
    {
      title: "10. Évolution des conditions",
      paragraphs: [
        "Ces conditions peuvent évoluer. En cas de changement important, les utilisateurs en sont informés avant son entrée en vigueur. La date de dernière mise à jour figure en haut de cette page.",
      ],
    },
    {
      title: "11. Droit applicable et litiges",
      paragraphs: [
        `Ces conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action. À défaut, les tribunaux compétents sont ceux de ${todo("ville du siège / juridiction")}, sous réserve des règles impératives applicables aux consommateurs.`,
        `Contact : ${CONTACT}.`,
      ],
    },
  ],
};

export const privacyDocument: LegalDocument = {
  slug: "privacy",
  title: "Politique de confidentialité",
  description: "Quelles données personnelles GetFunnels traite, pourquoi, avec qui, et comment exercer vos droits.",
  updated: "2026-10-16",
  intro: `Cette politique explique comment ${PUBLISHER}, responsable de traitement, traite vos données personnelles lorsque vous utilisez GetFunnels, conformément au RGPD.`,
  sections: [
    {
      title: "1. Données que nous traitons",
      items: [
        "Compte : adresse e-mail, nom éventuel, mot de passe (stocké sous forme chiffrée par notre service d'authentification), organisation et rôle.",
        "Contenu : scripts de vente collés, decks, slides, notes de présentation, images importées.",
        "Utilisation : événements du produit (inscription, génération lancée, réussie ou échouée, deck présenté, audience connectée), avec un identifiant d'organisation haché et le plan, ainsi que les coûts et volumes de génération par IA.",
        "Facturation : plan, statut d'abonnement et identifiants Stripe. Les numéros de carte sont saisis chez Stripe et ne transitent pas par nos serveurs.",
        "Technique : journaux d'erreurs et de performance, adresse IP pour la limitation de débit et la sécurité.",
        "Audience : les personnes qui ouvrent un lien d'audience n'ont pas de compte ; nous ne leur demandons aucune donnée et le lien ne révèle ni l'organisation ni votre adresse e-mail.",
      ],
    },
    {
      title: "2. Pourquoi et sur quelle base",
      items: [
        "Fournir le service et gérer votre compte, y compris la génération de decks (exécution du contrat).",
        "Facturer et gérer les abonnements (exécution du contrat, obligations légales comptables).",
        "Assurer la sécurité, prévenir les abus et corriger les erreurs (intérêt légitime).",
        "Mesurer l'usage du produit pour l'améliorer (intérêt légitime ; mesure limitée aux événements ci-dessus).",
      ],
    },
    {
      title: "3. Intelligence artificielle",
      paragraphs: [
        "Lorsque vous générez ou réécrivez un contenu, le texte concerné (votre script, le slide ou le passage sélectionné et vos consignes) est envoyé à notre fournisseur d'IA, Groq, uniquement pour produire le résultat demandé. N'incluez pas dans un script de données personnelles qui n'ont pas besoin d'y figurer.",
        todo("conditions du fournisseur d'IA : conservation et utilisation pour l'entraînement, à vérifier avant publication"),
      ],
    },
    {
      title: "4. Destinataires et sous-traitants",
      paragraphs: ["Nous faisons appel aux prestataires suivants, qui traitent des données pour notre compte :"],
      items: [
        "Supabase : authentification, base de données et stockage des fichiers.",
        "Stripe : paiement et facturation.",
        "Groq : génération et réécriture de contenu par IA.",
        "Resend : envoi des e-mails transactionnels.",
        "PostHog : mesure d'usage du produit (événements envoyés depuis nos serveurs).",
        "Sentry : suivi des erreurs.",
        `Hébergement de l'application : ${todo("hébergeur")}.`,
      ],
    },
    {
      title: "5. Transferts hors de l'Union européenne",
      paragraphs: [
        todo(
          "régions d'hébergement de chaque prestataire et garanties en cas de transfert (clauses contractuelles types, cadre de protection des données UE–États-Unis)"
        ),
      ],
    },
    {
      title: "6. Durée de conservation",
      items: [
        "Compte et contenu : tant que le compte est actif ; supprimés à la clôture du compte, sous réserve des délais techniques de sauvegarde.",
        "Données de facturation : durée légale de conservation comptable.",
        `Journaux techniques : ${todo("durée")}.`,
      ],
    },
    {
      title: "7. Cookies et stockage local",
      paragraphs: [
        "GetFunnels utilise uniquement des cookies strictement nécessaires : le cookie de session d'authentification, qui vous garde connecté. Le navigateur conserve aussi des préférences d'interface (par exemple l'état du menu latéral). Ils ne servent ni à la publicité ni au suivi et ne nécessitent pas de consentement.",
        "Les paiements sont réalisés sur des pages Stripe, qui peuvent déposer leurs propres cookies.",
      ],
    },
    {
      title: "8. Vos droits",
      paragraphs: [
        `Vous pouvez demander l'accès, la rectification, l'effacement, la limitation, la portabilité de vos données et vous opposer à certains traitements, en écrivant à ${CONTACT}. Nous répondons dans un délai d'un mois.`,
        "Vous pouvez aussi introduire une réclamation auprès de la CNIL (cnil.fr).",
      ],
    },
    {
      title: "9. Sécurité",
      paragraphs: [
        "Les données de chaque organisation sont isolées par des règles d'accès au niveau de l'application et de la base de données. Les secrets restent côté serveur et les échanges sont chiffrés en transit.",
      ],
    },
  ],
};

export const mentionsDocument: LegalDocument = {
  slug: "mentions",
  title: "Mentions légales",
  description: "Éditeur, hébergeur et contact du site GetFunnels.",
  updated: "2026-10-16",
  intro: "Informations légales du site et du service GetFunnels, conformément à la loi pour la confiance dans l'économie numérique.",
  sections: [
    {
      title: "Éditeur",
      items: [
        `Dénomination : ${PUBLISHER}`,
        `Forme juridique et capital : ${todo("forme juridique, capital social")}`,
        `Siège social : ${todo("adresse")}`,
        `Immatriculation : ${todo("SIREN / RCS")}`,
        `TVA intracommunautaire : ${todo("numéro de TVA")}`,
        `Directeur de la publication : ${todo("nom")}`,
        `Contact : ${CONTACT}`,
      ],
    },
    {
      title: "Hébergement",
      items: [
        `Application : ${todo("nom, adresse et téléphone de l'hébergeur")}`,
        "Base de données, authentification et fichiers : Supabase, Inc.",
      ],
    },
    {
      title: "Propriété intellectuelle",
      paragraphs: [
        "La marque GetFunnels, le site, les modèles de decks et les thèmes sont protégés. Toute reproduction non autorisée est interdite. Les contenus créés par les utilisateurs restent leur propriété.",
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS = [termsDocument, privacyDocument, mentionsDocument] as const;

/** Every placeholder still in a document: what the company has to fill in before launch. */
export function countPlaceholders(doc: LegalDocument): number {
  const text = [doc.intro, ...doc.sections.flatMap((s) => [...(s.paragraphs ?? []), ...(s.items ?? [])])].join("\n");
  return text.split(TODO_MARKER).length - 1;
}
