/**
 * Pictogrammes de type (un par type, 18 au total) redessinés maison — pas les fichiers officiels
 * Nintendo/Game Freak — dans l'esprit du jeu de couleurs/symboles communautaire (cf. demande de
 * référence utilisateur, pokexp.com/guide/icones-type/). Réutilisés partout où un type est affiché
 * (fiches Pokémon/Dresseur, cartes de tchat) via les helpers Handlebars typeBadge/typePill
 * (handlebars-helpers.mjs), qui référencent ces symboles par id (#i-<cle>).
 */
export const TYPE_ICON_SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="i-normal" viewBox="0 0 24 24"><path d="M12 3l2.2 6.8H21l-5.6 4.1 2.2 6.8L12 16.6l-5.6 4.1 2.2-6.8L3 9.8h6.8z"/></symbol>
    <symbol id="i-feu" viewBox="0 0 24 24"><path d="M12 2c1 3-2 4-2 7a3 3 0 006 0c1.5 1.5 2 3.5 2 5a6 6 0 11-12 0c0-4 3-6 3-9 0-1 .3-2 3-3z"/></symbol>
    <symbol id="i-eau" viewBox="0 0 24 24"><path d="M12 2C9 7 5 11 5 15a7 7 0 0014 0c0-4-4-8-7-13z"/></symbol>
    <symbol id="i-plante" viewBox="0 0 24 24"><path d="M20 4C10 4 4 10 4 18v2h2c8 0 14-6 14-16zM6 20c1-3 3-6 6-8-1 4-2 6-6 8z"/></symbol>
    <symbol id="i-electrik" viewBox="0 0 24 24"><path d="M13 2L4 14h6l-2 8 9-12h-6z"/></symbol>
    <symbol id="i-glace" viewBox="0 0 24 24"><path d="M12 2v20M4.5 6l15 12M19.5 6l-15 12M12 2l-2 2.5M12 2l2 2.5M12 22l-2-2.5M12 22l2-2.5M4.5 6l3-.3M4.5 6l1 2.8M19.5 6l-3-.3M19.5 6l-1 2.8M4.5 18l3 .3M4.5 18l1-2.8M19.5 18l-3 .3M19.5 18l-1-2.8" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="i-combat" viewBox="0 0 24 24"><path d="M7 10V7a3 3 0 016 0h1a2 2 0 012 2v1h1a2 2 0 012 2v3a5 5 0 01-5 5h-2a6 6 0 01-6-6v-2a2 2 0 012-2z"/></symbol>
    <symbol id="i-poison" viewBox="0 0 24 24"><path d="M12 2a5 5 0 015 5c0 2-1 3-1 5h-8c0-2-1-3-1-5a5 5 0 015-5zM8 14h8l1 3-3 5H10l-3-5z"/><circle cx="9.5" cy="6.5" r="1.1" fill="#241416"/><circle cx="14.5" cy="6.5" r="1.1" fill="#241416"/></symbol>
    <symbol id="i-sol" viewBox="0 0 24 24"><path d="M2 15l5-6 3 4 2-3 4 5 6-7v10H2z"/></symbol>
    <symbol id="i-vol" viewBox="0 0 24 24"><path d="M2 13c4-6 9-9 13-9 3 0 5 1 6 3-2 0-4 1-5 3l6 1c-1 2-3 3-6 3l3 4c-3 1-6 0-8-2 0 3-3 6-6 6 2-3 2-6 1-8-2 1-3 0-4-1z"/></symbol>
    <symbol id="i-psy" viewBox="0 0 24 24"><path d="M12 6c5 0 9 3.5 10 6-1 2.5-5 6-10 6S3 14.5 2 12c1-2.5 5-6 10-6z"/><circle cx="12" cy="12" r="3" fill="#241416"/></symbol>
    <symbol id="i-insecte" viewBox="0 0 24 24"><path d="M12 8a4 4 0 014 4v4a4 4 0 01-8 0v-4a4 4 0 014-4zM8 9L4 6M16 9l4-3M8 17l-4 3M16 17l4 3M12 8V4" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/></symbol>
    <symbol id="i-roche" viewBox="0 0 24 24"><path d="M4 16l3-7 4 3 3-6 6 5-2 5H4z"/></symbol>
    <symbol id="i-spectre" viewBox="0 0 24 24"><path d="M6 20V11a6 6 0 0112 0v9l-2-2-2 2-2-2-2 2-2-2z"/><circle cx="9.5" cy="11" r="1.1" fill="#241416"/><circle cx="14.5" cy="11" r="1.1" fill="#241416"/></symbol>
    <symbol id="i-dragon" viewBox="0 0 24 24"><path d="M3 12c3-5 7-8 11-8 4 0 7 2 7 2s-4 0-6 2c3 0 5 1 6 3-3 0-5 0-6 1 2 1 3 3 3 5-3-1-5-3-6-5-2 3-5 5-9 6 2-3 3-5 2-8-1 1-2 1-2 2z"/></symbol>
    <symbol id="i-tenebres" viewBox="0 0 24 24"><path d="M14 3a9 9 0 108 12 7 7 0 01-8-12z"/></symbol>
    <symbol id="i-acier" viewBox="0 0 24 24"><path d="M12 6a6 6 0 100 12 6 6 0 000-12zm0 3a3 3 0 110 6 3 3 0 010-6zM11 1h2l.5 2.5h-3zM11 21h2l.5 2.5h-3zM1 11v2l2.5.5v-3zM21 11v2l2.5.5v-3zM4 4l1.5 1.5L4 7 2.8 5.3zM20 4l-1.5 1.5L20 7l1.2-1.7zM4 20l1.5-1.5L4 17l-1.2 1.7zM20 20l-1.5-1.5L20 17l1.2 1.7z"/></symbol>
    <symbol id="i-fee" viewBox="0 0 24 24"><path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z"/><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z"/></symbol>
  </defs>
</svg>`;
