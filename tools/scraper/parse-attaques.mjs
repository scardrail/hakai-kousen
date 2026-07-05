/**
 * Lit tools/scraper/cache/attaque-list.html (page unique, déjà toutes les attaques en ligne, pas
 * besoin des pages de détail individuelles) et en extrait le tableau "Système remanié"
 * (contenu-energie2), qui correspond à la Table Unique qu'on a implémentée (Les combats.md).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { mapType, mapCategorie, mapPortee, mapPrecision, extraireStatut, extraireModifStats } from "./mappings.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CACHE_FILE = path.join(__dirname, "cache", "attaque-list.html");
const OUT_FILE = path.join(ROOT, "tools", "data", "attaques-full.json");

function escapeHtml(texte) {
  return texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const html = fs.readFileSync(CACHE_FILE, "utf8");
const $ = cheerio.load(html);

const resultats = [];
const vus = new Set();
let repliCount = 0;
let doublonCount = 0;
let statutCount = 0;
let modifStatsCount = 0;

$("section.contenu-energie2 table.table tbody tr").each((_, tr) => {
  const tds = $(tr).find("td");
  const nom = $(tds[0]).text().trim();
  if (!nom) return;

  if (vus.has(nom)) {
    doublonCount++;
    return;
  }
  vus.add(nom);

  const type = mapType($(tds[1]).text().trim());
  const energie = Number($(tds[2]).text().trim()) || 0;
  const categorie = mapCategorie($(tds[3]).text().trim());
  const portee = mapPortee($(tds[4]).text().trim());
  const { precision, toujoursTouche } = mapPrecision($(tds[5]).text().trim());
  const puissance = Number($(tds[6]).text().trim()) || 0;
  const description = $(tds[7]).text().trim();

  if (type.repli || categorie.repli || portee.repli) repliCount++;

  const system = {
    type: type.valeur,
    categorie: categorie.valeur,
    portee: portee.valeur,
    energie,
    precision,
    toujoursTouche,
    degats: puissance > 0 ? puissance : null,
    effets: description ? `<p>${escapeHtml(description)}</p>` : ""
  };

  // Phase 5 : extraction best-effort de statut/modifStats depuis le texte libre (voir mappings.mjs
  // pour les limites assumées — seules les tournures les plus claires et sans ambiguïté sont
  // structurées, tout le reste reste uniquement dans `effets`).
  if (description) {
    const statut = extraireStatut(description);
    if (statut) {
      system.statut = statut;
      statutCount++;
    }
    const modifStats = extraireModifStats(description);
    if (modifStats.length) {
      system.modifStats = modifStats;
      modifStatsCount++;
    }
  }

  resultats.push({ name: nom, system });
});

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(resultats, null, 2));
console.log(
  `Hakaï Kōsen | ${resultats.length} attaques écrites dans ${path.relative(ROOT, OUT_FILE)} ` +
    `(${repliCount} avec repli de mapping, ${doublonCount} doublons ignorés, ` +
    `${statutCount} avec statut structuré, ${modifStatsCount} avec modifStats structuré).`
);
