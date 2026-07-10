/**
 * Lit chaque page tools/scraper/cache/pokemon/<slug>.html et produit tools/data/pokedex-full.json.
 *
 * Chaque page contient en réalité DEUX générations de contenu ("7G"/"8G", onglets data-anim 1/2,
 * légèrement différentes stats/movepool) : on ne prend que la première (`section.contenu.
 * activeContenu`, celle affichée par défaut) — rien dans nos Docs_source ne permet de préférer
 * l'autre. À l'intérieur de cette génération, on ne garde que les données "Système remanié"
 * (Table Unique, Les combats.md) pour les capacités apprises par expérience, comme pour les
 * attaques (cf. parse-attaques.mjs). CT/DT/groupe d'oeuf/tutorat ne sont pas importés (hors
 * périmètre : on se limite au movepool de départ typique d'un gabarit de dex).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { mapType } from "./mappings.mjs";
import { safeFilename, capitalizeName } from "./util.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CACHE_DIR = path.join(__dirname, "cache", "pokemon");
const ASSETS_DIR = path.join(ROOT, "assets", "pokemon");
const OUT_FILE = path.join(ROOT, "tools", "data", "pokedex-full.json");
const ATTAQUES_FILE = path.join(ROOT, "tools", "data", "attaques-full.json");

function escapeHtml(texte) {
  return texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const attaquesConnues = new Set(JSON.parse(fs.readFileSync(ATTAQUES_FILE, "utf8")).map((a) => a.name));

function genScope($) {
  let $gen = $("section.contenu.activeContenu").first();
  if (!$gen.length) $gen = $("section.contenu").first();
  return $gen;
}

function extraireNom($, $gen) {
  const brut = $gen.find(".actuel .nactuel strong").first().text();
  const sansNumero = brut.replace(/^\s*\d+\s*/, "").trim();
  return capitalizeName(sansNumero);
}

function extraireTypes($, $gen, avertissements) {
  const types = [];
  $gen
    .find("div.div-info")
    .first()
    .find("div.type")
    .each((_, el) => {
      const classe = ($(el).attr("class") || "").replace(/^type\s+type-/, "");
      try {
        types.push(mapType(classe).valeur);
      } catch {
        avertissements.push(`type inconnu ignoré : "${classe}"`);
      }
    });
  return [...new Set(types)];
}

function extraireStats($, $gen) {
  const stats = {};
  $gen
    .find("div.stats")
    .first()
    .find("div.stat")
    .each((_, el) => {
      const classe = $(el).find(".stat-name").attr("class") || "";
      const cle = classe.replace("stat-name", "").replace(/stat-/, "").trim();
      const valeur = Number($(el).find(".stat-value").text().trim()) || 0;
      stats[cle] = valeur;
    });
  return stats;
}

function extraireTalents($, $gen) {
  const talents = [];
  const rows = $gen.find("table.talents").first().find("tr");
  let courant = null;
  rows.each((_, el) => {
    const classe = $(el).attr("class") || "";
    if (classe.includes("upper")) {
      courant = { name: $(el).find("span").first().text().trim(), description: "" };
    } else if (classe.includes("lower") && courant) {
      courant.description = $(el).find("span").first().text().trim();
      talents.push(courant);
      courant = null;
    }
  });

  const emplacements = ["premier", "second", "cache"];
  return talents.map((t, i) => ({
    name: t.name,
    system: {
      emplacement: emplacements[i] ?? "cache",
      description: t.description ? `<p>${escapeHtml(t.description)}</p>` : ""
    }
  }));
}

// Gabarit d'espèce (pas un individu) : toujours "asexué", cf. plan Phase 4. Le ratio brut du site
// est conservé en texte dans l'historique pour référence.
function extraireRatio($, $gen) {
  return $gen.find("div.div-ratio").first().text().replace(/\s+/g, " ").trim();
}

function extraireTailleEtPoids($, $gen) {
  const texte = $gen.find("div.div-info").first().text().replace(/\s+/g, " ");
  const taille = texte.match(/Taille\s*:\s*([^\s]+(?:\s*m)?)/i)?.[1] ?? "";
  const poids = texte.match(/Poids\s*:\s*([^\s]+(?:\s*kg)?)/i)?.[1] ?? "";
  return { taille, poids };
}

function extraireEvolution($, $gen) {
  return $gen.find("section.evo").first().text().replace(/\s+/g, " ").trim();
}

const MOTS_NIVEAU = "(?:niveau|lvl?|lv)";
const GENRES = { femelle: "femelle", "mâle": "male", male: "male" };
const SYNONYMES_HEURE = { jour: "jour", journée: "jour", nuit: "nuit", nuitée: "nuit" };

