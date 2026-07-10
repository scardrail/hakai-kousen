import { retirerStatut, STATUTS } from "../combat/status-effects.mjs";

const TOUS_STATUTS = Object.keys(STATUTS);

/**
 * Effets mécaniques des objets de soin (Objets_liste.md), indexés par nom exact d'Item. Seuls les
 * objets à effet chiffré et non ambigu sont couverts ici : objets tenus passifs (Charbon, Restes...),
 * objets de combat temporaires (durée en tours/minutes, nécessiteraient un système d'effets à durée
 * dédié), répulsifs/navigation (aucune mécanique de rencontre aléatoire à repousser dans ce système)
 * et Pilule Talent (le modèle de données actuel liste tous les talents connus simultanément, sans
 * notion de talent "actif" à changer) restent hors périmètre — cf. Docs_source/todo.md.
 *
 * Les 5 baies "Figuy/Wiki/Mago/Gowav/Papaya" ont dans les sources un effet secondaire de confusion
 * conditionné au goût de Poffin détesté par la Nature du Pokémon : non implémenté ici (simplifié au
 * seul soin de 1/8 des PV max), faute d'avoir vérifié une table goûts/natures fiable à exploiter.
 */
const EFFETS = {
  Potion: { vita: 10 },
  "Super Potion": { vita: 25 },
  "Hyper Potion": { vita: 50 },
  "Potion Max": { vitaTotal: true },
  Guérison: { vitaTotal: true, statuts: TOUS_STATUTS },
  Huile: { energie: 10 },
  "Huile Max": { energie: 20 },
  Élixir: { energie: 25 },
  "Max Élixir": { energieTotal: true },
  Antidote: { statuts: ["poison", "poisonGrave"] },
  "Anti-Para": { statuts: ["paralysie"] },
  "Anti-Brûle": { statuts: ["brulure"] },
  Antigel: { statuts: ["gel"] },
  Réveil: { statuts: ["sommeil"] },
  "Total Soin": { statuts: TOUS_STATUTS },

  "Herbe Rappel": { ranime: true, vita: 1 },
  Racinénergie: { vita: 5, energie: 50 },
  Poudrénergie: { vita: 1, energie: 10 },
  "Poudre Soin": { statuts: TOUS_STATUTS },
  Cendresacrée: { ranime: true, vitaTotal: true, equipeEntiere: true },

  Rappel: { ranime: true, vitaFraction: 0.5 },
  "Rappel Max": { ranime: true, vitaTotal: true },

  "Baie Mepo": { energie: 10 },
  "Baie Oran": { vita: 10 },
  "Baie Sitrus": { vita: 20 },
  "Baie Figuy": { vitaFraction: 1 / 8 },
  "Baie Wiki": { vitaFraction: 1 / 8 },
  "Baie Mago": { vitaFraction: 1 / 8 },
  "Baie Gowav": { vitaFraction: 1 / 8 },
  "Baie Papaya": { vitaFraction: 1 / 8 },
  "Baie Ceriz": { statuts: ["paralysie"] },
  "Baie Maron": { statuts: ["sommeil"] },
  "Baie Pêcha": { statuts: ["poison", "poisonGrave"] },
  "Baie Drash": { statuts: ["poison", "poisonGrave"] },
  "Baie Fraive": { statuts: ["brulure"] },
  "Baie Kuo": { statuts: ["brulure"] },
  "Baie Willia": { statuts: ["gel"] },
  "Baie Pumkin": { statuts: ["gel"] },
  "Baie Kika": { statuts: ["confusion"] },
  "Baie Touga": { statuts: ["confusion"] },
  "Baie Eggant": { statuts: ["attraction"] },
  "Baie Prine": { statuts: TOUS_STATUTS },

  Chococœur: { vita: 2 },
  "Eau Fraîche": { vita: 5 },
  "Jus de Baie": { vita: 5 },
  "Soda Cool": { vita: 6 },
  Limonade: { vita: 8 },
  "Lait Meumeu": { vita: 10 },
  Miel: { vita: 10 },
  "Glace Volute": { statuts: TOUS_STATUTS },
  "Lava Cookie": { statuts: TOUS_STATUTS },
  "Vieux Gâteau": { statuts: TOUS_STATUTS },

  Vitamine: { evVita: 1 },
  Protéine: { evCaracteristique: "for" },
  Fer: { evCaracteristique: "end" },
  Calcium: { evCaracteristique: "con" },
  Carbone: { evCaracteristique: "dex" },
  Zinc: { evCaracteristique: "vol" },
  Sodium: { energieMax: 1 },
  "Sodium Plus": { energieMax: 10 }
};

