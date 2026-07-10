import { HK } from "../helpers/config.mjs";
import HKActorSheet from "./base-actor-sheet.mjs";
import { avancerJour, avancerMois, getJourCourant, getMoisCourant, entrainerXp, renforcerObeissance } from "../helpers/entrainement.mjs";
import { ouvrirBoutique } from "../helpers/boutique.mjs";

const MAX_EQUIPE = 6;

/**
 * Déplacer/retirer un Pokémon (dresseur-sheet.mjs #onDeplacerPokemon/#onRetirerPokemon,
 * _onDropActor) modifie l'acteur Pokémon, pas l'acteur Dresseur : une fiche Dresseur ouverte ne se
 * re-render jamais toute seule sur ce changement puisqu'elle n'écoute que son propre acteur. On
 * force donc le re-render des fiches Dresseur ouvertes concernées par ce Pokémon.
 */
export function registerDresseurSheetSync() {
  Hooks.on("updateActor", (actor, changed) => {
    if (actor.type !== "pokemon") return;
    const deplace = foundry.utils.hasProperty(changed, "system.dresseur") || foundry.utils.hasProperty(changed, "system.localisation");
    if (!deplace) return;

    for (const dresseur of game.actors) {
      if (dresseur.type === "dresseur" && dresseur.sheet?.rendered) dresseur.sheet.render();
    }
  });
}

