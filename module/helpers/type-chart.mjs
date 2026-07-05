/**
 * Table des efficacités de type (18 types, ère Fée incluse), utilisée pour calculer les
 * sensibilités des Pokémon et le multiplicateur de dégâts d'une attaque.
 * Seules les exceptions à x1 sont listées : TYPE_CHART[attaque][defense] = multiplicateur.
 */
export const TYPE_CHART = {
  normal: { roche: 0.5, spectre: 0, acier: 0.5 },
  feu: { feu: 0.5, eau: 0.5, plante: 2, glace: 2, insecte: 2, roche: 0.5, dragon: 0.5, acier: 2 },
  eau: { feu: 2, eau: 0.5, plante: 0.5, sol: 2, roche: 2, dragon: 0.5 },
  electrik: { eau: 2, electrik: 0.5, plante: 0.5, sol: 0, vol: 2, dragon: 0.5 },
  plante: { feu: 0.5, eau: 2, plante: 0.5, poison: 0.5, sol: 2, vol: 0.5, insecte: 0.5, roche: 2, dragon: 0.5, acier: 0.5 },
  glace: { feu: 0.5, eau: 0.5, plante: 2, glace: 0.5, sol: 2, vol: 2, dragon: 2, acier: 0.5 },
  combat: { normal: 2, glace: 2, poison: 0.5, vol: 0.5, psy: 0.5, insecte: 0.5, roche: 2, spectre: 0, tenebres: 2, acier: 2, fee: 0.5 },
  poison: { plante: 2, poison: 0.5, sol: 0.5, roche: 0.5, spectre: 0.5, acier: 0, fee: 2 },
  sol: { feu: 2, electrik: 2, plante: 0.5, poison: 2, vol: 0, insecte: 0.5, roche: 2, acier: 2 },
  vol: { electrik: 0.5, plante: 2, combat: 2, insecte: 2, roche: 0.5, acier: 0.5 },
  psy: { combat: 2, poison: 2, psy: 0.5, tenebres: 0, acier: 0.5 },
  insecte: { feu: 0.5, plante: 2, combat: 0.5, poison: 0.5, vol: 0.5, psy: 2, spectre: 0.5, tenebres: 2, acier: 0.5, fee: 0.5 },
  roche: { feu: 2, glace: 2, combat: 0.5, sol: 0.5, vol: 2, insecte: 2, acier: 0.5 },
  spectre: { normal: 0, psy: 2, spectre: 2, tenebres: 0.5 },
  dragon: { dragon: 2, acier: 0.5, fee: 0 },
  tenebres: { combat: 0.5, psy: 2, spectre: 2, tenebres: 0.5, fee: 0.5 },
  acier: { feu: 0.5, eau: 0.5, electrik: 0.5, glace: 2, roche: 2, acier: 0.5, fee: 2 },
  fee: { feu: 0.5, combat: 2, poison: 0.5, dragon: 2, tenebres: 2, acier: 0.5 }
};

/**
 * Calcule le multiplicateur de dégâts d'une attaque de type `typeAttaque` contre un Pokémon
 * ayant les types `typesDefense` (1 ou 2 types).
 * @param {string} typeAttaque
 * @param {string[]} typesDefense
 * @returns {number}
 */
export function getEfficacite(typeAttaque, typesDefense) {
  const table = TYPE_CHART[typeAttaque] ?? {};
  return typesDefense.reduce((mult, type) => mult * (table[type] ?? 1), 1);
}

/**
 * Calcule les sensibilités complètes d'une combinaison de types face aux 18 types d'attaque.
 * @param {string[]} typesDefense
 * @returns {Record<string, number>}
 */
export function getSensibilites(typesDefense) {
  const sensibilites = {};
  for (const typeAttaque of Object.keys(TYPE_CHART)) {
    sensibilites[typeAttaque] = getEfficacite(typeAttaque, typesDefense);
  }
  return sensibilites;
}
