import { HK } from "./config.mjs";
import { getJourCourant } from "./entrainement.mjs";
import { rollCompetence } from "../dice/skill-check.mjs";

/**
 * Cuisiner et faire manger un Poffin (Les Super Concours.md, "Les Poffins et l'entraînement de la
 * Condition") : Test de Cuisine du Dresseur, Difficulté 5. En cas de réussite, la Condition du
 * Pokémon monte (max 5) dans la catégorie nourrie par la Saveur (HK.goutCategorieConcours) : +2 si
 * c'est le Goût Préféré de sa Nature, +0 (et refus) si c'est son Goût Détesté, +1 sinon. Un seul
 * Poffin par jour et par Pokémon, même mécanique que dernierJourConfiance/dernierJourDressage
 * (module/helpers/entrainement.mjs).
 */
export async function nourrirPoffin(dresseur, pokemon, saveur) {
  const jourCourant = getJourCourant();
  if (pokemon.system.concours.dernierJourPoffin === jourCourant) {
    return { ok: false, motif: "HK.Concours.Poffin.DejaMangeAujourdhui" };
  }

  const itemCuisine = dresseur?.items.find((i) => i.type === "competence" && i.name.trim().toLowerCase() === "cuisine");
  if (!itemCuisine) return { ok: false, motif: "HK.Concours.Poffin.CuisineIntrouvable" };

  const { succes } = await rollCompetence(dresseur, itemCuisine, { difficulte: 5 });
  await pokemon.update({ "system.concours.dernierJourPoffin": jourCourant });
  if (!succes) return { ok: false, motif: "HK.Concours.Poffin.Rate" };

  const categorie = HK.goutCategorieConcours[saveur];
  const nature = HK.natures[pokemon.system.nature];
  let gain = 1;
  if (nature?.gouteDeteste === saveur) gain = 0;
  else if (nature?.gouteAime === saveur) gain = 2;

  const conditionActuelle = pokemon.system.concours.condition[categorie];
  const nouvelleCondition = Math.min(5, conditionActuelle + gain);
  await pokemon.update({ [`system.concours.condition.${categorie}`]: nouvelleCondition });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: dresseur }),
    content: `<p>${game.i18n.format("HK.Concours.Poffin.Resultat", {
      dresseur: dresseur.name,
      pokemon: pokemon.name,
      categorie: game.i18n.localize(HK.categoriesConcours[categorie]),
      gain
    })}</p>`
  });

  return { ok: true, categorie, gain };
}

/**
 * Les Super Concours.md, "Organisation d'un Concours" : un rang ne peut être visé que si le Ruban
 * du rang précédent dans la même catégorie est déjà obtenu (Normal n'a aucun prérequis).
 */
export function rangConcoursDisponible(pokemon, categorie, rang) {
  const precedent = HK.rangsConcours[rang]?.precedent;
  if (!precedent) return true;
  return pokemon.system.concours.rubans.some((r) => r.categorie === categorie && r.rang === precedent);
}
