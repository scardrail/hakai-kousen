import { isActiveGM } from "../helpers/permissions.mjs";

/**
 * Dynamax/Gigamax (Les combats.md, "Le Dynamax/Gigamax") : dure 3 tours puis s'annule tout seul.
 * Seul le coefficient de VITA max par niveau est chiffré dans les sources (module/data-models/
 * actor-pokemon.mjs applique le coefficient à chaque préparation de données) ; les autres
 * Caractéristiques et la puissance des capacités Dynamax/Gigamax ("Xmax"/"Gardomax"/G-Max) n'ont
 * "aucun calcul retrouvé" dans le document source — pas automatisées ici, laissées au MJ.
 */
const DUREE_TOURS = 3;

export async function dynamaxer(pokemon, niveau) {
  if (pokemon.system.combat.dynamax.actif) {
    ui.notifications.warn(game.i18n.localize("HK.Dynamax.DejaActif"));
    return null;
  }

  await pokemon.update({
    "system.combat.dynamax.actif": true,
    "system.combat.dynamax.niveau": Math.min(10, Math.max(0, niveau)),
    "system.combat.dynamax.toursRestants": DUREE_TOURS
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: pokemon }),
    content: `<p>${game.i18n.format("HK.Dynamax.Reussi", { pokemon: pokemon.name, tours: DUREE_TOURS })}</p>`
  });

  return true;
}

export async function annulerDynamax(pokemon) {
  if (!pokemon.system.combat.dynamax.actif) return;

  await pokemon.update({
    "system.combat.dynamax.actif": false,
    "system.combat.dynamax.niveau": 0,
    "system.combat.dynamax.toursRestants": 0
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: pokemon }),
    content: `<p>${game.i18n.format("HK.Dynamax.Termine", { pokemon: pokemon.name })}</p>`
  });
}

export function registerDynamaxHooks() {
  Hooks.on("updateCombat", async (combat, changed) => {
    if (!isActiveGM()) return;
    if (!("round" in changed)) return;

    for (const combattant of combat.combatants) {
      const actor = combattant.actor;
      if (actor?.type !== "pokemon" || !actor.system.combat.dynamax.actif) continue;

      const restants = actor.system.combat.dynamax.toursRestants - 1;
      if (restants <= 0) await annulerDynamax(actor);
      else await actor.update({ "system.combat.dynamax.toursRestants": restants });
    }
  });

  Hooks.on("deleteCombat", async (combat) => {
    if (!isActiveGM()) return;
    for (const combattant of combat.combatants) {
      const actor = combattant.actor;
      if (actor?.type === "pokemon" && actor.system.combat.dynamax.actif) await annulerDynamax(actor);
    }
  });
}
