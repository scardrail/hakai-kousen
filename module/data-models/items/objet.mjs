import { HK } from "../../helpers/config.mjs";

const fields = foundry.data.fields;

/** Objet générique (baie, ball, médicament, objet tenu, équipement...) : Objets_liste.md. */
export default class ObjetDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      categorie: new fields.StringField({ required: true, choices: HK.categoriesObjet, initial: "divers" }),
      prix: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      quantite: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      effet: new fields.HTMLField({ required: false, blank: true, initial: "" }),
      // Pertinent seulement pour categorie "ball" (Objets_liste.md, "Bonus capture") : ne couvre
      // que le cas de base/par défaut de chaque Ball, les bonus très conditionnels ("+3 si pêché",
      // "+2 dans le noir"...) restent en texte libre dans effet et se règlent via l'ajustement
      // manuel du jet de capture (module/helpers/capture.mjs).
      bonusCapture: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      captureAutomatique: new fields.BooleanField({ required: true, initial: false })
    };
  }
}
