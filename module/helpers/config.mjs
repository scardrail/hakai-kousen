/**
 * Constantes de règles Hakaï Kōsen, exposées sous CONFIG.HK.
 * Source: Docs_source (Créer un personnage.md, Créer un Pokémon.md, Système de jeu.md, Les combats.md,
 * Les Super Concours.md).
 */
export const HK = {};

HK.caracteristiques = {
  for: "HK.Car.For",
  end: "HK.Car.End",
  con: "HK.Car.Con",
  vol: "HK.Car.Vol",
  dex: "HK.Car.Dex"
};

HK.types = {
  normal: "HK.Type.Normal",
  feu: "HK.Type.Feu",
  eau: "HK.Type.Eau",
  plante: "HK.Type.Plante",
  electrik: "HK.Type.Electrik",
  glace: "HK.Type.Glace",
  combat: "HK.Type.Combat",
  poison: "HK.Type.Poison",
  sol: "HK.Type.Sol",
  vol: "HK.Type.Vol",
  psy: "HK.Type.Psy",
  insecte: "HK.Type.Insecte",
  roche: "HK.Type.Roche",
  spectre: "HK.Type.Spectre",
  dragon: "HK.Type.Dragon",
  tenebres: "HK.Type.Tenebres",
  acier: "HK.Type.Acier",
  fee: "HK.Type.Fee"
};

HK.categoriesAttaque = {
  physique: "HK.Categorie.Physique",
  speciale: "HK.Categorie.Speciale",
  autre: "HK.Categorie.Autre"
};

HK.portees = {
  cible: "HK.Portee.Cible",
  rayon: "HK.Portee.Rayon",
  zone: "HK.Portee.Zone",
  zoneAmie: "HK.Portee.ZoneAmie",
  zoneEnnemie: "HK.Portee.ZoneEnnemie",
  personnel: "HK.Portee.Personnel",
  sonore: "HK.Portee.Sonore"
};

HK.raretes = {
  commun: "HK.Rarete.Commun",
  peuCommun: "HK.Rarete.PeuCommun",
  starter: "HK.Rarete.Starter",
  rare: "HK.Rarete.Rare",
  tresRare: "HK.Rarete.TresRare",
  semiLegendaire: "HK.Rarete.SemiLegendaire",
  legendaire: "HK.Rarete.Legendaire"
};

HK.prixBaseRarete = {
  commun: 1000,
  peuCommun: 2500,
  rare: 10000
};

HK.genres = {
  male: "HK.Genre.Male",
  femelle: "HK.Genre.Femelle",
  asexue: "HK.Genre.Asexue"
};

HK.rareteCompetence = {
  commune: "HK.RareteCompetence.Commune",
  peuCommune: "HK.RareteCompetence.PeuCommune",
  rare: "HK.RareteCompetence.Rare"
};

/** Statuts (Changement de statut.md / Les combats.md), gérés comme Active Effects. */
HK.statuts = {
  brulure: "HK.Statut.Brulure",
  poison: "HK.Statut.Poison",
  poisonGrave: "HK.Statut.PoisonGrave",
  paralysie: "HK.Statut.Paralysie",
  sommeil: "HK.Statut.Sommeil",
  gel: "HK.Statut.Gel",
  confusion: "HK.Statut.Confusion",
  attraction: "HK.Statut.Attraction",
  peur: "HK.Statut.Peur",
  piege: "HK.Statut.Piege"
};

HK.categoriesObjet = {
  baie: "HK.CategorieObjet.Baie",
  ball: "HK.CategorieObjet.Ball",
  medicament: "HK.CategorieObjet.Medicament",
  tenu: "HK.CategorieObjet.Tenu",
  noigrume: "HK.CategorieObjet.Noigrume",
  equipement: "HK.CategorieObjet.Equipement",
  cristalZ: "HK.CategorieObjet.CristalZ",
  megaPierre: "HK.CategorieObjet.MegaPierre",
  poffin: "HK.CategorieObjet.Poffin",
  divers: "HK.CategorieObjet.Divers"
};

/**
 * Types de condition d'évolution reconnus par le parseur (tools/scraper/parse-pokedex.mjs) et par
 * le bouton "Évoluer" de la fiche Pokémon (module/helpers/evolution.mjs). Les conditions non
 * automatisables (échanges avec objet précis, formules à base de caractéristiques, "Spécial"...)
 * restent en texte libre dans l'historique plutôt que d'être devinées.
 */
