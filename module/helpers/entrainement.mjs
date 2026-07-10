/**
 * Entraînement hors combat (Chapitres Livre.md ch.11, Créer un Pokémon.md "Confiance"/"Dressage") :
 * le Dresseur dépense ses propres points d'XP pour faire progresser un Pokémon. Foundry n'a pas de
 * calendrier in-game natif, donc le "temps de la table" est un simple compteur jour/mois piloté à
 * la main par le MJ (game.settings), comparé à la demande aux compteurs stockés sur chaque Pokémon.
 */
const MODULE_ID = "hakai-kousen";

export function registerEntrainementSettings() {
  game.settings.register(MODULE_ID, "jourCourant", { scope: "world", config: false, type: Number, default: 0 });
  game.settings.register(MODULE_ID, "moisCourant", { scope: "world", config: false, type: Number, default: 0 });
}

export function getJourCourant() {
  return game.settings.get(MODULE_ID, "jourCourant");
}

export function getMoisCourant() {
  return game.settings.get(MODULE_ID, "moisCourant");
}

export async function avancerJour() {
  await game.settings.set(MODULE_ID, "jourCourant", getJourCourant() + 1);
}

export async function avancerMois() {
  await game.settings.set(MODULE_ID, "moisCourant", getMoisCourant() + 1);
}

/**
 * Entraînement XP (Créer un Pokémon.md L375 : 1 XP Dresseur = 50 XP Pokémon) : max 7 utilisations
 * par mois et par Pokémon (Chapitres Livre.md ch.11 : max 7 jours de 4h/mois).
 */
export async function entrainerXp(dresseur, pokemon) {
  const moisCourant = getMoisCourant();
  let joursXpUtilises = pokemon.system.entrainement.joursXpUtilises;
  if (pokemon.system.entrainement.moisXp !== moisCourant) {
    joursXpUtilises = 0;
    await pokemon.update({ "system.entrainement.moisXp": moisCourant, "system.entrainement.joursXpUtilises": 0 });
  }

  if (joursXpUtilises >= 7) return { ok: false, motif: "HK.Entrainement.PlafondMoisAtteint" };
  if (dresseur.system.xp < 1) return { ok: false, motif: "HK.Entrainement.XpInsuffisante" };

  await dresseur.update({ "system.xp": dresseur.system.xp - 1 });
  await pokemon.update({
    "system.xp": pokemon.system.xp + 50,
    "system.entrainement.joursXpUtilises": joursXpUtilises + 1
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: dresseur }),
    content: `<p>${game.i18n.format("HK.Entrainement.SuccesXp", { dresseur: dresseur.name, pokemon: pokemon.name })}</p>`
  });
  return { ok: true };
}

const CHAMP_PAR_CLE = { confiance: "dernierJourConfiance", dressage: "dernierJourDressage" };

/**
 * Confiance/Dressage (Créer un Pokémon.md L307/L337) : 1 XP Dresseur = +1 (2 XP si Légendaire),
 * une fois par jour et par Pokémon. Pas de plafond mensuel dans le texte source : seule la borne
 * 0-9 du champ (déjà dans le schéma) s'applique.
 */
export async function renforcerObeissance(dresseur, pokemon, cle) {
  const champJour = CHAMP_PAR_CLE[cle];
  const jourCourant = getJourCourant();
  if (pokemon.system.entrainement[champJour] === jourCourant) {
    return { ok: false, motif: "HK.Entrainement.DejaFaitAujourdhui" };
  }

  const cout = pokemon.system.rarete === "legendaire" ? 2 : 1;
  if (dresseur.system.xp < cout) return { ok: false, motif: "HK.Entrainement.XpInsuffisante" };

  await dresseur.update({ "system.xp": dresseur.system.xp - cout });
  await pokemon.update({
    [`system.obeissance.${cle}`]: Math.min(9, pokemon.system.obeissance[cle] + 1),
    [`system.entrainement.${champJour}`]: jourCourant
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: dresseur }),
    content: `<p>${game.i18n.format("HK.Entrainement.SuccesObeissance", {
      dresseur: dresseur.name,
      pokemon: pokemon.name,
      cle: game.i18n.localize(cle === "confiance" ? "HK.Sheet.Pokemon.Confiance" : "HK.Sheet.Pokemon.Dressage")
    })}</p>`
  });
  return { ok: true };
}
