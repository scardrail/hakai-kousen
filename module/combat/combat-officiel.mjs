import { texteBrut } from "../helpers/chat-parse.mjs";

const MODULE_ID = "hakai-kousen";

/**
 * Distinction combat officiel / non officiel (Les combats.md, "La mort d'un PJ ou d'un Pokémon") :
 * en combat officiel (arène, ligue...), un Pokémon ne peut pas mourir, ses PV ne descendent jamais
 * sous 0. Hors combat officiel (rencontre sauvage, bagarre...), le saignement jusqu'à -10 (mort)
 * s'applique normalement. Flag sur le Combat, à bascule GM via `/officiel` (comme `/meteo`).
 */
export function estCombatOfficiel(combat) {
  return !!combat?.getFlag(MODULE_ID, "officiel");
}

/** Plancher de VITA à appliquer à tout calcul de dégâts : 0 en combat officiel, -10 (mort) sinon. */
export function planchMort(combat) {
  return estCombatOfficiel(combat) ? 0 : -10;
}

export async function definirOfficiel(combat, valeur) {
  await combat.setFlag(MODULE_ID, "officiel", valeur);
  await ChatMessage.create({
    content: `<p>${game.i18n.format("HK.Combat.OfficielDefini", {
      etat: game.i18n.localize(valeur ? "HK.Combat.Officiel" : "HK.Combat.NonOfficiel")
    })}</p>`
  });
}

export function registerCombatOfficielHooks() {
  Hooks.on("chatMessage", (chatLog, message) => {
    const match = texteBrut(message).match(/^\/officiel(?:\s+(on|off))?\s*$/i);
    if (!match) return;

    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("HK.Combat.OfficielReserveMJ"));
      return false;
    }
    const combat = game.combat;
    if (!combat) {
      ui.notifications.warn(game.i18n.localize("HK.Combat.MeteoAucunCombat"));
      return false;
    }

    if (!match[1]) {
      ui.notifications.info(game.i18n.localize(estCombatOfficiel(combat) ? "HK.Combat.Officiel" : "HK.Combat.NonOfficiel"));
      return false;
    }

    definirOfficiel(combat, match[1].toLowerCase() === "on");
    return false;
  });
}
