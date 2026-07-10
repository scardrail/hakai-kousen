import { HK } from "../helpers/config.mjs";
import HKActorSheet from "./base-actor-sheet.mjs";
import { evaluerEvolutions, evoluer } from "../helpers/evolution.mjs";
import { megaEvoluer, annulerMegaEvolution } from "../helpers/mega-evolution.mjs";
import { dynamaxer, annulerDynamax } from "../combat/dynamax.mjs";

export default class PokemonSheet extends HKActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["hakai-kousen", "sheet", "actor", "pokemon"],
    position: { width: 720, height: 860 },
    actions: {
      evoluer: PokemonSheet.#onEvoluer,
      ajouterPointCompetence: PokemonSheet.#onAjouterPointCompetence,
      toggleType: PokemonSheet.#onToggleType,
      toggleEsquive: PokemonSheet.#onToggleEsquive,
      megaEvoluer: PokemonSheet.#onMegaEvoluer,
      annulerMega: PokemonSheet.#onAnnulerMega,
      dynamaxer: PokemonSheet.#onDynamaxer,
      annulerDynamax: PokemonSheet.#onAnnulerDynamax
    }
  };

  static PARTS = {
    corps: { template: "systems/hakai-kousen/templates/actor/pokemon-sheet.hbs" }
  };

  async _prepareContext() {
    const items = this.actor.items;
    const dresseur = this.actor.system.dresseur ? await fromUuid(this.actor.system.dresseur) : null;

    const caracteristiquesList = Object.entries(HK.caracteristiques).map(([key, label]) => ({
      key,
      label,
      ...this.actor.system.caracteristiques[key]
    }));

    // Goûts de Poffin (https://www.pokepedia.fr/Nature) : purement dérivés de la Nature, jamais
    // saisis à la main (cf. HK.natures).
    const nature = HK.natures[this.actor.system.nature];
    const natureGouts = {
      aime: nature?.gouteAime ? HK.gouts[nature.gouteAime] : null,
      deteste: nature?.gouteDeteste ? HK.gouts[nature.gouteDeteste] : null
    };

    const sensibilitesList = Object.entries(this.actor.system.sensibilites ?? {}).map(([type, multiplicateur]) => ({
      type,
      multiplicateur,
      niveau: multiplicateur === 0 ? "immune" : multiplicateur < 1 ? "resistant" : multiplicateur > 1 ? "faible" : "neutre"
    }));

    return {
      actor: this.actor,
      system: this.actor.system,
      config: HK,
      caracteristiquesList,
      natureGouts,
      sensibilitesList,
      attaques: items.filter((i) => i.type === "attaque"),
      talents: items.filter((i) => i.type === "talent"),
      competences: items.filter((i) => i.type === "competence"),
      objets: items.filter((i) => i.type === "objet"),
      dresseur,
      evolutions: await evaluerEvolutions(this.actor),
      estMJ: game.user.isGM,
      ongletActif: this.ongletActif
    };
  }

  static async #onEvoluer(event, target) {
    const cible = target.dataset.cible;
    const force = target.dataset.force === "true";
    if (!force) {
      const evolutions = await evaluerEvolutions(this.actor);
      const evo = evolutions.find((e) => e.cible === cible);
      if (!evo?.eligible) return;
    }

    const confirme = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("HK.Evolution.Titre") },
      content: `<p>${game.i18n.format("HK.Evolution.Confirmer", { pokemon: this.actor.name, cible })}</p>`
    });
    if (!confirme) return;

    await evoluer(this.actor, cible);
  }

  static async #onAjouterPointCompetence(event, target) {
    if (this.actor.system.pointsCompetence < 1) return;
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item || item.system.score >= 5) return;

    await item.update({ "system.score": item.system.score + 1 });
    await this.actor.update({ "system.pointsCompetence": this.actor.system.pointsCompetence - 1 });
  }

  static async #onToggleType(event, target) {
    const type = target.dataset.type;
    const types = this.actor.system.types;
    const nouveauxTypes = types.includes(type) ? types.filter((t) => t !== type) : [...types, type];
    await this.actor.update({ "system.types": nouveauxTypes });
  }

  static async #onToggleEsquive() {
    await this.actor.update({ "system.combat.esquiveActive": !this.actor.system.combat.esquiveActive });
  }

  static async #onMegaEvoluer() {
    await megaEvoluer(this.actor);
  }

  static async #onAnnulerMega() {
    await annulerMegaEvolution(this.actor);
  }

  static async #onDynamaxer() {
    const resultat = await foundry.applications.api.DialogV2.input({
      window: { title: game.i18n.localize("HK.Dynamax.Bouton") },
      content: `<div class="form-group"><label>${game.i18n.localize("HK.Dynamax.Niveau")}</label><input type="number" name="niveau" value="0" min="0" max="10"></div>`
    });
    if (!resultat) return;
    await dynamaxer(this.actor, Number(resultat.niveau) || 0);
  }

  static async #onAnnulerDynamax() {
    await annulerDynamax(this.actor);
  }
}
