import { HK } from "../../helpers/config.mjs";

const fields = foundry.data.fields;

/**
 * Base commune aux Compétences et Connaissances : un score de 0 à 5 (Créer un personnage.md /
 * Créer un Pokémon.md). Le champ `rarete` n'est utilisé que pour les Compétences de Pokémon
 * (commune/peu commune/rare) et ignoré ailleurs.
 */
export default class ScoreDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      score: new fields.NumberField({ required: true, integer: true, min: 0, max: 5, initial: 0 }),
      rarete: new fields.StringField({ required: false, blank: true, choices: HK.rareteCompetence, initial: "" }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }

  get estSpecialisable() {
    return this.score >= 3;
  }
}
