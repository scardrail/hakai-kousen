/**
 * Registre des statuts (Changement de statut.md, Les combats.md) et leur résolution :
 *  - dégâts passifs de fin de tour (brûlure, poison, poison grave, piège) via un hook sur le
 *    combat plutôt qu'un branchement dupliqué par statut,
 *  - restrictions d'action en début de tour (sommeil, gel, paralysie, attraction, peur, confusion),
 *    vérifiées explicitement par le moteur d'attaque avant de résoudre un jet.
 *
 * Sommeil et confusion utilisent la même mécanique de seuil décroissant (6, 5, 4, puis 3) décrite
 * dans Les combats.md ; la version de Changement de statut.md ("3 ou plus" pour la confusion, "20%"
 * pour le gel) est plus imprécise et n'est pas suivie ici au profit des valeurs chiffrées explicites
 * (gel : 8, 9 ou 10 sur 1D10, soit 30%, et non "20%").
 */

import { isActiveGM } from "../helpers/permissions.mjs";
import { planchMort } from "./combat-officiel.mjs";

const MODULE_ID = "hakai-kousen";

export const STATUTS = {
  brulure: { label: "HK.Statut.Brulure", icon: "icons/magic/fire/flame-burning-campfire-blue.webp", degatsFractionVita: 1 / 16 },
  poison: { label: "HK.Statut.Poison", icon: "icons/svg/poison.svg", degatsFractionVita: 1 / 8 },
  poisonGrave: { label: "HK.Statut.PoisonGrave", icon: "icons/svg/poison.svg", progressif: true },
  paralysie: { label: "HK.Statut.Paralysie", icon: "icons/magic/lightning/bolt-strike-blue.webp", seuilEchecD10: 3 },
  sommeil: { label: "HK.Statut.Sommeil", icon: "icons/magic/water/pseudopod-swirl-blue.webp", empecheAction: "seuilDecroissant" },
  gel: { label: "HK.Statut.Gel", icon: "icons/magic/water/orb-ice-web.webp", empecheAction: "gel" },
  confusion: { label: "HK.Statut.Confusion", icon: "icons/magic/air/wind-tornado-wall-blue.webp", empecheAction: "seuilDecroissant" },
  attraction: { label: "HK.Statut.Attraction", icon: "icons/magic/life/heart-cross-strong-flame-pink.webp", seuilEchecD10: 5 },
  peur: { label: "HK.Statut.Peur", icon: "icons/magic/control/fear-fright-white.webp", empecheAction: "unique" },
  piege: { label: "HK.Statut.Piege", icon: "icons/magic/control/debuff-chains-red.webp", degatsFractionVita: 1 / 8 }
};

const CHANGEMENTS = {
  brulure: [{ key: "system.caracteristiques.for.total", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "0.5" }],
  paralysie: [{ key: "system.caracteristiques.dex.total", mode: CONST.ACTIVE_EFFECT_MODES.MULTIPLY, value: "0.5" }]
};

export function aStatut(actor, cle) {
  return actor.effects.some((e) => e.getFlag(MODULE_ID, "statut") === cle);
}

/** Applique un statut (ignoré si déjà présent : pas de cumul du même statut). */
export async function appliquerStatut(actor, cle) {
  const def = STATUTS[cle];
  if (!def || aStatut(actor, cle)) return null;

  return actor.createEmbeddedDocuments("ActiveEffect", [
    {
      name: game.i18n.localize(def.label),
      icon: def.icon,
      origin: actor.uuid,
      flags: { [MODULE_ID]: { statut: cle, stacks: 1, seuil: 6 } },
      changes: CHANGEMENTS[cle] ?? []
    }
  ]);
}

export async function retirerStatut(actor, cle) {
  const effet = actor.effects.find((e) => e.getFlag(MODULE_ID, "statut") === cle);
  if (effet) await effet.delete();
}

/**
 * Applique les dégâts passifs de fin de tour pour un acteur (brûlure/poison/poison grave/piège).
 * À appeler quand le tour de cet acteur se termine.
 */
