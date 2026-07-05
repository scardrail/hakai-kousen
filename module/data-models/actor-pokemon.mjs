import { HK } from "../helpers/config.mjs";
import { caracteristiquesPokemonField } from "./fields.mjs";
import { getSensibilites } from "../helpers/type-chart.mjs";

const fields = foundry.data.fields;

/**
 * Fiche de Pokémon (Créer un Pokémon.md). Les Compétences et attaques connues sont des Items
 * embarqués sur l'acteur (types "competence" et "attaque").
 */
export default class PokemonDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const schema = {};

    schema.espece = new fields.StringField({ required: true, blank: true, initial: "" });
    schema.surnom = new fields.StringField({ required: false, blank: true, initial: "" });
    schema.types = new fields.ArrayField(
      new fields.StringField({ choices: Object.keys(HK.types) }),
      { required: true, initial: [] }
    );
    schema.genre = new fields.StringField({ choices: Object.keys(HK.genres), initial: "asexue" });
    schema.rarete = new fields.StringField({ choices: Object.keys(HK.raretes), initial: "commun" });
    schema.shiny = new fields.BooleanField({ required: true, initial: false });
    schema.taille = new fields.StringField({ blank: true, initial: "" });
    schema.poids = new fields.StringField({ blank: true, initial: "" });

    schema.caracteristiques = caracteristiquesPokemonField();

    schema.vita = new fields.SchemaField({
      base: new fields.NumberField({ required: true, integer: true, min: 1, initial: 20 }),
      iv: new fields.NumberField({ required: true, integer: true, min: 0, max: 3, initial: 0 }),
      ev: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      value: new fields.NumberField({ required: true, integer: true, initial: 20 })
    });

    schema.energie = new fields.SchemaField({
      value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 50 }),
      max: new fields.NumberField({ required: true, integer: true, min: 0, initial: 50 })
    });

    schema.nature = new fields.StringField({ choices: Object.keys(HK.natures), initial: "hardi" });
    schema.talent = new fields.StringField({ blank: true, initial: "" });
    schema.objetTenu = new fields.StringField({ required: false, blank: true, initial: "" });

    schema.obeissance = new fields.SchemaField({
      confiance: new fields.NumberField({ required: true, integer: true, min: 0, max: 9, initial: 4 }),
      dressage: new fields.NumberField({ required: true, integer: true, min: 0, max: 9, initial: 4 })
    });

    schema.xp = new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 });
    schema.niveau = new fields.NumberField({ required: true, integer: true, min: 1, initial: 5 });

    schema.dresseur = new fields.DocumentUUIDField({ type: "Actor", required: false, nullable: true, initial: null });

    schema.historique = new fields.HTMLField({ required: false, blank: true, initial: "" });

    schema.combat = new fields.SchemaField({
      megaEvolue: new fields.BooleanField({ required: true, initial: false }),
      dynamax: new fields.SchemaField({
        actif: new fields.BooleanField({ required: true, initial: false }),
        niveau: new fields.NumberField({ required: true, integer: true, min: 0, max: 10, initial: 0 }),
        toursRestants: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
      })
    });

    return schema;
  }

  prepareBaseData() {
    const nature = HK.natures[this.nature];

    for (const key of Object.keys(HK.caracteristiques)) {
      const car = this.caracteristiques[key];
      let total = car.base + car.iv + car.ev;
      if (nature?.hausse === key) total += 1;
      if (nature?.baisse === key) total -= 1;
      car.total = Math.max(1, total);
    }

    this.vita.max = this.vita.base + this.vita.iv + this.vita.ev;
    if (this.vita.value > this.vita.max) this.vita.value = this.vita.max;
  }

  prepareDerivedData() {
    this.obeissance.total = this.obeissance.confiance + this.obeissance.dressage;
    this.sensibilites = getSensibilites(this.types);

    const ivTotal = Object.keys(HK.caracteristiques).reduce((sum, key) => sum + this.caracteristiques[key].iv, 0);
    this.ivTotal = ivTotal;
    this.ivDepasseLimite = ivTotal > 10;

    this.affaiblissement = this.vita.max > 0 && this.vita.value > 0 && this.vita.value < this.vita.max / 3;

    // Les combats.md : sous 1/3 de VITA max, toutes les Caractéristiques (hors VITA/Énergie)
    // sont divisées par deux, arrondi à l'inférieur. Appliqué ici (après Active Effects) pour
    // qu'il s'ajoute aux éventuels statuts sans être écrasé par eux.
    if (this.affaiblissement) {
      for (const key of Object.keys(HK.caracteristiques)) {
        this.caracteristiques[key].total = Math.max(1, Math.floor(this.caracteristiques[key].total / 2));
      }
    }
  }
}
