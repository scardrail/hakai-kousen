const fields = foundry.data.fields;

/** Arme humaine (Les Equipements.md). Les règles source ne donnent pas de chiffres de dégâts. */
export default class ArmeDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      categorie: new fields.StringField({
        required: true,
        choices: { melee: "HK.Arme.Melee", distance: "HK.Arme.Distance" },
        initial: "melee"
      }),
      degats: new fields.StringField({ required: false, blank: true, initial: "" }),
      portee: new fields.StringField({ required: false, blank: true, initial: "" }),
      notes: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}
