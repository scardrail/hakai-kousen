/**
 * Téléchargeur avec cache pour hakaikousen.fr (le site de référence de la communauté Hakaï Kōsen
 * elle-même, cf. system.json). Ne fait aucun parsing de données de jeu : il se contente de
 * rapatrier les pages HTML et les portraits Pokémon en local pour que les scripts parse-*.mjs
 * puissent travailler hors-ligne et de façon reproductible.
 *
 * Usage : node tools/scraper/fetch.mjs [--force]
 *   --force  ignore le cache existant et retélécharge tout.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { safeFilename } from "./util.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const CACHE_DIR = path.join(__dirname, "cache");
const ASSETS_DIR = path.join(ROOT, "assets", "pokemon");

const BASE_URL = "https://hakaikousen.fr";
const USER_AGENT =
  "HakaiKousenFoundryBuilder/1.0 (outil communautaire de compilation de compendiums Foundry pour le systeme Hakai Kousen)";
const FORCE = process.argv.includes("--force");
const CONCURRENCY = 5;
const DELAY_MIN_MS = 300;
const DELAY_MAX_MS = 600;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter() {
  return DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function isCached(file) {
  return !FORCE && fs.existsSync(file) && fs.statSync(file).size > 0;
}

async function fetchWithRetry(url, { attempts = 3 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (res.status === 404) throw Object.assign(new Error(`404 Not Found : ${url}`), { terminal: true });
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after"));
        const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 2 ** attempt * 1000;
        if (attempt < attempts) {
          await sleep(delay);
          continue;
        }
        throw new Error(`HTTP ${res.status} après ${attempts} tentatives : ${url}`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} : ${url}`);
      return res;
    } catch (err) {
      if (err.terminal) throw err;
      lastErr = err;
      if (attempt < attempts) await sleep(2 ** attempt * 1000);
    }
  }
  throw lastErr;
}

async function fetchTextCached(url, cacheFile) {
  if (isCached(cacheFile)) return fs.readFileSync(cacheFile, "utf8");
  const res = await fetchWithRetry(url);
  const text = await res.text();
  ensureDir(path.dirname(cacheFile));
  fs.writeFileSync(cacheFile, text);
  await sleep(jitter());
  return text;
}

async function fetchBinaryCached(url, cacheFile) {
  if (isCached(cacheFile)) return;
  const res = await fetchWithRetry(url);
  const buf = Buffer.from(await res.arrayBuffer());
  ensureDir(path.dirname(cacheFile));
  fs.writeFileSync(cacheFile, buf);
  await sleep(jitter());
}

async function withConcurrency(items, limit, worker) {
  let index = 0;
  let ok = 0;
  let failed = 0;

  async function runNext() {
    while (index < items.length) {
      const i = index++;
      try {
        await worker(items[i]);
        ok++;
      } catch (err) {
        failed++;
        console.warn(`  échec "${items[i]}" : ${err.message}`);
      }
      if ((ok + failed) % 50 === 0) {
        console.log(`  ... ${ok + failed}/${items.length} traités (${failed} échecs)`);
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, runNext));
  return { ok, failed };
}

console.log("Hakaï Kōsen | Récupération de la liste des Pokémon...");
const pokemonListHtml = await fetchTextCached(`${BASE_URL}/dex/pokemon`, path.join(CACHE_DIR, "pokemon-list.html"));
const $list = cheerio.load(pokemonListHtml);
const slugs = new Set();
$list('a[href^="/dex/pokemon/"]').each((_, el) => {
  const href = $list(el).attr("href");
  const slug = decodeURIComponent(href.replace("/dex/pokemon/", ""));
  if (slug) slugs.add(slug);
});
console.log(`  ${slugs.size} Pokémon trouvés dans le dex.`);

console.log("Hakaï Kōsen | Récupération de la liste des attaques...");
await fetchTextCached(`${BASE_URL}/attaque`, path.join(CACHE_DIR, "attaque-list.html"));

console.log("Hakaï Kōsen | Récupération de la liste des talents...");
await fetchTextCached(`${BASE_URL}/talent`, path.join(CACHE_DIR, "talent-list.html"));

console.log(`Hakaï Kōsen | Récupération de ${slugs.size} fiches Pokémon (peut prendre plusieurs minutes)...`);
const { ok, failed } = await withConcurrency([...slugs], CONCURRENCY, async (slug) => {
  const cacheFile = path.join(CACHE_DIR, "pokemon", `${safeFilename(slug)}.html`);
  const html = await fetchTextCached(`${BASE_URL}/dex/pokemon/${encodeURIComponent(slug)}`, cacheFile);

  const $ = cheerio.load(html);
  const imgSrc = $("div.img img.card-container").first().attr("src");
  if (imgSrc) {
    const imgCacheFile = path.join(ASSETS_DIR, `${safeFilename(slug)}.png`);
    await fetchBinaryCached(`${BASE_URL}${imgSrc}`, imgCacheFile);
  }
});

console.log(`Hakaï Kōsen | Terminé : ${ok} fiches OK, ${failed} échecs.`);
if (failed > 0) process.exitCode = 1;
