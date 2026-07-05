import { HK } from "../helpers/config.mjs";
import HKActorSheet from "./base-actor-sheet.mjs";

export default class DresseurSheet extends HKActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["hakai-kousen", "sheet", "actor", "dresseur"],
    position: { width: 720, height: 820 }
  };

  static PARTS = {
    corps: { template: "systems/hakai-kousen/templates/actor/dresseur-sheet.hbs" }
  };

  async _prepareContext() {
    const items = this.actor.items;
    const equipe = [];
    for (const uuid of this.actor.system.equipe ?? []) {
      const pokemon = await fromUuid(uuid);
      if (pokemon) equipe.push(pokemon);
    }

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
      competences: items.filter((i) => i.type === "competence"),
      connaissances: items.filter((i) => i.type === "connaissance"),
      specialisations: items.filter((i) => i.type === "specialisation"),
      objets: items.filter((i) => i.type === "objet"),
      armes: items.filter((i) => i.type === "arme"),
      equipe
    };
  }
}
