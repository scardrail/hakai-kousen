import { resolveAttaque } from "../dice/attack-roll.mjs";
import { getMeteoActuelle } from "../combat/meteo.mjs";
import { HK } from "../helpers/config.mjs";

/**
 * Détermine les cibles d'une attaque selon sa portée (Les combats.md, "La portée") : Personnel ne
 * cible que le lanceur, Zone amie/ennemie filtre les cibles Foundry sélectionnées par disposition
 * de token relative au lanceur. Cible/Rayon/Zone/Sonore utilisent tel quel l'ensemble ciblé par le
 * joueur (pas de gabarit géométrique au canevas).
 */
function resoudreCibles(attaquant, attaqueItem) {
  if (attaqueItem.system.portee === "personnel") return [attaquant];

  const cibles = [...game.user.targets].map((token) => token.actor).filter(Boolean);
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
      const cibles = resoudreCibles(this.actor, this);
      if (!cibles.length) {
        const cle = this.system.portee === "zoneAmie" || this.system.portee === "zoneEnnemie" ? "HK.Jet.CibleAucuneValide" : "HK.Jet.CibleManquante";
        ui.notifications.warn(game.i18n.format(cle, { portee: game.i18n.localize(HK.portees[this.system.portee]) }));
        return null;
      }
      const meteo = options.meteo ?? getMeteoActuelle(game.combat);
      return resolveAttaque({ attaquant: this.actor, cibles, attaqueItem: this, ...options, meteo });
    }

    if (this.type === "competence" || this.type === "connaissance") {
      return this.actor.rollCompetence(this.id, options);
    }

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<h3>${this.name}</h3>${this.system.description ?? this.system.effet ?? ""}`
    });
  }
}