HK.conditionsEvolution = {
  niveau: "HK.Evolution.Condition.Niveau",
  objet: "HK.Evolution.Condition.Objet",
  bonheur: "HK.Evolution.Condition.Bonheur",
  genre: "HK.Evolution.Condition.Genre",
  heure: "HK.Evolution.Condition.Heure",
  echange: "HK.Evolution.Condition.Echange",
  combat: "HK.Evolution.Condition.Combat"
};

/**
 * Goûts de Poffin (Créer un Pokémon.md, cf. https://www.pokepedia.fr/Nature) : chaque Nature
 * dicte le goût préféré / détesté du Pokémon, jamais saisi à la main (cf. HK.natures ci-dessous).
 */
HK.gouts = {
  acide: "HK.Gout.Acide",
  epice: "HK.Gout.Epice",
  amer: "HK.Gout.Amer",
  sec: "HK.Gout.Sec",
  sucre: "HK.Gout.Sucre"
};

/**
 * 25 Natures (Créer un Pokémon.md) : chaque nature augmente une caractéristique de +1
 * et en diminue une autre de -1 (ou aucune des deux si neutre), avec un goût de Poffin
 * préféré / détesté associé.
 */
HK.natures = {
  assure: { nom: "Assuré", hausse: "end", baisse: "for", gouteAime: "acide", gouteDeteste: "epice" },
  bizarre: { nom: "Bizarre", hausse: null, baisse: null, gouteAime: null, gouteDeteste: null },
  brave: { nom: "Brave", hausse: "for", baisse: "dex", gouteAime: "epice", gouteDeteste: "sucre" },
  calme: { nom: "Calme", hausse: "vol", baisse: "for", gouteAime: "amer", gouteDeteste: "epice" },
  discret: { nom: "Discret", hausse: "con", baisse: "dex", gouteAime: "sec", gouteDeteste: "sucre" },
  docile: { nom: "Docile", hausse: null, baisse: null, gouteAime: null, gouteDeteste: null },
  doux: { nom: "Doux", hausse: "con", baisse: "end", gouteAime: "sec", gouteDeteste: "acide" },
  foufou: { nom: "Foufou", hausse: "con", baisse: "vol", gouteAime: "sec", gouteDeteste: "amer" },
  gentil: { nom: "Gentil", hausse: "vol", baisse: "end", gouteAime: "amer", gouteDeteste: "acide" },
  hardi: { nom: "Hardi", hausse: null, baisse: null, gouteAime: null, gouteDeteste: null },
  jovial: { nom: "Jovial", hausse: "dex", baisse: "con", gouteAime: "sucre", gouteDeteste: "sec" },
  lache: { nom: "Lâche", hausse: "end", baisse: "vol", gouteAime: "acide", gouteDeteste: "amer" },
  malin: { nom: "Malin", hausse: "end", baisse: "con", gouteAime: "acide", gouteDeteste: "sec" },
  malpoli: { nom: "Malpoli", hausse: "vol", baisse: "dex", gouteAime: "amer", gouteDeteste: "sucre" },
  mauvais: { nom: "Mauvais", hausse: "for", baisse: "vol", gouteAime: "epice", gouteDeteste: "amer" },
  modeste: { nom: "Modeste", hausse: "con", baisse: "for", gouteAime: "sec", gouteDeteste: "epice" },
  naif: { nom: "Naïf", hausse: "dex", baisse: "vol", gouteAime: "sucre", gouteDeteste: "amer" },
  presse: { nom: "Pressé", hausse: "dex", baisse: "end", gouteAime: "sucre", gouteDeteste: "acide" },
  prudent: { nom: "Prudent", hausse: "vol", baisse: "con", gouteAime: "amer", gouteDeteste: "sec" },
  pudique: { nom: "Pudique", hausse: null, baisse: null, gouteAime: null, gouteDeteste: null },
  relax: { nom: "Relax", hausse: "end", baisse: "dex", gouteAime: "acide", gouteDeteste: "sucre" },
  rigide: { nom: "Rigide", hausse: "for", baisse: "con", gouteAime: "epice", gouteDeteste: "sec" },
  serieux: { nom: "Sérieux", hausse: null, baisse: null, gouteAime: null, gouteDeteste: null },
  solo: { nom: "Solo", hausse: "for", baisse: "end", gouteAime: "epice", gouteDeteste: "acide" },
  timide: { nom: "Timide", hausse: "dex", baisse: "for", gouteAime: "sucre", gouteDeteste: "epice" }
};

