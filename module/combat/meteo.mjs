import { HK } from "../helpers/config.mjs";
import { isActiveGM } from "../helpers/permissions.mjs";
import { planchMort } from "./combat-officiel.mjs";
import { texteBrut } from "../helpers/chat-parse.mjs";

const MODULE_ID = "hakai-kousen";

/** Météo active d'un combat (Les combats.md, "Le climat"), stockée en flag sur le Combat. */
export function getMeteoActuelle(combat) {
  return combat?.getFlag(MODULE_ID, "meteo") ?? "aucune";
}

export async function definirMeteo(combat, cle) {
  if (!HK.meteos[cle]) return false;

  await combat.setFlag(MODULE_ID, "meteo", cle);
  await ChatMessage.create({
    content: `<p>${game.i18n.format("HK.Combat.MeteoDefinie", { meteo: game.i18n.localize(HK.meteos[cle].label) })}</p>`
  });
  return true;
}

/**
 * Dégâts résiduels de météo (tempête de sable/grêle/ciel obscur/neige) : à la différence des
 * statuts (fin de tour de chaque acteur), la météo touche tous les Pokémon du combat en une fois à
 * chaque changement de round.
 */
async function resoudreMeteoDebutDeRound(combat) {
  const def = HK.meteos[getMeteoActuelle(combat)];
  if (!def?.degatsResiduelsSauf) return;

  for (const combattant of combat.combatants) {
    const actor = combattant.actor;
    if (!actor || actor.type !== "pokemon" || combattant.isDefeated) continue;
    if ((actor.system.types ?? []).some((type) => def.degatsResiduelsSauf.includes(type))) continue;

    const degats = Math.round(actor.system.vita.max * def.fraction);
    if (!degats) continue;

    await actor.update({ "system.vita.value": Math.max(actor.system.vita.value - degats, planchMort(combat)) });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<p>${actor.name} subit ${degats} dégâts (${game.i18n.localize(def.label)}).</p>`
    });
  }
}

export function registerMeteoHooks() {
  Hooks.on("chatMessage", (chatLog, message) => {
    const match = texteBrut(message).match(/^\/meteo(?:\s+(\S+))?\s*$/i);
    if (!match) return;

    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("HK.Combat.MeteoReserveMJ"));
      return false;
    }

    const combat = game.combat;
    if (!combat) {
      ui.notifications.warn(game.i18n.localize("HK.Combat.MeteoAucunCombat"));
      return false;
    }

    const cle = match[1];
    if (!cle) {
      const actuelle = getMeteoActuelle(combat);
      ui.notifications.info(game.i18n.format("HK.Combat.MeteoActuelle", { meteo: game.i18n.localize(HK.meteos[actuelle].label) }));
      return false;
    }

    if (!HK.meteos[cle]) {
      ui.notifications.warn(game.i18n.format("HK.Combat.MeteoInconnue", { valeurs: Object.keys(HK.meteos).join(", ") }));
      return false;
    }

    // Les combats.md, Soleil intense/Pluie battante/Courant aérien : "impossible de changer le
    // climat" tant que ce climat est actif (hors narratif MJ, sans déclencheur jouable ici).
    const actuelle = getMeteoActuelle(combat);
    if (HK.meteos[actuelle]?.verrouille && cle !== actuelle) {
      ui.notifications.warn(game.i18n.format("HK.Combat.MeteoVerrouillee", { meteo: game.i18n.localize(HK.meteos[actuelle].label) }));
      return false;
    }

    definirMeteo(combat, cle);
    return false;
  });

  Hooks.on("updateCombat", (combat, changed) => {
    if (!isActiveGM()) return;
    if (!("round" in changed)) return;
    resoudreMeteoDebutDeRound(combat);
  });
}