export function estObjetDeSoin(nom) {
  return nom in EFFETS;
}

/** Applique l'effet sur un seul Pokémon ; renvoie false si rien ne s'est produit (ex. Rappel sur un Pokémon non K.O.). */
async function appliquerSurUnPokemon(effet, pokemon) {
  if (effet.ranime && pokemon.system.vita.value > 0) return false;

  const updates = {};

  if (effet.vitaTotal) updates["system.vita.value"] = pokemon.system.vita.max;
  else if (effet.vitaFraction) updates["system.vita.value"] = Math.max(1, Math.round(pokemon.system.vita.max * effet.vitaFraction));
  else if (effet.vita) updates["system.vita.value"] = Math.min(pokemon.system.vita.max, Math.max(pokemon.system.vita.value, 0) + effet.vita);

  if (effet.energieTotal) updates["system.energie.value"] = pokemon.system.energie.max;
  else if (effet.energie) updates["system.energie.value"] = Math.min(pokemon.system.energie.max, pokemon.system.energie.value + effet.energie);

  if (effet.evVita) updates["system.vita.ev"] = pokemon.system.vita.ev + effet.evVita;
  if (effet.evCaracteristique) {
    const cle = effet.evCaracteristique;
    updates[`system.caracteristiques.${cle}.ev`] = pokemon.system.caracteristiques[cle].ev + 1;
  }
  if (effet.energieMax) updates["system.energie.max"] = pokemon.system.energie.max + effet.energieMax;

  if (Object.keys(updates).length) await pokemon.update(updates);
  if (effet.statuts) for (const cle of effet.statuts) await retirerStatut(pokemon, cle);

  if (effet.ranime) {
    const combattant = game.combat?.combatants.find((c) => c.actor?.uuid === pokemon.uuid);
    if (combattant?.isDefeated) await combattant.update({ defeated: false });
  }

  return true;
}

/**
 * Point d'entrée depuis HKItem#utiliser() : détermine la ou les cibles (soi-même si l'objet est
 * dans l'inventaire d'un Pokémon, choix dans un dialogue si dans celui d'un Dresseur, toute
 * l'équipe active pour Cendresacrée) puis applique l'effet et consomme l'objet.
 */
export async function utiliserObjetDeSoin(objet) {
  const effet = EFFETS[objet.name];
  if (!effet) return null;

  if (objet.system.quantite <= 0) {
    ui.notifications.warn(game.i18n.localize("HK.Soin.PlusStock"));
    return null;
  }

  const proprietaire = objet.actor;
  let cibles = [];

  if (effet.equipeEntiere) {
    cibles = proprietaire.type === "dresseur"
      ? game.actors.filter((a) => a.type === "pokemon" && a.system.dresseur === proprietaire.uuid && a.system.localisation === "equipe")
      : [proprietaire];
  } else if (proprietaire.type === "pokemon") {
    cibles = [proprietaire];
  } else {
    const pokemons = game.actors.filter((a) => a.type === "pokemon" && a.system.dresseur === proprietaire.uuid);
    if (!pokemons.length) {
      ui.notifications.warn(game.i18n.localize("HK.Soin.AucunPokemon"));
      return null;
    }
    const options = pokemons.map((p) => `<option value="${p.uuid}">${p.name}</option>`).join("");
    const resultat = await foundry.applications.api.DialogV2.input({
      window: { title: game.i18n.format("HK.Soin.Titre", { objet: objet.name }) },
      content: `<div class="form-group"><label>${game.i18n.localize("HK.Soin.Cible")}</label><select name="pokemonUuid">${options}</select></div>`
    });
    if (!resultat) return null;
    const cible = await fromUuid(resultat.pokemonUuid);
    if (!cible) return null;
    cibles = [cible];
  }

  let appliqueSurAuMoinsUn = false;
  for (const cible of cibles) {
    const fait = await appliquerSurUnPokemon(effet, cible);
    appliqueSurAuMoinsUn = appliqueSurAuMoinsUn || fait;
  }

  if (!appliqueSurAuMoinsUn) {
    ui.notifications.warn(game.i18n.localize("HK.Soin.SansEffet"));
    return null;
  }

  await objet.update({ "system.quantite": objet.system.quantite - 1 });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: proprietaire }),
    content: `<p>${game.i18n.format("HK.Soin.Utilise", {
      proprietaire: proprietaire.name,
      objet: objet.name,
      cibles: cibles.map((c) => c.name).join(", ")
    })}</p>`
  });

  return true;
}
