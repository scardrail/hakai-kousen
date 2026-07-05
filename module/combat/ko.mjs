import { isActiveGM } from "../helpers/permissions.mjs";

const MODULE_ID = "hakai-kousen";

/**
 * Détection KO/mort (Les combats.md, "La mort d'un PJ ou d'un Pokémon") : générique sur
 * `system.vita.value` plutôt que branchée sur chaque source de dégâts (attaque, statut,
 * saignement, météo...), pour n'avoir qu'un seul endroit qui décide "K.O." ou "mort". L'état déjà
 * connu du Combatant (`isDefeated`, flag "mort") sert de marqueur d'idempotence : pas besoin de
 * comparer à la valeur précédente de vita.
 */
export function registerKoHooks() {
  Hooks.on("updateActor", async (actor, changed) => {
    if (!isActiveGM()) return;
    if (foundry.utils.getProperty(changed, "system.vita.value") === undefined) return;

    const combattants = game.combats.contents.flatMap((combat) =>
      combat.combatants.filter((combattant) => combattant.actor?.uuid === actor.uuid)
    );
    if (!combattants.length) return;

    const vita = actor.system.vita.value;

    for (const combattant of combattants) {
      if (vita <= 0 && !combattant.isDefeated) {
        await combattant.update({ defeated: true });
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `<p>${game.i18n.format("HK.Combat.KO", { nom: actor.name })}</p>`
        });
      } else if (vita > 0 && combattant.isDefeated) {
        await combattant.update({ defeated: false });
      }

      if (vita <= -10 && !combattant.getFlag(MODULE_ID, "mort")) {
        await combattant.setFlag(MODULE_ID, "mort", true);
        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `<p>${game.i18n.format("HK.Combat.Mort", { nom: actor.name })}</p>`
        });
      } else if (vita > -10 && combattant.getFlag(MODULE_ID, "mort")) {
        await combattant.unsetFlag(MODULE_ID, "mort");
      }
    }
  });
}
