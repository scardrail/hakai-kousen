/**
 * Lit tools/scraper/cache/talent-list.html (page unique, toutes les données déjà en ligne) et
 * produit le pack maître des talents. `emplacement` n'a pas vraiment de sens pour une entrée
 * "maître" (un talent peut être premier/second/caché selon l'espèce) : on le laisse à "premier"
 * par défaut ici — chaque Pokémon du dex embarque sa propre copie de l'Item avec le bon
 * emplacement (cf. parse-pokedex.mjs).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CACHE_FILE = path.join(__dirname, "cache", "talent-list.html");
const OUT_FILE = path.join(ROOT, "tools", "data", "talents-full.json");

function escapeHtml(texte) {
  return texte.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const html = fs.readFileSync(CACHE_FILE, "utf8");
const $ = cheerio.load(html);

const resultats = [];
const vus = new Set();
let doublonCount = 0;

$("table.table tbody tr").each((_, tr) => {
  const tds = $(tr).find("td");
  const nom = $(tds[0]).text().trim();
  const effet = $(tds[1]).text().trim();
  if (!nom) return;

  if (vus.has(nom)) {
    doublonCount++;
    return;
  }
  vus.add(nom);

  resultats.push({
    name: nom,
    system: {
      emplacement: "premier",
      description: effet ? `<p>${escapeHtml(effet)}</p>` : ""
    }
  });
});

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(resultats, null, 2));
console.log(
  `Hakaï Kōsen | ${resultats.length} talents écrits dans ${path.relative(ROOT, OUT_FILE)} (${doublonCount} doublons ignorés).`
);
