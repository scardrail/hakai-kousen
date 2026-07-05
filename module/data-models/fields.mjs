import { HK } from "../helpers/config.mjs";

const fields = foundry.data.fields;

/**
 * Bloc de 5 Caractéristiques (FOR/END/CON/VOL/DEX) pour un Dresseur : simple valeur de base
 * (1 à 5 à la création, peut évoluer ensuite).
 */
export function caracteristiquesDresseurField() {
  return new fields.SchemaField(
    Object.fromEntries(
      Object.keys(HK.caracteristiques).map((key) => [
        key,
        new fields.SchemaField({
          base: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 })
        })
      ])
    )
  );
}

/**
 * Bloc de 5 Caractéristiques pour un Pokémon : base d'espèce + IV (0-3) + EV d'entraînement.
 * Le total (`total`) est calculé en prepareBaseData et modifiable ensuite par des Active Effects
 * (statuts, objets tenus, météo, Méga-évolution...).
 */
export function caracteristiquesPokemonField() {
  return new fields.SchemaField(
    Object.fromEntries(
      Object.keys(HK.caracteristiques).map((key) => [
        key,
        new fields.SchemaField({
          base: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
          iv: new fields.NumberField({ required: true, integer: true, min: 0, max: 3, initial: 0 }),
          ev: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
        })
      ])
    )
  );
}

/** Ressource simple valeur/max (Vitalité, Énergie...). */
export function ressourceField(initial = 10) {
  return new fields.SchemaField({
    value: new fields.NumberField({ required: true, integer: true, initial }),
    max: new fields.NumberField({ required: true, integer: true, initial })
  });
}
