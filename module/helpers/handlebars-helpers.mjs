import { HK } from "./config.mjs";
import { TYPE_ICON_SPRITE } from "./type-icons.mjs";

export function registerHandlebarsHelpers() {
  Handlebars.registerHelper("includes", (array, valeur) => Array.isArray(array) && array.includes(valeur));

  Handlebars.registerHelper("typeIconSprite", () => new Handlebars.SafeString(TYPE_ICON_SPRITE));

  /** Pastille ronde colorée avec le pictogramme du type, sans texte (listes d'items). */
  Handlebars.registerHelper("typeBadge", (cle) => {
    if (!cle || !HK.types[cle]) return "";
    return new Handlebars.SafeString(
      `<span class="hk-type-badge" style="background:var(--hk-t-${cle})"><svg><use href="#i-${cle}"></use></svg></span>`
    );
  });

  /** Pilule colorée avec pictogramme + libellé localisé (en-tête de fiche). */
  Handlebars.registerHelper("typePill", (cle) => {
    if (!cle || !HK.types[cle]) return "";
    const label = game.i18n.localize(HK.types[cle]);
    return new Handlebars.SafeString(
      `<span class="hk-type-pill" style="background:var(--hk-t-${cle})"><svg><use href="#i-${cle}"></use></svg>${label}</span>`
    );
  });

  /** Pourcentage (0-100, borné) d'une jauge VITA/Énergie, pour la largeur de la barre. */
  Handlebars.registerHelper("jaugePct", (valeur, max) => {
    if (!max) return 0;
    return Math.max(0, Math.min(100, Math.round((valeur / max) * 100)));
  });

  /** Classe CSS ("", "moyen" ou "faible") selon le taux de remplissage d'une jauge. */
  Handlebars.registerHelper("jaugeEtat", (valeur, max) => {
    if (!max) return "faible";
    const pct = (valeur / max) * 100;
    if (pct <= 20) return "faible";
    if (pct <= 50) return "moyen";
    return "";
  });
}
