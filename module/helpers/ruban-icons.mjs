/**
 * Pictogramme de Ruban de Concours, redessiné maison (pas un fichier officiel Nintendo/Game
 * Freak/pokebip.com) : une simple forme de médaille/rosette générique, dans l'esprit de
 * module/helpers/type-icons.mjs. Une seule forme, réutilisée pour les 5 catégories via une couleur
 * différente (cf. handlebars-helpers.mjs, rubanBadge) — comme typeBadge pour les types.
 */
export const RUBAN_ICON_SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="i-ruban" viewBox="0 0 24 24">
      <path d="M8 14l-3 7 5.5-2.2L12 22l1.5-3.2L19 21l-3-7" opacity="0.85"/>
      <circle cx="12" cy="9" r="7"/>
      <circle cx="12" cy="9" r="3.4" fill="#241416" opacity="0.25"/>
    </symbol>
  </defs>
</svg>`;