/** Météo de combat et leurs multiplicateurs de dégâts par type (Les combats.md). */
HK.meteos = {
  aucune: { label: "HK.Meteo.Aucune" },
  soleil: { label: "HK.Meteo.Soleil", multiplicateurs: { feu: 1.5, eau: 0.5 } },
  pluie: { label: "HK.Meteo.Pluie", multiplicateurs: { eau: 1.5, feu: 0.5 } },
  tempeteSable: { label: "HK.Meteo.TempeteSable", degatsResiduelsSauf: ["sol", "roche", "acier"], fraction: 1 / 16 },
  grele: { label: "HK.Meteo.Grele", degatsResiduelsSauf: ["glace"], fraction: 1 / 16 },
  brouillard: { label: "HK.Meteo.Brouillard", malusPrecision: 10 },
  cielObscur: { label: "HK.Meteo.CielObscur", degatsResiduelsSauf: ["tenebres"], fraction: 1 / 16 },
  soleilIntense: { label: "HK.Meteo.SoleilIntense", multiplicateurs: { feu: 1.5, eau: 0.5 }, eauInterdite: true, verrouille: true },
  pluieBattante: { label: "HK.Meteo.PluieBattante", multiplicateurs: { eau: 1.5, feu: 0.5 }, feuInterdite: true, verrouille: true },
  courantAerien: { label: "HK.Meteo.CourantAerien", verrouille: true },
  nuageux: { label: "HK.Meteo.Nuageux", multiplicateurs: { normal: 0.75 } },
  neige: { label: "HK.Meteo.Neige", degatsResiduelsSauf: ["glace"], fraction: 1 / 16 }
};

/**
 * Les Super Concours.md, "Les 5 catégories et la Condition d'un Pokémon" : les 5 catégories de
 * Condition d'un Pokémon (comme une Compétence, 0 à 5), stockées sur system.concours.condition
 * (actor-pokemon.mjs).
 */
HK.categoriesConcours = {
  beaute: "HK.Concours.Categorie.Beaute",
  grace: "HK.Concours.Categorie.Grace",
  sangfroid: "HK.Concours.Categorie.Sangfroid",
  intelligence: "HK.Concours.Categorie.Intelligence",
  robustesse: "HK.Concours.Categorie.Robustesse"
};

/**
 * Les Super Concours.md, "Associer une capacité à une catégorie" : table maison (n'a pas la
 * prétention de reproduire la répartition officielle des jeux) associant chaque Type de capacité à
 * l'une des 5 catégories de Concours.
 */
HK.typeCategorieConcours = {
  feu: "sangfroid",
  combat: "sangfroid",
  dragon: "sangfroid",
  tenebres: "sangfroid",
  eau: "beaute",
  glace: "beaute",
  poison: "beaute",
  roche: "beaute",
  normal: "grace",
  fee: "grace",
  vol: "grace",
  insecte: "grace",
  psy: "intelligence",
  spectre: "intelligence",
  acier: "intelligence",
  sol: "robustesse",
  plante: "robustesse",
  electrik: "robustesse"
};

/**
 * Les Super Concours.md, "Les Poffins et l'entraînement de la Condition" : chaque Saveur de Poffin
 * (HK.gouts, déjà utilisé pour les goûts aimés/détestés des Natures) nourrit une catégorie de
 * Concours précise (module/helpers/concours.mjs).
 */
HK.goutCategorieConcours = {
  epice: "sangfroid",
  sec: "intelligence",
  sucre: "grace",
  amer: "robustesse",
  acide: "beaute"
};

/**
 * Les Super Concours.md, "Organisation d'un Concours" : rangs officiels des Rubans de Concours
 * Super Contest (DPPt) — Normal/Méga/Ultra/Master — plus un 5e palier maison "Maître" (trophée de
 * fin de progression par catégorie, jamais un pré-requis de jeu). Difficulté du Juge croissante,
 * chaque rang demandant le Ruban du rang précédent dans la même catégorie
 * (module/helpers/concours.mjs, rangConcoursDisponible). Attention à la table : "Rang Méga" est un
 * palier de Concours, sans rapport avec la Méga-évolution (Les combats.md) — à distinguer à l'oral.
 */
HK.rangsConcours = {
  normal: { nom: "Normal", difficulte: 5, precedent: null },
  mega: { nom: "Méga", difficulte: 6, precedent: "normal" },
  ultra: { nom: "Ultra", difficulte: 8, precedent: "mega" },
  master: { nom: "Master", difficulte: 10, precedent: "ultra" },
  maitre: { nom: "Maître", difficulte: 10, precedent: "master" }
};
