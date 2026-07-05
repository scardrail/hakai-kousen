/**
 * Jet de Compétence/Connaissance (Système de jeu.md, chapitre "Les jets de Compétences") :
 * pool de d10 = score + (Caractéristique liée, choisie au cas par cas par le MJ pour un Dresseur),
 * difficulté par défaut 6, les 1 annulent un succès, les 10 doublent seulement si la
 * Spécialisation adéquate est active. Un Pokémon sans le score lance 1d10 difficulté 9.
 */
export async function rollCompetence(actor, item, { caracteristique = "", difficulte = 6, bonusDes = 0, specialisationActive = false } = {}) {
  const estPokemon = actor.type === "pokemon";
  let nbDes = item.system.score;
  let diff = difficulte;

  if (!estPokemon && caracteristique) {
    nbDes += actor.system.caracteristiques[caracteristique]?.total ?? 0;
  }

  if (estPokemon && item.system.score === 0) {
    nbDes = 1;
    diff = 9;
  }

  nbDes = Math.max(1, nbDes + bonusDes);

  const roll = await new Roll(`${nbDes}d10`).evaluate();
  const resultats = roll.dice[0]?.results.map((r) => r.result) ?? [roll.total];

  let succesBrut = 0;
  for (const valeur of resultats) {
    if (valeur === 1) succesBrut -= 1;
    else if (valeur >= diff) succesBrut += valeur === 10 && specialisationActive ? 2 : 1;
  }

  const succes = Math.max(0, succesBrut);
  const echecCritique = succesBrut < 0 && !specialisationActive;

  const content = await renderTemplate("systems/hakai-kousen/templates/chat/jet-competence.hbs", {
    actor,
    nomCompetence: item.name,
    resultats,
    difficulte: diff,
    succes,
    reussite: succes >= 1,
    echecCritique
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    rolls: [roll],
    sound: CONFIG.sounds.dice,
    flavor: game.i18n.format("HK.Jet.Competence", { competence: item.name }),
    content
  });

  return { roll, succes, echecCritique };
}
