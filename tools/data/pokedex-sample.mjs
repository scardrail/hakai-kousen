const NOTE_PLACEHOLDER =
  "<p><em>Statistiques d'exemple pour la Phase 1 du système. Seules les valeurs explicitement " +
  "données dans Docs_source sont fidèles (voir le détail par Caractéristique) ; le reste est un " +
  "placeholder en attendant l'import complet du Pokédex officiel (hakaikousen.fr).</em></p>";

function car(base = 3, iv = 0, ev = 0) {
  return { base, iv, ev };
}

/**
 * Échantillon de Pokémon (starters + rencontres citées dans les exemples des règles), pour
 * tester le système de bout en bout sans attendre le scraping complet du Dex (Phase 2).
 * Les valeurs marquées "SOURCÉ" viennent de Docs_source ; les autres sont des placeholders.
 */
export const POKEDEX_SAMPLE = [
  {
    name: "Bulbizarre",
    system: {
      espece: "Bulbizarre",
      types: ["plante", "poison"],
      genre: "male",
      rarete: "starter",
      caracteristiques: { for: car(), end: car(), con: car(), vol: car(), dex: car() },
      vita: { base: 20, iv: 0, ev: 0, value: 20 },
      energie: { value: 50, max: 50 },
      nature: "hardi",
      talent: "Engrais",
      obeissance: { confiance: 4, dressage: 4 },
      xp: 50,
      niveau: 5,
      historique: NOTE_PLACEHOLDER
    },
    items: []
  },
  {
    name: "Salamèche",
    system: {
      espece: "Salamèche",
      types: ["feu"],
      genre: "male",
      rarete: "starter",
      // FOR totale 9 (base 6 + 3 IV) : exemple SOURCÉ de Créer un Pokémon.md.
      caracteristiques: { for: car(6, 3, 0), end: car(), con: car(), vol: car(), dex: car() },
      vita: { base: 20, iv: 0, ev: 0, value: 20 },
      energie: { value: 50, max: 50 },
      nature: "hardi",
      talent: "Brasier",
      obeissance: { confiance: 4, dressage: 4 },
      xp: 50,
      niveau: 5,
      historique: NOTE_PLACEHOLDER + "<p>FOR (base 6 + 3 IV = 9) confirmée par l'exemple de Créer un Pokémon.md.</p>"
    },
    items: ["Griffe", "Flammèche"]
  },
  {
    name: "Carapuce",
    system: {
      espece: "Carapuce",
      types: ["eau"],
      genre: "male",
      rarete: "starter",
      caracteristiques: { for: car(), end: car(), con: car(), vol: car(), dex: car() },
      vita: { base: 20, iv: 0, ev: 0, value: 20 },
      energie: { value: 50, max: 50 },
      nature: "hardi",
      talent: "Torrent",
      obeissance: { confiance: 4, dressage: 4 },
      xp: 50,
      niveau: 5,
      historique: NOTE_PLACEHOLDER + "<p>Attaques de départ non précisées dans Docs_source : à compléter.</p>"
    },
    items: []
  },
  {
    name: "Roucool",
    system: {
      espece: "Roucool",
      types: ["normal", "vol"],
      genre: "femelle",
      rarete: "commun",
      // FOR 5 et DEX 6 SOURCÉES (Les combats.md, exemples de Charge et d'initiative).
      caracteristiques: { for: car(5), end: car(), con: car(), vol: car(), dex: car(6) },
      vita: { base: 15, iv: 0, ev: 0, value: 15 },
      energie: { value: 50, max: 50 },
      nature: "hardi",
      talent: "",
      obeissance: { confiance: 0, dressage: 0 },
      xp: 0,
      niveau: 3,
      historique: NOTE_PLACEHOLDER + "<p>FOR (5) et DEX (6) confirmées par les exemples de combat.</p>"
    },
    items: ["Charge"]
  },
  {
    name: "Rattata",
    system: {
      espece: "Rattata",
      types: ["normal"],
      genre: "male",
      rarete: "commun",
      // END 4 SOURCÉE (Créer un Pokémon.md, exemple de Salamèche vs Rattata).
      caracteristiques: { for: car(), end: car(4), con: car(), vol: car(), dex: car() },
      vita: { base: 12, iv: 0, ev: 0, value: 12 },
      energie: { value: 50, max: 50 },
      nature: "hardi",
      talent: "",
      obeissance: { confiance: 0, dressage: 0 },
      xp: 0,
      niveau: 2,
      historique: NOTE_PLACEHOLDER + "<p>END (4) confirmée par l'exemple de Créer un Pokémon.md.</p>"
    },
    items: []
  },
  {
    name: "Sabelette",
    system: {
      espece: "Sabelette",
      types: ["sol"],
      genre: "femelle",
      rarete: "commun",
      // END 9 et DEX 4 SOURCÉES (Les combats.md, exemples de Charge et d'initiative).
      caracteristiques: { for: car(), end: car(9), con: car(), vol: car(), dex: car(4) },
      vita: { base: 16, iv: 0, ev: 0, value: 16 },
      energie: { value: 50, max: 50 },
      nature: "hardi",
      talent: "",
      obeissance: { confiance: 0, dressage: 0 },
      xp: 0,
      niveau: 3,
      historique: NOTE_PLACEHOLDER + "<p>END (9) et DEX (4) confirmées par les exemples de combat.</p>"
    },
    items: []
  },
  {
    name: "Abo",
    system: {
      espece: "Abo",
      types: ["poison"],
      genre: "male",
      rarete: "commun",
      // DEX 5 SOURCÉE (Les combats.md, exemple d'initiative) ; Grincement confirmé comme attaque connue.
      caracteristiques: { for: car(), end: car(), con: car(), vol: car(), dex: car(5) },
      vita: { base: 14, iv: 0, ev: 0, value: 14 },
      energie: { value: 50, max: 50 },
      nature: "hardi",
      talent: "",
      obeissance: { confiance: 0, dressage: 0 },
      xp: 0,
      niveau: 3,
      historique: NOTE_PLACEHOLDER + "<p>DEX (5) et l'attaque Grincement confirmées par les exemples de combat.</p>"
    },
    items: ["Grincement"]
  },
  {
    name: "Onix",
    system: {
      espece: "Onix",
      types: ["roche", "sol"],
      genre: "femelle",
      rarete: "peuCommun",
      caracteristiques: { for: car(), end: car(), con: car(), vol: car(), dex: car() },
      vita: { base: 18, iv: 0, ev: 0, value: 18 },
      energie: { value: 50, max: 50 },
      nature: "hardi",
      talent: "",
      // Confiance 4 / Dressage 2 SOURCÉS (Créer un Pokémon.md, exemple d'Élana et Ambre).
      obeissance: { confiance: 4, dressage: 2 },
      xp: 0,
      niveau: 8,
      historique:
        NOTE_PLACEHOLDER +
        "<p>Confiance (4) et Dressage (2) confirmés par l'exemple d'Obéissance de Créer un Pokémon.md (Élana et son Onix Ambre). Attaque Jet-Pierres citée dans Système de jeu.md.</p>"
    },
    items: ["Jet-Pierres"]
  }
];
