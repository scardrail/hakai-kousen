import { getSeuilTableUnique } from "./table-unique.mjs";
import { calculerDegats } from "./damage.mjs";
import { getEfficacite } from "../helpers/type-chart.mjs";
import { verifierPeutAgir, appliquerStatut } from "../combat/status-effects.mjs";
import { HK } from "../helpers/config.mjs";

function libelleEfficacite(efficacite) {
  if (efficacite === 0) return "HK.Jet.Efficacite.SansEffet";
  if (efficacite > 1) return "HK.Jet.Efficacite.TresEfficace";
  if (efficacite < 1) return "HK.Jet.Efficacite.PeuEfficace";
  return null;
}

const CARACTERISTIQUE_PAR_CATEGORIE = {
  physique: { attaque: "for", defense: "end" },
  speciale: { attaque: "con", defense: "vol" }
};

/**
 * Résout une attaque Pokémon (Les combats.md) contre une seule cible : Marge/seuil via la Table
 * Unique (catégories Physique/Spéciale) ou un jet de d100 (catégorie Autre), dégâts, statut
 * éventuel, et carte de chat. Le malus de précision météo (Brouillard) est déjà appliqué à
 * `precision` par l'appelant.
 */
async function resoudreUneCible({ attaquant, cible, attaqueItem, meteo, precision }) {
  const categorie = attaqueItem.system.categorie;
  let touche = true;
  let critique = false;
  let echecCritique = false;
  let marge = null;
  let seuil = null;
  let jetAttaque = null;

  if (categorie === "autre") {
    if (!attaqueItem.system.toujoursTouche && precision < 100) {
      jetAttaque = await new Roll("1d100").evaluate();
      touche = jetAttaque.total <= precision;
    }
  } else if (!attaqueItem.system.toujoursTouche) {
    const paire = CARACTERISTIQUE_PAR_CATEGORIE[categorie];
    marge = attaquant.system.caracteristiques[paire.attaque].total - cible.system.caracteristiques[paire.defense].total;
    seuil = getSeuilTableUnique(marge, precision);
    jetAttaque = await new Roll("1d10").evaluate();
    touche = jetAttaque.total >= seuil;
    critique = touche && jetAttaque.total - seuil >= 5;
    echecCritique = jetAttaque.total === 1;
  }

  let degats = null;
  let efficacite = 1;
  if (touche && attaqueItem.system.degats) {
    const resultat = calculerDegats({ attaquant, cible, attaqueItem, critique, meteo });
    degats = resultat.total;
    efficacite = resultat.efficacite;
    await cible.update({ "system.vita.value": Math.max(cible.system.vita.value - degats, -10) });
  } else if (touche && categorie !== "autre") {
    efficacite = getEfficacite(attaqueItem.system.type, cible.system.types ?? []);
  }

  if (touche && attaqueItem.system.statut?.type) {
    const jetStatut = await new Roll("1d100").evaluate();
    if (jetStatut.total <= attaqueItem.system.statut.chance) {
      await appliquerStatut(cible, attaqueItem.system.statut.type);
    }
  }

  if (touche && attaqueItem.system.modifStats?.length) {
    for (const modif of attaqueItem.system.modifStats) {
      const acteurVise = modif.cible === "lanceur" ? attaquant : cible;
      await acteurVise.createEmbeddedDocuments("ActiveEffect", [
        {
          name: `${attaqueItem.name} (${modif.caracteristique.toUpperCase()} ${modif.valeur > 0 ? "+" : ""}${modif.valeur})`,
          icon: attaqueItem.img,
          origin: attaqueItem.uuid,
          changes: [
            {
              key: `system.caracteristiques.${modif.caracteristique}.total`,
              mode: CONST.ACTIVE_EFFECT_MODES.ADD,
              value: String(modif.valeur)
            }
          ]
        }
      ]);
    }
  }

  const content = await renderTemplate("systems/hakai-kousen/templates/chat/jet-attaque.hbs", {
    attaquant,
    cible,
    attaque: attaqueItem,
    typeLabel: game.i18n.localize(HK.types[attaqueItem.system.type]),
    categorieLabel: game.i18n.localize(HK.categoriesAttaque[categorie]),
    marge,
    seuil,
    precisionEffective: precision,
    jetAttaque: jetAttaque?.total ?? null,
    touche,
    critique,
    echecCritique,
    degats,
    efficaciteLabel: touche && categorie !== "autre" ? libelleEfficacite(efficacite) : null
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: attaquant }),
    rolls: jetAttaque ? [jetAttaque] : [],
    sound: CONFIG.sounds.dice,
    flavor: game.i18n.format("HK.Jet.Attaque", { nom: attaquant.name, attaque: attaqueItem.name }),
    content
  });

  return { touche, critique, echecCritique, degats };
}

/**
 * Point d'entrée d'une attaque : vérifie une fois si l'attaquant peut agir (statuts) et déduit
 * l'énergie une fois, puis résout la capacité contre chaque cible de `cibles` (une carte de chat
 * par cible, dans l'ordre, pour ne pas mélanger le chat log).
 */
export async function resolveAttaque({ attaquant, cibles, attaqueItem, meteo = "aucune" }) {
  const { peutAgir, motif } = await verifierPeutAgir(attaquant);
  if (!peutAgir) {
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: attaquant }),
      content: `<p><strong>${attaquant.name}</strong> ne peut pas agir (${game.i18n.localize(motif)}).</p>`
    });
    return { peutAgir: false };
  }

  if (attaquant.system.energie && attaqueItem.system.energie > attaquant.system.energie.value) {
    ui.notifications.warn(game.i18n.format("HK.Jet.EnergieInsuffisante", { nom: attaquant.name }));
    return { peutAgir: true, resolu: false };
  }

  if (attaquant.system.energie) {
    await attaquant.update({ "system.energie.value": Math.max(attaquant.system.energie.value - attaqueItem.system.energie, 0) });
  }

  const malusPrecision = HK.meteos[meteo]?.malusPrecision ?? 0;
  const precision = Math.max(1, (attaqueItem.system.precision ?? 100) - malusPrecision);

  const resultats = [];
  for (const cible of cibles) {
    resultats.push(await resoudreUneCible({ attaquant, cible, attaqueItem, meteo, precision }));
  }

  return { peutAgir: true, resolu: true, resultats };
}
