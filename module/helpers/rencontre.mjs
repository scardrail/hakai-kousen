import { texteBrut } from "./chat-parse.mjs";

/**
 * Génération de rencontre sauvage (Pour la recherche de Pokémon.md) : seuls le niveau (1D100 ->
 * "table universelle des niveaux", Docs_source/Tableau de niveaux aléatoire des Pokemon
 * sauvages.xlsx) et le shiny (1D100, 100 = chromatique) sont chiffrés sans ambiguïté dans les
 * sources. Le reste (espèce selon région/milieu, genre, objet tenu, capacité spéciale, nature, IV,
 * compétences) dépend de tables région/milieu absentes ou incomplètes dans les documents
 * disponibles (seul Kanto a une table utilisable, trouée et non structurée) : laissé au MJ.
 */
const PALIERS_NIVEAU = [
  { max: 20, niveau: 5, cle: "tresFaible" },
  { max: 40, niveau: 10, cle: "faible" },
  { max: 60, niveau: 20, cle: "moyen" },
  { max: 80, niveau: 30, cle: "normal" },
  { max: 90, niveau: 40, cle: "fort" },
  { max: 99, niveau: 50, cle: "tresFort" },
  { max: 100, niveau: 60, cle: "legende" }
];

function palierPour(jet) {
  return PALIERS_NIVEAU.find((p) => jet <= p.max);
}

export async function genererRencontre() {
  const jetNiveau = await new Roll("1d100").evaluate();
  const jetShiny = await new Roll("1d100").evaluate();
  const palier = palierPour(jetNiveau.total);
  const shiny = jetShiny.total === 100;

  await ChatMessage.create({
    rolls: [jetNiveau, jetShiny],
    sound: CONFIG.sounds.dice,
    content: `<p>${game.i18n.format("HK.Rencontre.Resultat", {
      niveau: palier.niveau,
      palier: game.i18n.localize(`HK.Rencontre.Palier.${palier.cle}`),
      shiny: game.i18n.localize(shiny ? "HK.Rencontre.Shiny" : "HK.Rencontre.PasShiny")
    })}</p>`
  });

  return { niveau: palier.niveau, shiny };
}

export function registerRencontreHooks() {
  Hooks.on("chatMessage", (chatLog, message) => {
    if (!/^\/rencontre\s*$/i.test(texteBrut(message))) return;

    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("HK.Rencontre.ReserveMJ"));
      return false;
    }

    genererRencontre();
    return false;
  });
}
