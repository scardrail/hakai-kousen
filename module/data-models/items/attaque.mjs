import { HK } from "../../helpers/config.mjs";

const fields = foundry.data.fields;

/**
 * Attaque / Capacité Pokémon (Créer un Pokémon.md, Les combats.md). Le bloc `statut` et
 * `modifStats` sont une automatisation légère des effets les plus courants ; les effets plus
 * exotiques restent décrits en texte libre dans `effets`.
 */
export default class AttaqueDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      type: new fields.StringField({ required: true, choices: HK.types, initial: "normal" }),
      categorie: new fields.StringField({ required: true, choices: HK.categoriesAttaque, initial: "physique" }),
      portee: new fields.StringField({ required: true, choices: HK.portees, initial: "cible" }),
      energie: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      precision: new fields.NumberField({ required: false, integer: true, min: 1, max: 100, nullable: true, initial: 100 }),
      toujoursTouche: new fields.BooleanField({ required: true, initial: false }),
      degats: new fields.NumberField({ required: false, integer: true, min: 0, nullable: true, initial: null }),
      effets: new fields.HTMLField({ required: false, blank: true, initial: "" }),
      statut: new fields.SchemaField({
        type: new fields.StringField({ required: false, blank: true, choices: HK.statuts, initial: "" }),
        chance: new fields.NumberField({ required: true, integer: true, min: 0, max: 100, initial: 100 })
      }),
      modifStats: new fields.ArrayField(
        new fields.SchemaField({
          caracteristique: new fields.StringField({ required: true, choices: HK.caracteristiques, initial: "for" }),
          valeur: new fields.NumberField({ required: true, integer: true, initial: -1 }),
          cible: new fields.StringField({ required: true, choices: { lanceur: "HK.Jet.Lanceur", cible: "HK.Jet.Cible" }, initial: "cible" })
        })
      ),
      capaciteZ: new fields.SchemaField({
        compatible: new fields.BooleanField({ required: true, initial: true }),
        signature: new fields.BooleanField({ required: true, initial: false })
      }),
      source: new fields.StringField({ required: false, blank: true, initial: "" })
    };
  }

  /** Vrai si l'attaque ne fait pas de dégâts directs (catégorie "Autre" sans valeur de dégâts). */
  get estCapaciteDeStatut() {
    return this.categorie === "autre" && !this.degats;
  }
}
