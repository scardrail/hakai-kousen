/**
 * Construit les compendiums Foundry (packs/) à partir des données de jeu (tools/data). Génère des
 * fichiers source JSON intermédiaires (packs-source/) puis les compile en LevelDB via
 * @foundryvtt/foundryvtt-cli.
 *
 * Source des données : tools/data/{pokedex,attaques,talents}-full.json, générés par les scripts de
 * tools/scraper/ (fetch.mjs puis parse-*.mjs) depuis hakaikousen.fr. Si ces fichiers n'existent pas
 * encore (dépôt fraîchement cloné, scraper jamais lancé), on retombe sur les petits échantillons de
 * la Phase 1 (tools/data/*-sample.mjs) pour que `npm run pack` reste utilisable immédiatement.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { POKEDEX_SAMPLE } from "./data/pokedex-sample.mjs";
import { ATTAQUES_SAMPLE } from "./data/attaques-sample.mjs";
import { TALENTS_SAMPLE } from "./data/talents-sample.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const PLACEHOLDER_IMG = "icons/svg/mystery-man.svg";

function chargerDonnees(nomFichier, echantillon) {
  const fichier = path.join(__dirname, "data", `${nomFichier}-full.json`);
  if (fs.existsSync(fichier)) return JSON.parse(fs.readFileSync(fichier, "utf8"));
  console.warn(`tools/data/${nomFichier}-full.json introuvable, utilisation de l'échantillon Phase 1.`);
  return echantillon;
}

function randomId(length = 16) {
  let id = "";
  for (let i = 0; i < length; i++) id += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  return id;
}

function safeFilename(name) {
  return name.replace(/[^a-zA-Z0-9]/g, "_");
}

function buildEmbeddedItem(type, def, actorId) {
  const id = randomId();
  return {
    _id: id,
    _key: `!actors.items!${actorId}.${id}`,
    name: def.name,
    type,
    img: "icons/svg/item-bag.svg",
    system: def.system,
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {}
  };
}

function buildActorDoc(entry, attaquesParNom) {
  const actorId = randomId();

  const attaqueItems = (entry.items ?? []).flatMap((nomAttaque) => {
    const def = attaquesParNom.get(nomAttaque);
    if (!def) {
      console.warn(`Attaque "${nomAttaque}" introuvable, ignorée pour ${entry.name}.`);
      return [];
    }
    return [buildEmbeddedItem("attaque", def, actorId)];
  });
  const talentItems = (entry.talents ?? []).map((def) => buildEmbeddedItem("talent", def, actorId));

  const img = entry.img ? `systems/hakai-kousen/assets/pokemon/${entry.img}` : PLACEHOLDER_IMG;

  return {
    _id: actorId,
    _key: `!actors!${actorId}`,
    name: entry.name,
    type: "pokemon",
    img,
    system: entry.system,
    items: [...attaqueItems, ...talentItems],
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    prototypeToken: {
      name: entry.name,
      texture: { src: img },
      actorLink: false,
      disposition: -1
    },
    flags: {}
  };
}

function buildStandaloneItemDoc(type, entry) {
  const id = randomId();
  return {
    _id: id,
    _key: `!items!${id}`,
    name: entry.name,
    type,
    img: "icons/svg/item-bag.svg",
    system: entry.system,
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {}
  };
}

function writeSourceFiles(dir, docs) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const doc of docs) {
    const filename = path.join(dir, `${safeFilename(doc.name)}_${doc._id}.json`);
    fs.writeFileSync(filename, JSON.stringify(doc, null, 2) + "\n");
  }
}

async function buildPack(name, docs) {
  const sourceDir = path.join(ROOT, "packs-source", name);
  const dest = path.join(ROOT, "packs", name);
  writeSourceFiles(sourceDir, docs);
  await compilePack(sourceDir, dest, { log: true });
  console.log(`Compendium "${name}" compilé (${docs.length} entrées) -> packs/${name}`);
}

const attaquesData = chargerDonnees("attaques", ATTAQUES_SAMPLE);
const talentsData = chargerDonnees("talents", TALENTS_SAMPLE);
const pokedexData = chargerDonnees("pokedex", POKEDEX_SAMPLE);

const attaquesParNom = new Map(attaquesData.map((def) => [def.name, def]));

const attaquesDocs = attaquesData.map((entry) => buildStandaloneItemDoc("attaque", entry));
const talentsDocs = talentsData.map((entry) => buildStandaloneItemDoc("talent", entry));
const pokedexDocs = pokedexData.map((entry) => buildActorDoc(entry, attaquesParNom));

await buildPack("attaques", attaquesDocs);
await buildPack("talents", talentsDocs);
await buildPack("pokedex", pokedexDocs);
