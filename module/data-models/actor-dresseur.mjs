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

    schema.joueur = new fields.StringField({ required: false, blank: true, initial: "" });
    schema.vocation = new fields.StringField({ required: true, blank: true, initial: "" });
    schema.nature = new fields.StringField({ required: false, blank: true, initial: "" });
    schema.argent = new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 });
    schema.xp = new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 });
    schema.licence = new fields.BooleanField({ required: true, initial: false });
    // Changement de statut.md, "Désobéissance" : Boîte à Badges (Fiche Dresseur_v2.pdf) — liste
    // des badges obtenus plutôt qu'un simple compteur. Aucun barème chiffré badges->niveau plafond
    // n'existe dans les sources (juste un renvoi à Poképédia) : pas de blocage/statut automatique
    // appliqué, laissé au MJ (qui peut se baser sur la longueur de la liste).
    schema.badges = new fields.ArrayField(
      new fields.SchemaField({ nom: new fields.StringField({ required: true, blank: true, initial: "" }) }),
      { required: true, initial: [] }
    );

    schema.apparence = new fields.SchemaField({
      age: new fields.StringField({ blank: true, initial: "" }),
      genre: new fields.StringField({ blank: true, initial: "" }),
      peau: new fields.StringField({ blank: true, initial: "" }),
      origine: new fields.StringField({ blank: true, initial: "" }),
      yeuxCheveux: new fields.StringField({ blank: true, initial: "" }),
      corpulence: new fields.StringField({ blank: true, initial: "" }),
      taille: new fields.StringField({ blank: true, initial: "" }),
      poids: new fields.StringField({ blank: true, initial: "" }),
      description: new fields.HTMLField({ blank: true, initial: "" })
    });

    schema.historique = new fields.HTMLField({ required: false, blank: true, initial: "" });

    return schema;
  }

  prepareBaseData() {
    for (const key of Object.keys(HK.caracteristiques)) {
      this.caracteristiques[key].total = this.caracteristiques[key].base;
    }
  }
}
