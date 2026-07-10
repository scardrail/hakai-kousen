/**
 * Jet d'Obéissance (Système de jeu.md, Créer un Pokémon.md) : un Pokémon avec au moins 8 en
 * Obéissance (Confiance + Dressage) obéit toujours sans jet. En dessous, un jet 1D8 roll-under est
 * requis à chaque ordre ; en cas d'échec, le Pokémon agit quand même mais avec une attaque tirée
 * au hasard parmi celles qu'il connaît plutôt que celle demandée (exemple chiffré d'Onix : 6 en
 * Obéissance, D8, 1-6 obéit sinon attaque au hasard).
 */
export async function verifierObeissance(pokemon) {
  const seuil = pokemon.system.obeissance.total;
  if (seuil >= 8) return { obeit: true, jet: null, seuil };

  const jet = await new Roll("1d8").evaluate();
  const obeit = jet.total <= seuil;
  return { obeit, jet, seuil };
}
