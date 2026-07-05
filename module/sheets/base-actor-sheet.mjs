const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Base commune aux fiches Dresseur/Pokémon : CRUD des Items embarqués (Compétences, Attaques,
 * Objets...) via des attributs `data-action`, et répartition des champs de formulaire nommés
 * `items.<id>.<chemin>` vers `updateEmbeddedDocuments` (ce n'est pas géré nativement par
 * DocumentSheetV2, qui ne met à jour que le document principal).
 */
export default class HKActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    tag: "form",
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      itemCreate: HKActorSheet.#onItemCreate,
      itemEdit: HKActorSheet.#onItemEdit,
      itemDelete: HKActorSheet.#onItemDelete,
      itemUse: HKActorSheet.#onItemUse
    }
  };

  async _processSubmitData(event, form, submitData, options) {
    const itemUpdates = submitData.items;
    delete submitData.items;

    await super._processSubmitData(event, form, submitData, options);

    if (itemUpdates) {
      const updates = Object.entries(itemUpdates).map(([_id, changes]) => ({ _id, ...changes }));
      if (updates.length) await this.actor.updateEmbeddedDocuments("Item", updates);
    }
  }

  static async #onItemCreate(event, target) {
    const type = target.dataset.type;
    const [item] = await this.actor.createEmbeddedDocuments("Item", [
      { name: game.i18n.format("HK.Sheet.Commun.Nouveau", { type: game.i18n.localize(`TYPES.Item.${type}`) }), type }
    ]);
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
    await this.actor.items.get(itemId)?.utiliser();
  }
}
