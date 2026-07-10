/**
 * Lit Docs_source/Les Equipements.md : une simple liste de noms d'armes/armures, sans aucun
 * chiffre (cf. le commentaire de module/data-models/items/arme.mjs : "Les règles source ne donnent
 * pas de chiffres de dégâts"). On se contente donc de classer chaque arme Mêlée/Distance par
 * heuristique de nom ; degats/portee restent vides (à compléter à la main si besoin). Les 2
 * "armures" du document (Gilet par balles, Veste en Kevlar) n'ont pas leur place dans le type Arme
 * (pas de protection/armure modélisée) : elles sont écrites à part, à ajouter manuellement aux
 * Objets si besoin (catégorie "equipement").
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const SRC_FILE = path.join(ROOT, "Docs_source", "Les Equipements.md");
const OUT_FILE = path.join(ROOT, "tools", "data", "armes-full.json");

const DISTANCE = /^(couteaux? de lanc|arc|shuriken|pistolet|fusil|lance-roquette)/i;
const NOTE_SOURCE = "<p><em>Aucune donnée chiffrée dans les règles source (Les Equipements.md) : dégâts/portée à compléter manuellement.</em></p>";

const source = fs.readFileSync(SRC_FILE, "utf8");
const lignes = source.split(/\r?\n/).map((l) => l.trim());

let section = "";
const armes = [];
const armures = [];

for (const ligne of lignes) {
  if (!ligne) continue;
  if (/^les armes\s*:?$/i.test(ligne)) {
    section = "armes";
    continue;
  }
  if (/^les armures\s*:?$/i.test(ligne)) {
    section = "armures";
    continue;
  }
  if (/^les equipements\s*:?$/i.test(ligne)) continue;

  if (section === "armes") {
    armes.push({
      name: ligne,
      system: {
        categorie: DISTANCE.test(ligne) ? "distance" : "melee",
        degats: "",
        portee: "",
        notes: NOTE_SOURCE
      }
    });
  } else if (section === "armures") {
    armures.push(ligne);
  }
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(armes, null, 2));

console.log(`Hakaï Kōsen | ${armes.length} armes -> ${path.relative(ROOT, OUT_FILE)}.`);
if (armures.length) {
  console.log(
    `  ${armures.length} "armures" trouvées (${armures.join(", ")}) : pas de type Item dédié, ignorées ` +
      `(à ajouter manuellement aux Objets si besoin).`
  );
}