export async function resoudreDegatsFinDeTour(actor) {
  if (!actor) return;

  for (const effet of Array.from(actor.effects)) {
    const cle = effet.getFlag(MODULE_ID, "statut");
    const def = STATUTS[cle];
    if (!def) continue;

    let fraction = def.degatsFractionVita ?? 0;
    if (def.progressif) {
      const stacks = effet.getFlag(MODULE_ID, "stacks") ?? 1;
      fraction = stacks / 16;
      await effet.setFlag(MODULE_ID, "stacks", stacks + 1);
    }
    if (!fraction) continue;

    const degats = Math.round(actor.system.vita.max * fraction);
    await actor.update({ "system.vita.value": Math.max(actor.system.vita.value - degats, planchMort(game.combat)) });
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<p>${actor.name} subit ${degats} dégâts (${game.i18n.localize(def.label)}).</p>`
    });
  }

  // Les combats.md, "La mort d'un PJ ou d'un Pokémon" : à partir de -1 PV, saignement de 1 PV par
  // tour jusqu'à -10 (mort) en combat non officiel, sauf soin (jamais sous 0 en combat officiel,
  // cf. combat-officiel.mjs). Le KO/la mort eux-mêmes sont détectés par combat/ko.mjs.
  const plancher = planchMort(game.combat);
  if (actor.system.vita.value < 0 && actor.system.vita.value > plancher) {
    await actor.update({ "system.vita.value": actor.system.vita.value - 1 });
  }
}

/**
 * Vérifie, avant un jet d'attaque, si l'acteur peut agir ce tour-ci (sommeil, gel, paralysie,
 * attraction, peur, confusion). Gère aussi les compteurs/dégâts qui en découlent.
 * @returns {Promise<{peutAgir: boolean, motif: string|null}>}
 */
export async function verifierPeutAgir(actor) {
  for (const effet of Array.from(actor.effects)) {
    const cle = effet.getFlag(MODULE_ID, "statut");
    const def = STATUTS[cle];
    if (!def?.empecheAction && !def?.seuilEchecD10) continue;

    if (cle === "peur") {
      await effet.delete();
      return { peutAgir: false, motif: "HK.Statut.Peur" };
    }

    if (def.seuilEchecD10) {
      const roll = await new Roll("1d10").evaluate();
      if (roll.total <= def.seuilEchecD10) return { peutAgir: false, motif: def.label };
      continue;
    }

    if (def.empecheAction === "gel") {
      const roll = await new Roll("1d10").evaluate();
      if (roll.total >= 8) {
        await effet.delete();
        continue; // dégelé, peut agir normalement ce tour
      }
      return { peutAgir: false, motif: def.label };
    }

    if (def.empecheAction === "seuilDecroissant") {
      const seuil = effet.getFlag(MODULE_ID, "seuil") ?? 6;
      const roll = await new Roll("1d10").evaluate();
      if (roll.total >= seuil) {
        await effet.delete();
        continue; // réveillé / confusion dissipée, peut agir normalement ce tour
      }
      await effet.setFlag(MODULE_ID, "seuil", Math.max(3, seuil - 1));

      if (cle === "confusion") {
        await actor.update({ "system.vita.value": Math.max(actor.system.vita.value - 4, planchMort(game.combat)) });
        return { peutAgir: false, motif: "HK.Statut.Confusion" };
      }
      return { peutAgir: false, motif: def.label };
    }
  }

  return { peutAgir: true, motif: null };
}

/** Hook de combat : applique les dégâts de fin de tour au combattant qui vient de finir le sien. */
export function registerCombatHooks() {
  Hooks.on("updateCombat", async (combat, changed) => {
    if (!isActiveGM()) return;
    if (!("turn" in changed) && !("round" in changed)) return;
    const precedent = combat.previous;
    const combattant = precedent?.combatantId ? combat.combatants.get(precedent.combatantId) : null;
    if (combattant?.actor) await resoudreDegatsFinDeTour(combattant.actor);
  });
}
