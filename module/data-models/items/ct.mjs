const fields = foundry.data.fields;

/** CT/CS : enseigne une attaque à un Pokémon (Objets_liste.md). */
export default class CtDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      numero: new fields.StringField({ required: false, blank: true, initial: "" }),
      attaqueEnseignee: new fields.StringField({ required: false, blank: true, initial: "" }),
      prix: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      usageUnique: new fields.BooleanField({ required: true, initial: false }),
      effet: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}
