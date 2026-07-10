import { isActiveGM } from "./permissions.mjs";

/**
 * Méga-Évolution (Les combats.md, "Les méga-évolutions") : Confiance et Dressage au maximum (9/9),
 * une seule par équipe et par combat, dure jusqu'à la fin du combat ou jusqu'au K.O. Aucune formule
 * de bonus de caractéristiques n'existe dans les sources — seulement des gabarits Pokédex séparés
 * déjà chiffrés par forme méga (ex. "Méga-Absol") : le bonus appliqué est donc le delta entre la
 * base de la forme normale et celle de la forme méga, calculé une fois à l'activation et rangé dans
 * system.combat.megaSauvegarde pour pouvoir revenir en arrière proprement.
 */
const PACK_POKEDEX = "hakai-kousen.pokedex";

function normaliserNomMega(nom) {
  return nom
    .replace(/^méga[\s-]+/i, "")
    .replace(/\s+[xy]$/i, "")
    .trim()
    .toLowerCase();
}

async function indexPokedex() {
  const pack = game.packs.get(PACK_POKEDEX);
  return pack.getIndex({ fields: ["system.types", "system.talent", "system.caracteristiques"] });
}

function equipeDuPokemon(pokemon) {
  if (!pokemon.system.dresseur) return [pokemon];
  return game.actors.filter(
    (a) => a.type === "pokemon" && a.system.dresseur === pokemon.system.dresseur && a.system.localisation === "equipe"
  );
}

export async function megaEvoluer(pokemon) {
  if (pokemon.system.combat.megaEvolue) {
    ui.notifications.warn(game.i18n.localize("HK.Mega.DejaMegaEvolue"));
    return null;
  }
  if (pokemon.system.obeissance.confiance < 9 || pokemon.system.obeissance.dressage < 9) {
    ui.notifications.warn(game.i18n.localize("HK.Mega.ConfianceInsuffisante"));
    return null;
  }
  if (equipeDuPokemon(pokemon).some((p) => p.uuid !== pokemon.uuid && p.system.combat.megaEvolue)) {
    ui.notifications.warn(game.i18n.localize("HK.Mega.UneParEquipe"));
    return null;
  }

  const index = await indexPokedex();
  const especeCourante = pokemon.system.espece.trim().toLowerCase();
  const candidats = index.filter((e) => /^méga[\s-]/i.test(e.name) && normaliserNomMega(e.name) === especeCourante);
  if (!candidats.length) {
    ui.notifications.warn(game.i18n.format("HK.Mega.AucuneFormeMega", { espece: pokemon.system.espece }));
    return null;
  }

  let gabaritMega = candidats[0];
  if (candidats.length > 1) {
    const options = candidats.map((c) => `<option value="${c._id}">${c.name}</option>`).join("");
    const resultat = await foundry.applications.api.DialogV2.input({
      window: { title: game.i18n.localize("HK.Mega.ChoixForme") },
      content: `<div class="form-group"><label>${game.i18n.localize("HK.Mega.Forme")}</label><select name="formeId">${options}</select></div>`
    });
    if (!resultat) return null;
    gabaritMega = candidats.find((c) => c._id === resultat.formeId) ?? gabaritMega;
  }

  const gabaritNormal = index.find((e) => e.name.toLowerCase() === especeCourante);
  const bonus = {};
  for (const cle of Object.keys(pokemon.system.caracteristiques)) {
    const baseNormal = gabaritNormal?.system?.caracteristiques?.[cle]?.base ?? pokemon.system.caracteristiques[cle].base;
    const baseMega = gabaritMega.system?.caracteristiques?.[cle]?.base ?? baseNormal;
    bonus[cle] = baseMega - baseNormal;
  }

  await pokemon.update({
    "system.combat.megaEvolue": true,
    "system.combat.megaSauvegarde.types": pokemon.system.types,
    "system.combat.megaSauvegarde.talent": pokemon.system.talent,
    "system.combat.megaSauvegarde.bonus": bonus,
    "system.types": gabaritMega.system.types,
    "system.talent": gabaritMega.system.talent
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: pokemon }),
    content: `<p>${game.i18n.format("HK.Mega.Reussie", { pokemon: pokemon.name, forme: gabaritMega.name })}</p>`
  });

  return true;
}

/** Fin de méga-évolution (fin de combat ou K.O.) : restaure types/talent d'origine, retire le bonus. */
export async function annulerMegaEvolution(pokemon) {
  if (!pokemon.system.combat.megaEvolue) return;

  await pokemon.update({
    "system.combat.megaEvolue": false,
    "system.types": pokemon.system.combat.megaSauvegarde.types,
    "system.talent": pokemon.system.combat.megaSauvegarde.talent,
    "system.combat.megaSauvegarde.bonus": Object.fromEntries(Object.keys(pokemon.system.caracteristiques).map((cle) => [cle, 0]))
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: pokemon }),
    content: `<p>${game.i18n.format("HK.Mega.Terminee", { pokemon: pokemon.name })}</p>`
  });
}

export function registerMegaEvolutionHooks() {
  Hooks.on("updateActor", async (actor, changed) => {
    if (!isActiveGM()) return;
    if (actor.type !== "pokemon" || !actor.system.combat.megaEvolue) return;
    if (foundry.utils.getProperty(changed, "system.vita.value") === undefined) return;
    if (actor.system.vita.value > 0) return;
    await annulerMegaEvolution(actor);
  });

  Hooks.on("deleteCombat", async (combat) => {
    if (!isActiveGM()) return;
    for (const combattant of combat.combatants) {
      const actor = combattant.actor;
      if (actor?.type === "pokemon" && actor.system.combat.megaEvolue) await annulerMegaEvolution(actor);
    }
  });
}
