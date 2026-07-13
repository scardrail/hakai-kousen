import { HK } from "../helpers/config.mjs";

/**
 * Test d'Appel (Les Super Concours.md, Manche 3 "La Manche d'Appel") : D10 x Condition du Pokémon
 * dans la catégorie du Concours (garder le plus haut résultat), + bonus de Compétence Charisme du
 * Dresseur, comparé à la Difficulté du Juge. Reprend les seuils déjà utilisés en combat (Les
 * combats.md) : dépasser la Difficulté de 5 ou plus donne un Appel exceptionnel (points doublés),
 * faire 1 sur le dé gardé est un échec critique (la Jauge d'Enthousiasme retombe à 0, gérée côté
 * table plutôt qu'en données persistées — cf. Les Super Concours.md pour le détail de la Manche).
 */
export async function rollTestAppel(pokemon, dresseur, { categorie, difficulte = 5, bonusDes = 0, horsCategorie = false } = {}) {
  let nbDes = pokemon.system.concours.condition[categorie] ?? 0;
  if (horsCategorie) nbDes -= 2;
  nbDes = Math.max(1, nbDes + bonusDes);

  const roll = await new Roll(`${nbDes}d10`).evaluate();
  const resultats = roll.dice[0]?.results.map((r) => r.result) ?? [roll.total];
  const meilleur = Math.max(...resultats);

  const itemCharisme = dresseur?.items.find((i) => i.type === "competence" && i.name.trim().toLowerCase() === "charisme");
  const bonusCharisme = itemCharisme?.system.score ?? 0;

  const total = meilleur + bonusCharisme;
  const echecCritique = meilleur === 1;
  const reussite = !echecCritique && total >= difficulte;
  const exceptionnel = reussite && total >= difficulte + 5;
  const points = reussite ? (exceptionnel ? difficulte * 2 : difficulte) : 0;

  const content = await renderTemplate("systems/hakai-kousen/templates/chat/jet-appel.hbs", {
    pokemon,
    categorie: game.i18n.localize(HK.categoriesConcours[categorie]),
    resultats,
    meilleur,
    bonusCharisme,
    total,
    difficulte,
    reussite,
    exceptionnel,
    echecCritique,
    points
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: pokemon }),
    rolls: [roll],
    sound: CONFIG.sounds.dice,
    flavor: game.i18n.format("HK.Concours.Appel.Flavor", { pokemon: pokemon.name }),
    content
  });

  return { roll, total, reussite, exceptionnel, echecCritique, points };
}
