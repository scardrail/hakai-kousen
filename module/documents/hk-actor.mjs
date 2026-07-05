import { rollCompetence } from "../dice/skill-check.mjs";

export default class HKActor extends Actor {
  /**
   * Lance un jet de Compétence/Connaissance embarquée sur cet acteur.
   * @param {string} itemId
   * @param {object} [options] Voir dice/skill-check.mjs (caracteristique, difficulte, bonusDes, specialisationActive).
   */
  async rollCompetence(itemId, options = {}) {
    const item = this.items.get(itemId);
    if (!item) return null;
    return rollCompetence(this, item, options);
  }
}
