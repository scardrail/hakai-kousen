import { HK } from "../helpers/config.mjs";
import { caracteristiquesDresseurField } from "./fields.mjs";

const fields = foundry.data.fields;

/**
 * Fiche de Dresseur (Créer un personnage.md). Les Compétences, Connaissances, Spécialisations
 * et l'inventaire sont des Items embarqués sur l'acteur, pas des champs de ce schéma.
 */
export default class DresseurDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const schema = {};

    schema.caracteristiques = caracteristiquesDresseurField();

    schema.vita = new fields.SchemaField({
      value: new fields.NumberField({ required: true, integer: true, initial: 10 }),
      max: new fields.NumberField({ required: true, integer: true, initial: 10 })
    });

    schema.vocation = new fields.StringField({ required: true, blank: true, initial: "" });
    schema.nature = new fields.StringField({ required: false, blank: true, initial: "" });
    schema.argent = new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 });
    schema.xp = new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 });
    schema.licence = new fields.BooleanField({ required: true, initial: false });

    schema.apparence = new fields.SchemaField({
      age: new fields.StringField({ blank: true, initial: "" }),
      genre: new fields.StringField({ blank: true, initial: "" }),
      taille: new fields.StringField({ blank: true, initial: "" }),
      poids: new fields.StringField({ blank: true, initial: "" }),
      description: new fields.HTMLField({ blank: true, initial: "" })
    });

    schema.historique = new fields.HTMLField({ required: false, blank: true, initial: "" });

    // Liens vers les Pokémon de l'équipe (Actors séparés). Maintenu manuellement pour l'instant.
    schema.equipe = new fields.ArrayField(new fields.DocumentUUIDField({ type: "Actor" }), { initial: [] });

    return schema;
  }

  prepareBaseData() {
    for (const key of Object.keys(HK.caracteristiques)) {
      this.caracteristiques[key].total = this.caracteristiques[key].base;
    }
  }
}
