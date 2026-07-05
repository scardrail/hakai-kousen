import { HK } from "../../module/helpers/config.mjs";

/**
 * Import en masse depuis une base communautaire (typos, valeurs composées "Cible/Personnel",
 * abréviations "Sp" pour Spéciale...) : on privilégie des correspondances tolérantes avec repli
 * plutôt que de bloquer l'import sur une entrée mal saisie. Chaque fonction de mapping renvoie
 * `{ valeur, repli }` ; `repli: true` signale une correspondance approximative à vérifier
 * manuellement plus tard (les scripts parse-*.mjs les comptent et les résument en fin d'exécution).
 */

/** Minuscule + accents retirés : "Ténèbres" -> "tenebres", "Zone Ennemie" -> "zone ennemie". */
export function normalize(label) {
  return label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

const TYPES_ALIAS = {
  aucun: "normal" // quelques attaques du site n'ont pas de type renseigné ("Aucun").
};

export function mapType(label) {
  const cle = normalize(label);
  if (HK.types[cle]) return { valeur: cle, repli: false };
  if (TYPES_ALIAS[cle]) return { valeur: TYPES_ALIAS[cle], repli: true };
  return { valeur: "normal", repli: true };
}

const CATEGORIES_ALIAS = {
  sp: "speciale" // abréviation/typo observée sur le site pour "Spéciale".
};

export function mapCategorie(label) {
  const cle = normalize(label);
  if (HK.categoriesAttaque[cle]) return { valeur: cle, repli: false };
  if (CATEGORIES_ALIAS[cle]) return { valeur: CATEGORIES_ALIAS[cle], repli: true };
  return { valeur: "autre", repli: true };
}

const PORTEES_SYNONYMES = {
  cible: "cible",
  cibles: "cible",
  "cible aleatoire": "cible",
  "cible sauf lanceur": "cible",
  rayon: "rayon",
  zone: "zone",
  personnel: "personnel",
  personnal: "personnel",
  sonore: "sonore",
  "zone ennemie": "zoneEnnemie",
  "tous les adversaires": "zoneEnnemie",
  "zone amie": "zoneAmie",
  "zone alliee": "zoneAmie",
  allie: "zoneAmie",
  "cible alliee": "zoneAmie",
  "tous les allies": "zoneAmie"
};

/** Gère aussi les valeurs composées du site ("Cible/Personnel", "Personnel/Zone") : on ne retient
 * que le premier segment. */
export function mapPortee(label) {
  const cle = normalize(label);
  if (PORTEES_SYNONYMES[cle]) return { valeur: PORTEES_SYNONYMES[cle], repli: false };

  const premierSegment = cle.split("/")[0]?.trim();
  if (premierSegment && PORTEES_SYNONYMES[premierSegment]) {
    return { valeur: PORTEES_SYNONYMES[premierSegment], repli: true };
  }

  return { valeur: "cible", repli: true };
}

/** "-" (ou vide) : le site n'indique pas de précision numérique -> l'attaque touche toujours. */
export function mapPrecision(label) {
  const texte = label.trim();
  if (/^\d+$/.test(texte)) return { precision: Math.max(1, Math.min(100, Number(texte))), toujoursTouche: false };
  return { precision: null, toujoursTouche: true };
}

/**
 * Extraction best-effort de statut/modifStats depuis le texte libre "effets" (Phase 5). Le texte
 * source (hakaikousen.fr) est en langage naturel avec de très nombreuses tournures ; on ne cible
 * que les formulations les plus fréquentes et sans ambiguïté, et on laisse tout le reste en texte
 * libre plutôt que de risquer une extraction fausse. Chaque attaque ne peut porter qu'un seul
 * `statut` (limite du schéma) : en cas de plusieurs mentions, la première trouvée gagne.
 */
const VERBES_STATUT = [
  { regex: /emp(?:oi|oî)son(?:n|ss)\w*\s+grave/i, statut: "poisonGrave" },
  { regex: /emp(?:oi|oî)son/i, statut: "poison" },
  { regex: /br[uû]l/i, statut: "brulure" },
  { regex: /paralys/i, statut: "paralysie" },
  { regex: /\bgel[ée]?r?\b|\bgèle/i, statut: "gel" },
  { regex: /endor|sommeil/i, statut: "sommeil" },
  { regex: /apeur/i, statut: "peur" },
  { regex: /confus/i, statut: "confusion" },
  { regex: /amoureu/i, statut: "attraction" }
];

export function extraireStatut(texte) {
  // "Soigne la brûlure", "Guérit les problèmes de statut"... : verbes curatifs, jamais infligés.
  if (/^(soigne|guéri|gu[ée]rit|dissipe|retire\s+le\s+statut)/i.test(texte.trim())) return null;

  const chanceMatch = texte.match(/(\d+)\s*%\s*(?:de\s*)?chances?\s*d['’e]*\s*([^.;]{0,60})/i);
  if (chanceMatch) {
    const phrase = chanceMatch[2];
    for (const { regex, statut } of VERBES_STATUT) {
      if (regex.test(phrase)) return { type: statut, chance: Number(chanceMatch[1]) };
    }
  }

  // Pas de pourcentage : n'accepte que si un verbe de statut ouvre franchement la phrase, pour
  // éviter de confondre une condition ("si la cible est déjà Brûlée...") avec un effet infligé.
  const debut = texte.trim().slice(0, 20);
  for (const { regex, statut } of VERBES_STATUT) {
    if (regex.test(debut)) return { type: statut, chance: 100 };
  }
  return null;
}

const CARACTERISTIQUES_TEXTE = [
  { regex: /force/i, cle: "for" },
  { regex: /endurance/i, cle: "end" },
  { regex: /concentration/i, cle: "con" },
  { regex: /volont[ée]/i, cle: "vol" },
  { regex: /dexterit[ée]|dextérit[ée]/i, cle: "dex" }
];

/** Repère "Augmente/Baisse/Diminue <liste de Caractéristiques> du lanceur/de la cible de N". Une
 * seule valeur N par occurrence trouvée : ignore les phrases mêlant plusieurs valeurs différentes
 * (ex. "Force +1 et Précision +10%") plutôt que de risquer un mauvais découpage. */
export function extraireModifStats(texte) {
  const modifs = [];
  const regexGlobale = /(Augmente|Baisse|Diminue)\s+([^.;]+?)\s+(du lanceur|de la cible|des cibles)\s+de\s+(\d+)\b(?!\s*%)/gi;
  let match;
  while ((match = regexGlobale.exec(texte))) {
    const [, verbe, listeStats, cibleTexte, valeurTexte] = match;
    if (/pr[ée]cision|vitalit[ée]|[ée]nergie|initiative/i.test(listeStats)) continue;

    const signe = /^augmente/i.test(verbe) ? 1 : -1;
    const valeur = signe * Number(valeurTexte);
    const cible = cibleTexte.toLowerCase().includes("lanceur") ? "lanceur" : "cible";

    for (const { regex, cle } of CARACTERISTIQUES_TEXTE) {
      if (regex.test(listeStats)) modifs.push({ caracteristique: cle, valeur, cible });
    }
  }
  return modifs;
}
