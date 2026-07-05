import { HK } from "../helpers/config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export default class HKItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["hakai-kousen", "sheet", "item"],
    tag: "form",
    position: { width: 520, height: 560 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      modifStatAjouter: HKItemSheet.#onModifStatAjouter,
      modifStatSupprimer: HKItemSheet.#onModifStatSupprimer
    }
  };

  static PARTS = {
    corps: { template: "systems/hakai-kousen/templates/item/item-sheet.hbs" }
  };

  async _prepareContext() {
    return {
      item: this.document,
      system: this.document.system,
      config: HK
    };
  }

  static async #onModifStatAjouter() {
    const modifStats = this.document.system.toObject().modifStats ?? [];
    modifStats.push({ caracteristique: "for", valeur: -1, cible: "cible" });
    await this.document.update({ "system.modifStats": modifStats });
  }

  static async #onModifStatSupprimer(event, target) {
    const index = Number(target.closest("[data-index]")?.dataset.index);
    const modifStats = this.document.system.toObject().modifStats ?? [];
    modifStats.splice(index, 1);
    await this.document.update({ "system.modifStats": modifStats });
  }
}
