import { HK } from "../helpers/config.mjs";
import { caracteristiquesPokemonField } from "./fields.mjs";
import { getSensibilites } from "../helpers/type-chart.mjs";

const fields = foundry.data.fields;

// Les combats.md, "Le Dynamax/Gigamax" (Dynamax Gigamax.xlsx, feuille Vitalité) : coefficient de
// VITA max par niveau Dynamax (0-10).
const DYNAMAX_COEFFICIENT_VITA = [1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2.0];

/**
 * Fiche de Pokémon (Créer un Pokémon.md). Les Compétences et attaques connues sont des Items
 * embarqués sur l'acteur (types "competence" et "attaque").
 */
export default class PokemonDataModel extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const schema = {};

    schema.espece = new fields.StringField({ required: true, blank: true, initial: "" });
    schema.surnom = new fields.StringField({ required: false, blank: true, initial: "" });
    // Famille (Fiche Pokémon_v3.pdf) : catégorie/classification Pokédex (ex. "Pokémon Souris"),
    // distincte de l'espèce elle-même.
    schema.famille = new fields.StringField({ required: false, blank: true, initial: "" });
    // Ball et Provenance (Fiche Pokémon_v3.pdf, Créer un Pokémon.md "Sa provenance, la Ball avec
    // laquelle vous l'avez capturé") : texte libre décrivant l'origine du Pokémon.
    schema.ball = new fields.StringField({ required: false, blank: true, initial: "" });
    schema.provenance = new fields.StringField({ required: false, blank: true, initial: "" });
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
    schema.pointsCompetence = new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 });

    schema.dresseur = new fields.DocumentUUIDField({ type: "Actor", required: false, nullable: true, initial: null });
    schema.localisation = new fields.StringField({
      required: true,
      choices: { equipe: "HK.Localisation.Equipe", pc: "HK.Localisation.Pc", pension: "HK.Localisation.Pension" },
      initial: "pc"
    });

    schema.historique = new fields.HTMLField({ required: false, blank: true, initial: "" });

    // Évolutions possibles depuis cette espèce (gabarits Pokédex uniquement, cf.
    // tools/scraper/parse-pokedex.mjs) : une entrée par cible, avec un ET logique entre ses
    // conditions. Rempli automatiquement pour les gabarits du Pokédex ; vide par défaut sur un
    // Pokémon joué tant qu'il n'a pas été copié depuis un gabarit lors de la capture/création.
    schema.evolutions = new fields.ArrayField(
      new fields.SchemaField({
        cible: new fields.StringField({ required: true, blank: false }),
        conditions: new fields.ArrayField(
          new fields.SchemaField({
            type: new fields.StringField({ required: true, choices: HK.conditionsEvolution, initial: "niveau" }),
            valeur: new fields.StringField({ required: false, blank: true, initial: "" })
          })
        )
      }),
      { required: false, initial: [] }
    );

    // Capacités apprises par niveau (gabarits Pokédex uniquement, cf.
    // tools/scraper/parse-pokedex.mjs) : sert à savoir quoi ajouter automatiquement à un Pokémon
    // joué lorsqu'il franchit un palier (module/helpers/niveau.mjs), sans jamais rien retirer
    // (aucun plafond au nombre d'attaques connues, cf. décision de la phase CT).
    schema.movepoolNiveau = new fields.ArrayField(
      new fields.SchemaField({
        niveau: new fields.NumberField({ required: true, integer: true, min: 1, initial: 1 }),
        attaque: new fields.StringField({ required: true, blank: false })
      }),
      { required: false, initial: [] }
    );

    const bonusCaracteristiquesField = () =>
      new fields.SchemaField(
        Object.fromEntries(
          Object.keys(HK.caracteristiques).map((cle) => [cle, new fields.NumberField({ required: true, integer: true, initial: 0 })])
        )
      );

    schema.combat = new fields.SchemaField({
      megaEvolue: new fields.BooleanField({ required: true, initial: false }),
      // Sauvegarde de la forme normale (Les combats.md, "Les méga-évolutions") pour pouvoir
      // revenir en arrière à la fin du combat ou au K.O. (module/helpers/mega-evolution.mjs) :
      // aucune formule de bonus n'existe dans les sources, seulement des gabarits Pokédex séparés
      // déjà chiffrés par forme méga, d'où un delta calculé une fois à l'activation.
      megaSauvegarde: new fields.SchemaField({
        types: new fields.ArrayField(new fields.StringField(), { required: false, initial: [] }),
        talent: new fields.StringField({ required: false, blank: true, initial: "" }),
        bonus: bonusCaracteristiquesField()
      }),
      dynamax: new fields.SchemaField({
        actif: new fields.BooleanField({ required: true, initial: false }),
        niveau: new fields.NumberField({ required: true, integer: true, min: 0, max: 10, initial: 0 }),
        toursRestants: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),
      // Esquive active (Créer un Pokémon.md, "Lorsqu'un Pokémon esquive...") : déclarée à l'avance
      // par le joueur pour la prochaine attaque reçue, consommée automatiquement à sa résolution
      // (module/dice/attack-roll.mjs).
      esquiveActive: new fields.BooleanField({ required: true, initial: false })
    });

    // Suivi de l'entraînement hors combat (Chapitres Livre.md ch.11, Créer un Pokémon.md) : compare
    // à la demande aux compteurs monde jour/mois (module/helpers/entrainement.mjs) pour un reset
    // paresseux, sans avoir à parcourir tous les Pokémon quand le MJ fait avancer le temps.
    schema.entrainement = new fields.SchemaField({
      moisXp: new fields.NumberField({ required: true, integer: true, initial: 0 }),
      joursXpUtilises: new fields.NumberField({ required: true, integer: true, min: 0, max: 7, initial: 0 }),
      dernierJourConfiance: new fields.NumberField({ required: true, integer: true, initial: -1 }),
      dernierJourDressage: new fields.NumberField({ required: true, integer: true, initial: -1 })
    });

    // Les Super Concours.md, "Les 5 catégories et la Condition d'un Pokémon" : Condition 0-5 par
    // catégorie (comme une Compétence), montée par les Poffins (module/helpers/concours.mjs)
    // plutôt que par XP. dernierJourPoffin limite à un Poffin par jour et par Pokémon, même
    // mécanique que dernierJourConfiance/dernierJourDressage ci-dessus. Les rubans obtenus
    // (catégorie + rang) conditionnent l'inscription au rang supérieur et, avec un ruban dans
    // chacune des 5 catégories, l'accès au Festival des Champions.
    schema.concours = new fields.SchemaField({
      condition: new fields.SchemaField(
        Object.fromEntries(
          Object.keys(HK.categoriesConcours).map((cle) => [cle, new fields.NumberField({ required: true, integer: true, min: 0, max: 5, initial: 0 })])
        )
      ),
      dernierJourPoffin: new fields.NumberField({ required: true, integer: true, initial: -1 }),
      rubans: new fields.ArrayField(
        new fields.SchemaField({
          categorie: new fields.StringField({ required: true, choices: HK.categoriesConcours, initial: "beaute" }),
          rang: new fields.StringField({ required: true, choices: Object.keys(HK.rangsConcours), initial: "normal" })
        }),
        { required: true, initial: [] }
      )
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
      // Les combats.md, "Les méga-évolutions" : bonus de caractéristiques (delta calculé à
      // l'activation faute de formule sourcée, cf. module/helpers/mega-evolution.mjs).
      if (this.combat.megaEvolue) total += this.combat.megaSauvegarde.bonus[key];
      car.total = Math.max(1, total);
    }

    this.vita.max = this.vita.base + this.vita.iv + this.vita.ev;
    // Les combats.md, "Le Dynamax/Gigamax" : seul le coefficient de VITA max par niveau est
    // chiffré dans les sources (les autres Caractéristiques n'ont "aucun calcul retrouvé").
    if (this.combat.dynamax.actif) {
      const coefficient = DYNAMAX_COEFFICIENT_VITA[this.combat.dynamax.niveau] ?? DYNAMAX_COEFFICIENT_VITA[0];
      this.vita.max = Math.round(this.vita.max * coefficient);
    }
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

    // Les Super Concours.md, "Le Festival des Champions" : un Ruban dans chacune des 5 catégories
    // (n'importe quel rang) suffit à ouvrir l'inscription, indépendamment du rang de chaque Ruban.
    const categoriesAvecRuban = new Set(this.concours.rubans.map((r) => r.categorie));
    this.concours.festivalEligible = Object.keys(HK.categoriesConcours).every((cle) => categoriesAvecRuban.has(cle));
  }
}
