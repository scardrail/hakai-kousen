const fields = foundry.data.fields;

/** Talent Pokémon (capacité passive) : Créer un Pokémon.md, Pour déterminer aléatoirement... */
export default class TalentDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      emplacement: new fields.StringField({
        required: true,
        choices: { premier: "HK.Talent.Premier", second: "HK.Talent.Second", cache: "HK.Talent.Cache" },
        initial: "premier"
      }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}
