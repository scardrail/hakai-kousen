const fields = foundry.data.fields;

/**
 * Spécialisation d'une Compétence/Connaissance (Créer un personnage.md) : débloquée à partir
 * d'un score de 3, double les succès obtenus sur un 10 et transforme les échecs critiques en
 * échecs simples pour la Compétence/Connaissance visée.
 */
export default class SpecialisationDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      cible: new fields.StringField({ required: true, blank: true, initial: "" }),
      description: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}