export default class DresseurSheet extends HKActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["hakai-kousen", "sheet", "actor", "dresseur"],
    position: { width: 720, height: 820 },
    actions: {
      jourSuivant: DresseurSheet.#onJourSuivant,
      moisSuivant: DresseurSheet.#onMoisSuivant,
      entrainer: DresseurSheet.#onEntrainer,
      deplacerPokemon: DresseurSheet.#onDeplacerPokemon,
      retirerPokemon: DresseurSheet.#onRetirerPokemon,
      ouvrirPokemon: DresseurSheet.#onOuvrirPokemon,
      boutique: DresseurSheet.#onBoutique,
      badgeAjouter: DresseurSheet.#onBadgeAjouter,
      badgeSupprimer: DresseurSheet.#onBadgeSupprimer
    }
  };

  static PARTS = {
    corps: { template: "systems/hakai-kousen/templates/actor/dresseur-sheet.hbs" }
  };

  /** Tous les Pokémon appartenant à ce dresseur (system.dresseur), groupés par localisation. */
  #getPokemonDuDresseur() {
    const pokemons = game.actors.filter((a) => a.type === "pokemon" && a.system.dresseur === this.actor.uuid);
    return {
      equipe: pokemons.filter((p) => p.system.localisation === "equipe"),
      pc: pokemons.filter((p) => p.system.localisation === "pc"),
      pension: pokemons.filter((p) => p.system.localisation === "pension"),
      tous: pokemons
    };
  }

  async _prepareContext() {
    const items = this.actor.items;
    const { equipe, pc, pension } = this.#getPokemonDuDresseur();

    const caracteristiquesList = Object.entries(HK.caracteristiques).map(([key, label]) => ({
      key,
      label,
      ...this.actor.system.caracteristiques[key]
    }));

    return {
      actor: this.actor,
      system: this.actor.system,
      config: HK,
      caracteristiquesList,
      competences: items.filter((i) => i.type === "competence"),
      connaissances: items.filter((i) => i.type === "connaissance"),
      specialisations: items.filter((i) => i.type === "specialisation"),
      objets: items.filter((i) => i.type === "objet" && i.system.categorie !== "cristalZ"),
      cristauxZ: items.filter((i) => i.type === "objet" && i.system.categorie === "cristalZ"),
      armes: items.filter((i) => i.type === "arme"),
      ct: items.filter((i) => i.type === "ct"),
      equipe,
      pc,
      pension,
      estMJ: game.user.isGM,
      jourCourant: getJourCourant(),
      moisCourant: getMoisCourant(),
      ongletActif: this.ongletActif
    };
  }

  /** @override */
  async _onDropActor(event, actor) {
    if (actor.type !== "pokemon") return null;
    const { equipe } = this.#getPokemonDuDresseur();
    const compteActuel = equipe.filter((p) => p.uuid !== actor.uuid).length;
    const destination = compteActuel < MAX_EQUIPE ? "equipe" : "pc";
    if (destination === "pc" && compteActuel >= MAX_EQUIPE) {
      ui.notifications.warn(game.i18n.localize("HK.Sheet.Dresseur.EquipeComplete"));
    }
    await actor.update({ "system.dresseur": this.actor.uuid, "system.localisation": destination });
    return actor;
  }

  static async #onJourSuivant() {
    await avancerJour();
  }

  static async #onMoisSuivant() {
    await avancerMois();
  }

  static async #onDeplacerPokemon(event, target) {
    const pokemon = await fromUuid(target.dataset.pokemonUuid);
    if (!pokemon) return;

    let destination = target.dataset.destination;
    if (destination === "equipe") {
      const { equipe } = this.#getPokemonDuDresseur();
      const compteActuel = equipe.filter((p) => p.uuid !== pokemon.uuid).length;
      if (compteActuel >= MAX_EQUIPE) {
        ui.notifications.warn(game.i18n.localize("HK.Sheet.Dresseur.EquipeComplete"));
        destination = "pc";
      }
    }
    await pokemon.update({ "system.localisation": destination });
  }

  static async #onOuvrirPokemon(event, target) {
    const pokemon = await fromUuid(target.dataset.pokemonUuid);
    pokemon?.sheet.render(true);
  }

  static async #onBoutique() {
    await ouvrirBoutique(this.actor);
  }

  static async #onBadgeAjouter() {
    await this.actor.update({ "system.badges": [...this.actor.system.badges, { nom: "" }] });
  }

  static async #onBadgeSupprimer(event, target) {
    const index = Number(target.closest("[data-index]").dataset.index);
    const badges = this.actor.system.badges.filter((_, i) => i !== index);
    await this.actor.update({ "system.badges": badges });
  }

  static async #onRetirerPokemon(event, target) {
    const pokemon = await fromUuid(target.dataset.pokemonUuid);
    if (!pokemon) return;

    const confirme = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("HK.Sheet.Dresseur.Retirer") },
      content: `<p>${game.i18n.format("HK.Sheet.Dresseur.ConfirmerRetrait", { pokemon: pokemon.name })}</p>`
    });
    if (!confirme) return;

    await pokemon.update({ "system.dresseur": null });
  }

  static async #onEntrainer() {
    const { tous: equipe } = this.#getPokemonDuDresseur();
    if (!equipe.length) {
      ui.notifications.warn(game.i18n.localize("HK.Entrainement.EquipeVide"));
      return;
    }

    const options = equipe.map((p) => `<option value="${p.uuid}">${p.name}</option>`).join("");
    const content = `
      <div class="form-group">
        <label>${game.i18n.localize("HK.Entrainement.Pokemon")}</label>
        <select name="pokemonUuid">${options}</select>
      </div>
      <div class="form-group">
        <label>${game.i18n.localize("HK.Entrainement.Action")}</label>
        <select name="action">
          <option value="xp">${game.i18n.localize("HK.Entrainement.ActionXp")}</option>
          <option value="confiance">${game.i18n.localize("HK.Entrainement.ActionConfiance")}</option>
          <option value="dressage">${game.i18n.localize("HK.Entrainement.ActionDressage")}</option>
        </select>
      </div>
      <p>${game.i18n.format("HK.Entrainement.XpDisponible", { xp: this.actor.system.xp })}</p>
    `;

    const resultat = await foundry.applications.api.DialogV2.input({
      window: { title: game.i18n.localize("HK.Entrainement.Titre") },
      content
    });
    if (!resultat) return;

    const pokemon = await fromUuid(resultat.pokemonUuid);
    if (!pokemon) return;

    let retour;
    switch (resultat.action) {
      case "xp":
        retour = await entrainerXp(this.actor, pokemon);
        break;
      case "confiance":
      case "dressage":
        retour = await renforcerObeissance(this.actor, pokemon, resultat.action);
        break;
      default:
        return;
    }

    if (!retour.ok) ui.notifications.warn(game.i18n.localize(retour.motif));
  }
}
