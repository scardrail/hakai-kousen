import { resolveAttaque } from "../dice/attack-roll.mjs";
import { getMeteoActuelle } from "../combat/meteo.mjs";
import { HK } from "../helpers/config.mjs";
import { enseignerCt } from "../helpers/ct.mjs";
import { tenterCapture } from "../helpers/capture.mjs";
import { verifierObeissance } from "../helpers/obeissance.mjs";
import { estObjetDeSoin, utiliserObjetDeSoin } from "../helpers/soins.mjs";

/**
 * Les combats.md : un Dresseur ayant un Pokémon engagé dans le combat ne peut pas être visé par
 * une attaque, sauf exception du MJ (qui peut donc cibler librement).
 */
function estDresseurProtege(cible) {
  if (cible.type !== "dresseur" || game.user.isGM) return false;
  return !!game.combat?.combatants.some((c) => c.actor?.type === "pokemon" && c.actor.system.dresseur === cible.uuid && !c.isDefeated);
}

/**
 * Détermine les cibles d'une attaque selon sa portée (Les combats.md, "La portée") : Personnel ne
 * cible que le lanceur, Zone amie/ennemie filtre les cibles Foundry sélectionnées par disposition
 * de token relative au lanceur. Cible/Rayon/Zone/Sonore utilisent tel quel l'ensemble ciblé par le
 * joueur (pas de gabarit géométrique au canevas).
 */
function resoudreCibles(attaquant, attaqueItem) {
  if (attaqueItem.system.portee === "personnel") return [attaquant];

  const cibles = [...game.user.targets].map((token) => token.actor).filter((cible) => cible && !estDresseurProtege(cible));
  if (!cibles.length) return [];

  if (attaqueItem.system.portee !== "zoneAmie" && attaqueItem.system.portee !== "zoneEnnemie") return cibles;

  const tokenLanceur = attaquant.getActiveTokens()[0];
  if (!tokenLanceur) {
    console.warn(`Hakaï Kōsen | ${attaquant.name} n'a pas de token actif, filtrage de portée ignoré.`);
    return cibles;
  }

  const dispositionLanceur = tokenLanceur.document.disposition;
  return cibles.filter((cible) => {
    const tokenCible = cible.getActiveTokens()[0];
    if (!tokenCible) return true;
    const memeCamp = tokenCible.document.disposition === dispositionLanceur;
    return attaqueItem.system.portee === "zoneAmie" ? memeCamp : !memeCamp;
  });
}

export default class HKItem extends Item {
  /**
   * Point d'entrée générique "utiliser cet objet" depuis une fiche : déclenche le bon moteur
   * selon le type d'Item (attaque -> résolution de combat, compétence/connaissance -> jet de
   * compétence, le reste -> simple rappel de description en chat).
   */
  async utiliser(options = {}) {
    if (!this.actor) return null;

    if (this.type === "attaque") {
      let attaqueItem = this;

      if (this.actor.type === "pokemon") {
        const { obeit, jet, seuil } = await verifierObeissance(this.actor);
        if (jet) {
          await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            rolls: [jet],
            sound: CONFIG.sounds.dice,
            content: `<p>${game.i18n.format(obeit ? "HK.Obeissance.Reussie" : "HK.Obeissance.Echouee", { pokemon: this.actor.name, jet: jet.total, seuil })}</p>`
          });
        }
        if (!obeit) {
          const attaquesConnues = this.actor.items.filter((i) => i.type === "attaque");
          if (!attaquesConnues.length) return null;
          attaqueItem = attaquesConnues[Math.floor(Math.random() * attaquesConnues.length)];
        }
      }

      const meteo = options.meteo ?? getMeteoActuelle(game.combat);
      const meteoDef = HK.meteos[meteo];
      if ((meteoDef?.eauInterdite && attaqueItem.system.type === "eau") || (meteoDef?.feuInterdite && attaqueItem.system.type === "feu")) {
        ui.notifications.warn(game.i18n.format("HK.Combat.AttaqueInterditeMeteo", { attaque: attaqueItem.name, meteo: game.i18n.localize(meteoDef.label) }));
        return null;
      }

      const cibles = resoudreCibles(this.actor, attaqueItem);
      if (!cibles.length) {
        const cle = attaqueItem.system.portee === "zoneAmie" || attaqueItem.system.portee === "zoneEnnemie" ? "HK.Jet.CibleAucuneValide" : "HK.Jet.CibleManquante";
        ui.notifications.warn(game.i18n.format(cle, { portee: game.i18n.localize(HK.portees[attaqueItem.system.portee]) }));
        return null;
      }
      return resolveAttaque({ attaquant: this.actor, cibles, attaqueItem, ...options, meteo });
    }

    if (this.type === "competence" || this.type === "connaissance") {
      return this.actor.rollCompetence(this.id, options);
    }

    if (this.type === "ct") {
      return enseignerCt(this);
    }

    if (this.type === "objet" && this.system.categorie === "ball") {
      const cibles = [...game.user.targets].map((token) => token.actor).filter(Boolean);
      if (cibles.length !== 1) {
        ui.notifications.warn(game.i18n.localize("HK.Capture.CibleRequise"));
        return null;
      }
      return tenterCapture(this.actor, this, cibles[0]);
    }

    if (this.type === "objet" && estObjetDeSoin(this.name)) {
      return utiliserObjetDeSoin(this);
    }

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<h3>${this.name}</h3>${this.system.description ?? this.system.effet ?? ""}`
    });
  }
}
