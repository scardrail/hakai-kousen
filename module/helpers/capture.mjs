import { aStatut } from "../combat/status-effects.mjs";

/**
 * Capture d'un Pokémon sauvage (Formule de Capture des Pokemon.pdf) : 1D10, seuil de base 5 (50%),
 * modulé par l'état du Pokémon (VIT, statut), sa rareté, son stade d'évolution, et le bonus de la
 * Ball utilisée (ball.system.bonusCapture). Un score total négatif rend la capture impossible dans
 * cet état. La Master Ball capture à tous les coups (sauf Légendaire, cf. ball.system.captureAutomatique).
 * Le stade d'évolution et "Bébé Pokémon" ne sont pas des données trackées par le système : demandés
 * manuellement, comme l'ajustement libre déjà utilisé pour les nombreux bonus de Ball très
 * conditionnels (pêche, nuit, premier tour...) qu'aucune donnée du système ne permet de vérifier
 * automatiquement.
 */
const SEUIL_BASE = 5;

const MODIFICATEUR_RARETE = {
  commun: 0,
  peuCommun: 0,
  starter: 0,
  rare: -2,
  tresRare: -2,
  semiLegendaire: -3
};

const MODIFICATEUR_STADE = { 1: 0, 2: -1, 3: -2 };

const STATUTS_LOURDS = ["sommeil", "gel"];
const STATUTS_LEGERS = ["brulure", "poison", "poisonGrave", "paralysie"];

/** VIT > 1/2 max : -4 ; > 1/4 max : -3 ; <= 1/4 max : -2 ; K.O. (<= 0) : +0. */
function modificateurVit(cible) {
  const { value, max } = cible.system.vita;
  if (value <= 0) return 0;
  if (value <= max / 4) return -2;
  if (value <= max / 2) return -3;
  return -4;
}

/** Endormi/Gelé : +2 ; Brûlé/Empoisonné/Paralysé : +1 (un seul bonus, le plus élevé applicable). */
function modificateurStatut(cible) {
  if (STATUTS_LOURDS.some((cle) => aStatut(cible, cle))) return 2;
  if (STATUTS_LEGERS.some((cle) => aStatut(cible, cle))) return 1;
  return 0;
}

export async function tenterCapture(dresseur, ball, cible) {
  const legendaireMajeur = cible.system.rarete === "legendaire";
  const automatique = ball.system.captureAutomatique && !legendaireMajeur;

  const optionsStade = [1, 2, 3]
    .map((s) => `<option value="${s}" ${s === 1 ? "selected" : ""}>${game.i18n.format("HK.Capture.Stade.Option", { stade: s })}</option>`)
    .join("");

  const dialogContent = `
    <div class="form-group">
      <label>${game.i18n.localize("HK.Capture.Stade.Label")}</label>
      <select name="stade">${optionsStade}</select>
    </div>
    <div class="form-group">
      <label><input type="checkbox" name="bebe"> ${game.i18n.localize("HK.Capture.Bebe")}</label>
    </div>
    <div class="form-group">
      <label>${game.i18n.localize("HK.Capture.Ajustement")}</label>
      <input type="number" name="ajustement" value="0">
    </div>
    <div class="form-group">
      <label>${game.i18n.localize("HK.Capture.Approche.Label")}</label>
      <select name="approche">
        <option value="neutre" selected>${game.i18n.localize("HK.Capture.Approche.Neutre")}</option>
        <option value="tendresse">${game.i18n.localize("HK.Capture.Approche.Tendresse")}</option>
        <option value="violence">${game.i18n.localize("HK.Capture.Approche.Violence")}</option>
      </select>
    </div>
  `;

  const resultat = await foundry.applications.api.DialogV2.input({
    window: { title: game.i18n.format("HK.Capture.Titre", { cible: cible.name }) },
    content: dialogContent
  });
  if (!resultat) return null;

  const ajustement = Number(resultat.ajustement) || 0;
  const stade = Number(resultat.stade) || 1;
  const bebe = !!resultat.bebe;

  const modVit = modificateurVit(cible);
  const modRarete = MODIFICATEUR_RARETE[cible.system.rarete] ?? 0;
  const modStade = MODIFICATEUR_STADE[stade] ?? 0;
  const modBebe = bebe ? 1 : 0;
  const modStatut = modificateurStatut(cible);
  const bonusBall = ball.system.bonusCapture ?? 0;

  const impossible = legendaireMajeur && !automatique;
  const seuil = impossible ? 0 : SEUIL_BASE + modVit + modRarete + modStade + modBebe + modStatut + bonusBall + ajustement;

  const ligne = (libelle, valeur) => `${game.i18n.localize(libelle)} ${valeur > 0 ? "+" : ""}${valeur}`;
  const details = [ligne("HK.Capture.Detail.Base", SEUIL_BASE)];
  if (modVit) details.push(ligne("HK.Capture.Detail.Vit", modVit));
  if (modRarete) details.push(ligne("HK.Capture.Detail.Rarete", modRarete));
  if (modStade) details.push(ligne("HK.Capture.Detail.Stade", modStade));
  if (modBebe) details.push(ligne("HK.Capture.Detail.Bebe", modBebe));
  if (modStatut) details.push(ligne("HK.Capture.Detail.Statut", modStatut));
  if (bonusBall) details.push(ligne("HK.Capture.Detail.Ball", bonusBall));
  if (ajustement) details.push(ligne("HK.Capture.Detail.Ajustement", ajustement));

  const roll = automatique || seuil <= 0 ? null : await new Roll("1d10").evaluate();
  const jet = roll?.total ?? null;
  const reussite = automatique || (seuil > 0 && jet <= seuil);

  await ball.update({ "system.quantite": Math.max(0, ball.system.quantite - 1) });

  if (reussite) {
    const confiance = resultat.approche === "tendresse" ? 1 : 0;
    const dressage = Math.min(9, 2 + (resultat.approche === "violence" ? 1 : 0));
    await cible.update({
      "system.dresseur": dresseur.uuid,
      "system.localisation": "pc",
      "system.obeissance.confiance": confiance,
      "system.obeissance.dressage": dressage
    });
  }

  const content = await renderTemplate("systems/hakai-kousen/templates/chat/jet-capture.hbs", {
    dresseur,
    ball,
    cible,
    automatique,
    impossible: seuil <= 0 && !automatique,
    jet,
    seuil,
    details,
    reussite
  });
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: dresseur }),
    rolls: roll ? [roll] : [],
    sound: CONFIG.sounds.dice,
    flavor: game.i18n.format("HK.Capture.Flavor", { dresseur: dresseur.name, cible: cible.name }),
    content
  });

  return reussite;
}
