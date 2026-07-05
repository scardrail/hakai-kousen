import { HK } from "../helpers/config.mjs";
import HKActorSheet from "./base-actor-sheet.mjs";

export default class PokemonSheet extends HKActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["hakai-kousen", "sheet", "actor", "pokemon"],
    position: { width: 720, height: 860 }
  };

  static PARTS = {
    corps: { template: "systems/hakai-kousen/templates/actor/pokemon-sheet.hbs" }
  };

  async _prepareContext() {
    const items = this.actor.items;
    const dresseur = this.actor.system.dresseur ? await fromUuid(this.actor.system.dresseur) : null;

    const caracteristiquesList = Object.entries(HK.caracteristiques).map(([key, label]) => ({
      key,
      label,
      ...this.actor.system.caracteristiques[key]
    }));

    return {
      actor: this.actor,
      system: this.actor.system,
      config: HK,
      caracteristiquesList,
      attaques: items.filter((i) => i.type === "attaque"),
      talents: items.filter((i) => i.type === "talent"),
      competences: items.filter((i) => i.type === "competence"),
      objets: items.filter((i) => i.type === "objet"),
      dresseur
    };
  }
}
