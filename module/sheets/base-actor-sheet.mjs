import { HK } from "../helpers/config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Système de jeu.md, "Les jets de Compétences" : demande au joueur la Caractéristique à ajouter
 * (Dresseur uniquement, un Pokémon n'a pas cette option) et la difficulté (1-10, 6 par défaut). Le
 * doublement des 10 est détecté automatiquement via une Spécialisation embarquée dont la cible
 * correspond au nom de la Compétence/Connaissance, sans case à cocher à gérer soi-même.
 */
async function demanderOptionsCompetence(actor, item) {
  const specialisationActive = actor.items.some(
    (i) => i.type === "specialisation" && i.system.cible?.trim().toLowerCase() === item.name.trim().toLowerCase()
  );

  const champCaracteristique =
    actor.type === "dresseur"
      ? `<div class="form-group">
          <label>${game.i18n.localize("HK.Jet.Caracteristique")}</label>
          <select name="caracteristique">
            <option value=""></option>
            ${Object.entries(HK.caracteristiques)
              .map(([cle, label]) => `<option value="${cle}">${game.i18n.localize(label)}</option>`)
              .join("")}
          </select>
        </div>`
      : "";

  const resultat = await foundry.applications.api.DialogV2.input({
    window: { title: game.i18n.format("HK.Jet.TitreCompetence", { competence: item.name }) },
    content: `
      ${champCaracteristique}
      <div class="form-group">
        <label>${game.i18n.localize("HK.Jet.Difficulte")}</label>
        <input type="number" name="difficulte" value="6" min="1" max="10">
      </div>
    `
  });
  if (!resultat) return null;

  return {
    caracteristique: resultat.caracteristique ?? "",
    difficulte: Number(resultat.difficulte) || 6,
    specialisationActive
  };
}

/**
 * Base commune aux fiches Dresseur/Pokémon : CRUD des Items embarqués (Compétences, Attaques,
 * Objets...) via des attributs `data-action`. Les champs édités directement sur un Item embarqué
 * (ex. score d'une Compétence) utilisent `data-item-field` + un listener dédié (#onChangeItemField)
 * qui ne met à jour QUE cet Item, plutôt qu'un nom de champ `items.<id>.<chemin>` resoumis avec tout
 * le formulaire à chaque `submitOnChange` : cette dernière approche renvoyait un batch complet de
 * tous les Items affichés à chaque frappe ailleurs sur la fiche, et une resoumission retardée par
 * rapport à un re-rendu (ex. après création d'un nouvel Item) pouvait écraser le score des Items
 * existants avec leur valeur par défaut.
 */
export default class HKActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  // Onglet actif (Principal/Historique) : état d'affichage propre à cette instance de fenêtre,
  // pas une donnée de l'acteur — persiste tant que la fiche reste ouverte, sans rien sauvegarder.
  #ongletActif = "principal";

  static DEFAULT_OPTIONS = {
    tag: "form",
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      itemCreate: HKActorSheet.#onItemCreate,
      itemEdit: HKActorSheet.#onItemEdit,
      itemDelete: HKActorSheet.#onItemDelete,
      itemUse: HKActorSheet.#onItemUse,
      changerOnglet: HKActorSheet.#onChangerOnglet
    }
  };

  get ongletActif() {
    return this.#ongletActif;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    for (const input of this.element.querySelectorAll("[data-item-field]")) {
      input.addEventListener("change", this.#onChangeItemField.bind(this));
    }
  }

  async #onChangeItemField(event) {
    const input = event.currentTarget;
    const itemId = input.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    const valeur = input.type === "number" ? Number(input.value) : input.value;
    await item.update({ [input.dataset.itemField]: valeur });
  }

  static async #onItemCreate(event, target) {
    const type = target.dataset.type;

    // Créer un personnage.md : "Achat d'une nouvelle spécialisation : 5 points d'expérience".
    if (type === "specialisation" && this.actor.type === "dresseur") {
      const cout = 5;
      if (this.actor.system.xp < cout) {
        ui.notifications.warn(game.i18n.localize("HK.Sheet.Dresseur.XpSpecialisationInsuffisante"));
        return;
      }
      await this.actor.update({ "system.xp": this.actor.system.xp - cout });
    }

    const [item] = await this.actor.createEmbeddedDocuments("Item", [
      { name: game.i18n.format("HK.Sheet.Commun.Nouveau", { type: game.i18n.localize(`TYPES.Item.${type}`) }), type }
    ]);
    if (target.dataset.categorie) await item.update({ "system.categorie": target.dataset.categorie });
    item.sheet.render(true);
  }

  static async #onItemEdit(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    this.actor.items.get(itemId)?.sheet.render(true);
  }

  static async #onItemDelete(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    await this.actor.items.get(itemId)?.delete();
  }

  static async #onItemUse(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;

    if (item.type === "competence" || item.type === "connaissance") {
      const options = await demanderOptionsCompetence(this.actor, item);
      if (!options) return;
      await item.utiliser(options);
      return;
    }

    await item.utiliser();
  }

  static async #onChangerOnglet(event, target) {
    this.#ongletActif = target.dataset.onglet;
    this.render();
  }
}
