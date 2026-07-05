import { HK } from "../helpers/config.mjs";
import { isActiveGM } from "../helpers/permissions.mjs";

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

    await actor.update({ "system.vita.value": Math.max(actor.system.vita.value - degats, -10) });
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<p>${actor.name} subit ${degats} dégâts (${game.i18n.localize(def.label)}).</p>`
    });
  }
}

/**
 * Le champ de tchat (ProseMirror) envoie du HTML au hook "chatMessage" (ex. "<p>/meteo pluie</p>"),
 * pas du texte brut : on en extrait le texte comme le fait le parseur de commandes de Foundry
 * lui-même (ChatLog.parse), sans quoi la regex de commande ne matche jamais.
 */
function texteBrut(message) {
  const template = document.createElement("template");
  template.innerHTML = message;
  template.content.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  return template.content.textContent.trim();
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

    definirMeteo(combat, cle);
    return false;
  });

  Hooks.on("updateCombat", (combat, changed) => {
    if (!isActiveGM()) return;
    if (!("round" in changed)) return;
    resoudreMeteoDebutDeRound(combat);
  });
}
