/**
 * La "Table Unique" (Les combats.md) : donne le seuil à atteindre au d10 pour qu'une attaque
 * touche, en croisant la Marge (Caractéristique attaquant - Caractéristique défenseur) et le
 * Handicap (précision de la capacité, éventuellement modifiée).
 *
 * Retranscrite intégralement depuis la table source (30 lignes de Marge -10 à 19, 18 colonnes
 * de précision de 100% à 15% par pas de 5%). Validée contre les deux exemples chiffrés du texte :
 *  - Salamèche FOR 9 vs Rattata END 4 → Marge 5, précision 100% → seuil 4.
 *  - Roucool FOR 5 vs Sabelette END 9 → Marge -4, précision 100% → seuil 7.
 */

const PRECISIONS = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15];
const MARGE_MIN = -10;
const MARGE_MAX = 19;

// Index 0 => Marge -10 ... Index 29 => Marge 19. Chaque ligne suit l'ordre de PRECISIONS.
const TABLE = [
  [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], // -10
  [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], // -9
  [9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], // -8
  [9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], // -7
  [8, 8, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], // -6
  [8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10], // -5
  [7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10], // -4
  [7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10], // -3
  [6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10], // -2
  [6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10], // -1
  [6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9], // 0
  [6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9], // 1
  [5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8], // 2
  [5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8], // 3
  [4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7], // 4
  [4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 7, 7], // 5
  [3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6], // 6
  [3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6], // 7
  [2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6], // 8
  [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6], // 9
  [1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5], // 10
  [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5], // 11
  [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4], // 12
  [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4], // 13
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3], // 14
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3], // 15
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2], // 16
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2], // 17
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 18
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] // 19
];

if (TABLE.length !== MARGE_MAX - MARGE_MIN + 1 || TABLE.some((row) => row.length !== PRECISIONS.length)) {
  throw new Error("HakaiKousen | Table Unique mal formée : vérifier la transcription des données.");
}

/**
 * Résout le seuil à atteindre au d10 pour toucher, selon la Table Unique.
 * @param {number} marge Caractéristique offensive de l'attaquant - caractéristique défensive de la cible.
 * @param {number} precision Précision de la capacité en % (1-100), déjà modifiée par les handicaps éventuels.
 * @returns {number} Seuil (1-10) à atteindre ou dépasser au d10.
 */
export function getSeuilTableUnique(marge, precision) {
  const margeIndex = Math.max(MARGE_MIN, Math.min(MARGE_MAX, Math.round(marge))) - MARGE_MIN;
  const precisionClamped = Math.max(PRECISIONS[PRECISIONS.length - 1], Math.min(PRECISIONS[0], precision));
  let colIndex = PRECISIONS.findIndex((p) => p <= precisionClamped);
  if (colIndex === -1) colIndex = PRECISIONS.length - 1;
  return TABLE[margeIndex][colIndex];
}

export const TABLE_UNIQUE_PRECISIONS = PRECISIONS;