/**
 * Ne garde que les blocs "Evolutions" (jamais "Pré-Evolution", cf. structure DOM confirmée sur
 * Altaria/Amonistar : chaque page ne liste QUE sa propre évolution suivante sous ce libellé, la
 * précédente étant sous un libellé distinct "Pré-Evolution").
 */
function extraireEvolutionsBrutes($, $gen) {
  const paires = [];
  $gen.find("div.div-evo").each((_, el) => {
    const label = $(el).find("p").first().text().trim();
    if (!/^evolutions?$/i.test(label)) return;
    $(el)
      .find("a.a-evo")
      .each((_, a) => {
        const conditionTexte = $(a).find(".condition").text().replace(/\s+/g, " ").trim();
        const cible = $(a).find(".pokemon").text().replace(/\s+/g, " ").trim();
        if (cible) paires.push({ conditionTexte, cible });
      });
  });
  return paires;
}

/**
 * Classification conservatrice (Phase mécaniques de jeu, évolution) : ne structure que les motifs
 * à haute confiance (niveau seul ou combiné à genre/heure/combat, pierre/objet, bonheur, échange).
 * Tout le reste (formules de caractéristiques, conditions narratives uniques, "Spécial", "?",
 * auto-références de données) reste en texte libre dans l'historique et remonte en avertissement
 * pour être complété manuellement — cf. philosophie déjà suivie pour statut/modifStats (Phase 5).
 * Les Méga/Primo-évolutions (mécanique distincte, cf. system.combat.megaEvolue) sont ignorées.
 */
function classifierConditionEvolution(texteBrut, cible, nomEspece) {
  const texte = texteBrut.trim();

  if (/^méga[\s-]/i.test(cible) || /^primo-/i.test(cible)) return { ignorer: true };
  if (!texte || texte === "?" || cible.toLowerCase() === nomEspece.toLowerCase()) {
    return { ambigu: true, motif: "condition vide, inconnue (?) ou auto-référence" };
  }
  if (/[<>=]/.test(texte) || /\b(for|end|con|vol|dex)\b/i.test(texte)) {
    return { ambigu: true, motif: "formule de comparaison de caractéristiques" };
  }

  let m = texte.match(new RegExp(`^${MOTS_NIVEAU}?\\s*(\\d+)\\s*(?:[,+]?\\s*(?:de\\s+)?(.+))?$`, "i"));
  if (m) {
    const conditions = [{ type: "niveau", valeur: m[1] }];
    if (m[2]) {
      const suffixe = m[2].trim().toLowerCase();
      if (suffixe in GENRES) conditions.push({ type: "genre", valeur: GENRES[suffixe] });
      else if (suffixe in SYNONYMES_HEURE) conditions.push({ type: "heure", valeur: SYNONYMES_HEURE[suffixe] });
      else if (suffixe === "en combat") conditions.push({ type: "combat", valeur: "" });
      else return { ambigu: true, motif: `suffixe de niveau non reconnu : "${suffixe}"` };
    }
    return { conditions };
  }

  if (/^bonheur$/i.test(texte)) return { conditions: [{ type: "bonheur", valeur: "" }] };
  m = texte.match(/^bonheur\s*,\s*(jour|journée|nuit|nuitée)$/i);
  if (m) return { conditions: [{ type: "bonheur", valeur: "" }, { type: "heure", valeur: SYNONYMES_HEURE[m[1].toLowerCase()] }] };

  if (/^(pierre|objet|griffe)\b/i.test(texte)) return { conditions: [{ type: "objet", valeur: texte }] };

  m = texte.match(/^échange(?:\s+avec\s+(.+))?$/i);
  if (m) return { conditions: [{ type: "echange", valeur: m[1] ? m[1].trim() : "" }] };

  return { ambigu: true, motif: "motif non reconnu" };
}

function extraireEvolutionsStructurees($, $gen, nomEspece, avertissements) {
  const evolutions = [];
  for (const { conditionTexte, cible } of extraireEvolutionsBrutes($, $gen)) {
    const resultat = classifierConditionEvolution(conditionTexte, cible, nomEspece);
    if (resultat.ignorer) continue;
    if (resultat.ambigu) {
      avertissements.push(
        `${nomEspece} : évolution non structurée automatiquement (${resultat.motif}) — "${conditionTexte}" -> "${cible}", à compléter manuellement si besoin.`
      );
      continue;
    }
    evolutions.push({ cible, conditions: resultat.conditions });
  }
  return evolutions;
}

