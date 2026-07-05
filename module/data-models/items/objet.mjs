import { HK } from "../../helpers/config.mjs";

const fields = foundry.data.fields;

/** Objet générique (baie, ball, médicament, objet tenu, équipement...) : Objets_liste.md. */
export default class ObjetDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      categorie: new fields.StringField({ required: true, choices: HK.categoriesObjet, initial: "divers" }),
      prix: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      quantite: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      effet: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}
