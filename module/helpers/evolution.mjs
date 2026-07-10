import { HK } from "./config.mjs";

const PACK_POKEDEX = "hakai-kousen.pokedex";

async function indexPokedex() {
  const pack = game.packs.get(PACK_POKEDEX);
  return pack.getIndex({ fields: ["system.evolutions", "system.types"] });
}

function trouverParNom(index, nom) {
  const cible = nom?.trim().toLowerCase();
  if (!cible) return null;
  return index.find((e) => e.name.toLowerCase() === cible) ?? null;
}

/**
 * Vérification automatique (Docs_source ne fournit ni formule ni seuil chiffré pour la plupart de
 * ces conditions : "bonheur" réutilise le seuil de confiance déjà existant faute de mieux). "heure"
 * et "echange" ne sont jamais vérifiables automatiquement (aucune notion de cycle jour/nuit ni de
 * suivi d'échange dans le système) : laissées à la discrétion du MJ (bouton "Forcer").
 */
function estConditionAutoVerifiable(condition, pokemon) {
  switch (condition.type) {
    case "niveau":
      return pokemon.system.niveau >= Number(condition.valeur);
    case "genre":
      return pokemon.system.genre === condition.valeur;
    case "bonheur":
      return pokemon.system.obeissance.confiance >= 6;
    case "objet":
      return (pokemon.system.objetTenu ?? "").toLowerCase().includes(condition.valeur.toLowerCase());
    case "combat":
      return !!game.combat?.combatants.some((c) => c.actor?.uuid === pokemon.uuid);
    default:
      return null; // heure/echange : jamais auto-vérifiable
  }
}

function libelleCondition(condition) {
  const typeLabel = game.i18n.localize(HK.conditionsEvolution[condition.type] ?? condition.type);
  return condition.valeur ? `${typeLabel} ${condition.valeur}` : typeLabel;
}

/**
 * Renvoie les évolutions possibles depuis l'espèce actuelle d'un Pokémon (gabarit Pokédex, cf.
 * tools/scraper/parse-pokedex.mjs), chacune annotée de son éligibilité automatique.
 */
export async function evaluerEvolutions(pokemon) {
  const index = await indexPokedex();
  const gabarit = trouverParNom(index, pokemon.system.espece);
  const evolutions = gabarit?.system?.evolutions ?? [];
  if (!evolutions.length) return [];

  const pierreStaseActive = /pierre\s*stase/i.test(pokemon.system.objetTenu ?? "");

  return evolutions.map((evo) => {
    const conditions = evo.conditions.map((c) => {
      const remplie = estConditionAutoVerifiable(c, pokemon);
      return { ...c, remplie, verifiable: remplie !== null, libelle: libelleCondition(c) };
    });
    const eligible = !pierreStaseActive && conditions.every((c) => c.verifiable && c.remplie);
    const resume = conditions.map((c) => c.libelle).join(" + ");
    return { cible: evo.cible, conditions, eligible, pierreStaseActive, resume };
  });
}

/** Fait évoluer un Pokémon vers l'espèce cible : espèce, types et portrait mis à jour depuis le Pokédex (aucune règle source ne modifie les caractéristiques à l'évolution). */
export async function evoluer(pokemon, cibleNom) {
  const index = await indexPokedex();
  const gabarit = trouverParNom(index, cibleNom);

  const updates = { "system.espece": gabarit?.name ?? cibleNom };
  if (gabarit?.system?.types?.length) updates["system.types"] = gabarit.system.types;
  if (gabarit?.img) updates.img = gabarit.img;

  await pokemon.update(updates);
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: pokemon }),
    content: `<p>${game.i18n.format("HK.Evolution.Reussie", { pokemon: pokemon.name, cible: updates["system.espece"] })}</p>`
  });
}
