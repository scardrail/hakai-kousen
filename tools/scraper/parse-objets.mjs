/**
 * Lit Docs_source/Objets_liste.md (pas hakaikousen.fr : ce document communautaire local liste les
 * objets, CT et CS, sans équivalent sur le site) et produit tools/data/objets-full.json +
 * tools/data/ct-full.json.
 *
 * Le fichier mélange tableaux HTML bruts et tableaux markdown ("| a | b |") au fil des sections ;
 * plutôt que de découper proprement le markdown, on repère la position de chaque ligne de tableau
 * (HTML <tr> ou markdown "|...|") et on lui associe le dernier titre de section (# / ##) rencontré
 * avant elle. CT/CS ont leur propre type d'Item (numero/attaqueEnseignee/prix/usageUnique/effet),
 * distinct des Objets.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const SRC_FILE = path.join(ROOT, "Docs_source", "Objets_liste.md");
const OUT_OBJETS = path.join(ROOT, "tools", "data", "objets-full.json");
const OUT_CT = path.join(ROOT, "tools", "data", "ct-full.json");

const CATEGORIE_PAR_SECTION = {
  "baies de soin": "baie",
  "baies de résistance obtenable uniquement à l’achat dans un champ de baie spécialisé": "baie",
  "baies ingrédients": "baie",
  noigrume: "noigrume",
  "objets \"poké-x\"": "equipement",
  médicaments: "medicament",
  "herbes médicinales": "medicament",
  "objets de combat": "medicament",
  "objets d’entraînement": "medicament",
  "poké balls": "ball",
  "autres objets": "divers"
};
const SECTIONS_CT = new Set(["ct/cs", "cs"]);

function escapeHtml(texte) {
  return texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function nettoyerTexte(texte) {
  return texte
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extrairePrix(texte) {
  const match = texte.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

/**
 * Cas de base d'une Ball : la clause "sinon" si le texte en a une (balls conditionnelles du type
 * "+3 (si pêché) ; +0 sinon"), sinon le premier nombre signé rencontré (balls à bonus fixe comme
 * "+1", ou "-2 sinon" pour l'Ultra Ball où -2 EST le cas courant). Les autres clauses restent
 * consultables dans le texte de effet pour l'ajustement manuel du jet.
 */
function extraireBonusCaptureBase(texte) {
  if (!texte) return 0;
  const clauseSinon = texte.match(/([+-]\s*\d+)\s*sinon/i);
  if (clauseSinon) return Number(clauseSinon[1].replace(/\s+/g, ""));
  const premier = texte.match(/^([+-]\s*\d+)/);
  return premier ? Number(premier[1].replace(/\s+/g, "")) : 0;
}

const source = fs.readFileSync(SRC_FILE, "utf8");

// 1. Répertorie tous les titres de section (# ou ##) avec leur position dans le fichier.
const entetes = [];
const regexEntete = /^#{1,2}\s+(.+)$/gm;
let m;
while ((m = regexEntete.exec(source))) {
  entetes.push({ index: m.index, titre: nettoyerTexte(m[1]).toLowerCase() });
}

function sectionA(index) {
  let titre = "";
  for (const e of entetes) {
    if (e.index > index) break;
    titre = e.titre;
  }
  return titre;
}

// 2. Récupère toutes les lignes de tableau (HTML <tr> ou markdown "| ... |") avec leur position.
const lignes = [];
const regexTr = /<tr>[\s\S]*?<\/tr>/g;
while ((m = regexTr.exec(source))) {
  // cheerio (règles HTML5 de construction des tables) ignore un <tr> isolé hors d'un <table> :
  // il faut l'y réinsérer pour que les <td> survivent au parsing.
  const $ = cheerio.load(`<table><tbody>${m[0]}</tbody></table>`);
  const cellules = $("td, th")
    .map((_, el) => nettoyerTexte($(el).text()))
    .get();
  if (cellules.length) lignes.push({ index: m.index, cellules });
}

const regexMd = /^\|(.+)\|\s*$/gm;
while ((m = regexMd.exec(source))) {
  const brut = m[1];
  if (/^[\s|:-]+$/.test(brut)) continue; // ligne de séparation "---|---"
  const cellules = brut.split("|").map((c) => nettoyerTexte(c.replace(/<img[^>]*>|!\[[^\]]*\]\([^)]*\)/g, " ")));
  if (cellules.some((c) => c && !/^(icône|nom|effet|effets|description|prix|numéro|bonus capture)$/i.test(c))) {
    lignes.push({ index: m.index, cellules });
  }
}

lignes.sort((a, b) => a.index - b.index);

const objetsParNom = new Map();
const ctsParNumero = new Map();
let ignorees = 0;
let doublons = 0;

for (const { index, cellules } of lignes) {
  const titreSection = sectionA(index);
  if (!titreSection) continue;

  if (SECTIONS_CT.has(titreSection)) {
    // [Numéro, Nom, Effets, Prix]
    if (cellules.length < 4) continue;
    const [numero, nom, effet, prixTexte] = cellules;
    if (!/^C[ST]\d+$/i.test(numero) || !nom) continue;
    const cle = numero.toUpperCase();
    if (ctsParNumero.has(cle)) doublons++;
    ctsParNumero.set(cle, {
      name: nom,
      system: {
        numero: cle,
        attaqueEnseignee: nom,
        prix: extrairePrix(prixTexte),
        usageUnique: false,
        effet: effet ? `<p>${escapeHtml(effet)}</p>` : ""
      }
    });
    continue;
  }

  // Objets : [image_ou_vide, Nom, Description, Prix] (4 cellules) — l'image n'est jamais du texte
  // utile ici (cheerio ne récupère pas les attributs img), donc cellules[0] est vide ou un nom de
  // colonne parasite ; on ne s'en sert pas.
  if (cellules.length < 4) {
    ignorees++;
    continue;
  }
  const [, nom, description, prixTexte] = cellules;
  if (!nom || /^(nom|objet|médicament|herbe médicinale|noigrume|baie)$/i.test(nom)) continue;

  // Sections mappées explicitement (baie/noigrume/equipement/medicament/ball/divers) ; pour tout
  // le reste (Matériel et ses nombreuses sous-sections : Spécialités régionales, Objets Pokemon,
  // Objets Rares, objets à vendre...), on détecte les objets à tenir au texte, "divers" sinon.
  const categorie = CATEGORIE_PAR_SECTION[titreSection] ?? (/tenir|tenu(e)?\b/i.test(description) ? "tenu" : "divers");

  if (objetsParNom.has(nom)) doublons++;
  objetsParNom.set(nom, {
    name: nom,
    system: {
      categorie,
      prix: extrairePrix(prixTexte),
      quantite: 1,
      effet: description ? `<p>${escapeHtml(description)}</p>` : "",
      ...(categorie === "ball"
        ? {
            bonusCapture: extraireBonusCaptureBase(description),
            captureAutomatique: /capture.*tous les coups/i.test(description)
          }
        : {})
    }
  });
}

const objets = [...objetsParNom.values()];
const cts = [...ctsParNumero.values()];

fs.mkdirSync(path.dirname(OUT_OBJETS), { recursive: true });
fs.writeFileSync(OUT_OBJETS, JSON.stringify(objets, null, 2));
fs.writeFileSync(OUT_CT, JSON.stringify(cts, null, 2));

console.log(
  `Hakaï Kōsen | ${objets.length} objets -> ${path.relative(ROOT, OUT_OBJETS)}, ` +
    `${cts.length} CT/CS -> ${path.relative(ROOT, OUT_CT)} (${ignorees} lignes ignorées, ${doublons} doublons fusionnés).`
);