function extraireMoves($, $gen, avertissements, nomPokemon) {
  const table = $gen.find("section.contenu-energie2 table.dexcapa").first();
  const noms = [];
  table.find("tbody tr.upper").each((_, tr) => {
    const spans = $(tr).find("td .inner-container");
    // Colonnes : Niveau, nom, type, énergie, précision, portée, catégorie, dégâts.
    const nom = $(spans[1]).find("span").first().text().trim();
    if (!nom) return;
    if (!attaquesConnues.has(nom)) {
      avertissements.push(`${nomPokemon} : attaque "${nom}" absente du pack attaques, ignorée`);
      return;
    }
    noms.push(nom);
  });
  return [...new Set(noms)];
}

/**
 * Movepool par niveau (même table que extraireMoves, colonne Niveau cette fois) : sert au palier
 * automatique (module/helpers/niveau.mjs), séparé du movepool "de départ" ci-dessus qui reste le
 * jeu complet embarqué sur le gabarit Pokédex (usage de référence, pas de plafond de niveau).
 */
function extraireMovepoolNiveau($, $gen) {
  const table = $gen.find("section.contenu-energie2 table.dexcapa").first();
  const entrees = [];
  table.find("tbody tr.upper").each((_, tr) => {
    const spans = $(tr).find("td .inner-container");
    const niveauTexte = $(spans[0]).find("span").first().text().trim();
    const nom = $(spans[1]).find("span").first().text().trim();
    if (!nom || !attaquesConnues.has(nom)) return;
    const niveau = /^départ$/i.test(niveauTexte) ? 1 : Number(niveauTexte);
    if (!Number.isInteger(niveau) || niveau < 1) return;
    entrees.push({ niveau, attaque: nom });
  });
  return entrees;
}

function traiterPage(fichier) {
  const slug = fichier.replace(/\.html$/, "");
  const html = fs.readFileSync(path.join(CACHE_DIR, fichier), "utf8");
  const $ = cheerio.load(html);
  const $gen = genScope($);
  const avertissements = [];

  const name = extraireNom($, $gen);
  const types = extraireTypes($, $gen, avertissements);
  const stats = extraireStats($, $gen);
  const talents = extraireTalents($, $gen);
  const ratioTexte = extraireRatio($, $gen);
  const { taille, poids } = extraireTailleEtPoids($, $gen);
  const evolution = extraireEvolution($, $gen);
  const evolutions = extraireEvolutionsStructurees($, $gen, name, avertissements);
  const items = extraireMoves($, $gen, avertissements, name);
  const movepoolNiveau = extraireMovepoolNiveau($, $gen);

  const imgFile = path.join(ASSETS_DIR, `${safeFilename(slug)}.png`);
  const img = fs.existsSync(imgFile) ? `${safeFilename(slug)}.png` : null;

  const historique =
    `<p><em>Gabarit d'espèce importé depuis hakaikousen.fr (système remanié / Table Unique). ` +
    `Rareté et genre non fournis par le site : valeurs par défaut, à ajuster.</em></p>` +
    (ratioTexte ? `<p>${escapeHtml(ratioTexte)}</p>` : "") +
    (evolution ? `<p>${escapeHtml(evolution)}</p>` : "");

  const car = (base) => ({ base: base ?? 3, iv: 0, ev: 0 });

  return {
    warnings: avertissements,
    entry: {
      name,
      img,
      system: {
        espece: name,
        types,
        genre: "asexue",
        rarete: "commun",
        taille,
        poids,
        caracteristiques: {
          for: car(stats.for),
          end: car(stats.end),
          con: car(stats.con),
          vol: car(stats.vol),
          dex: car(stats.dex)
        },
        vita: { base: stats.vit ?? 20, iv: 0, ev: 0, value: stats.vit ?? 20 },
        energie: { value: 50, max: 50 },
        nature: "hardi",
        talent: talents[0]?.name ?? "",
        obeissance: { confiance: 4, dressage: 4 },
        xp: 0,
        niveau: 5,
        historique,
        evolutions,
        movepoolNiveau
      },
      items,
      talents
    }
  };
}

const fichiers = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith(".html"));
console.log(`Hakaï Kōsen | Traitement de ${fichiers.length} fiches Pokémon...`);

const resultats = [];
let avertissementsTotal = 0;
let echecs = 0;

for (const fichier of fichiers) {
  try {
    const { entry, warnings } = traiterPage(fichier);
    resultats.push(entry);
    if (warnings.length) {
      avertissementsTotal += warnings.length;
      for (const w of warnings) console.warn(`  ${w}`);
    }
  } catch (err) {
    echecs++;
    console.warn(`  échec sur ${fichier} : ${err.message}`);
  }
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(resultats, null, 2));
console.log(
  `Hakaï Kōsen | ${resultats.length} Pokémon écrits dans ${path.relative(ROOT, OUT_FILE)} ` +
    `(${avertissementsTotal} avertissements, ${echecs} pages en échec).`
);
