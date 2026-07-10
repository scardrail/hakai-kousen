/**
 * Apprentissage d'une attaque via une CT/CS (Objets_liste.md, "Les CT/CS ne se revendent pas").
 * Aucune règle source ne documente de plafond au nombre d'attaques connues par un Pokémon
 * (Pour déterminer aléatoirement les stats des Pokemon.md en fait même une variable aléatoire
 * 1D6-1D10 à la capture) : on ajoute donc l'attaque sans rien retirer. La compatibilité
 * espèce/CT n'est documentée nulle part non plus (seule l'élevage en parle, sans liste) — laissée
 * à l'appréciation du MJ, rappelée dans le message de tchat plutôt que bloquée en code.
 */
export async function enseignerCt(ctItem) {
  const dresseur = ctItem.actor;
  if (!dresseur) return null;

  const pokemons = game.actors.filter((a) => a.type === "pokemon" && a.system.dresseur === dresseur.uuid);
  if (!pokemons.length) {
    ui.notifications.warn(game.i18n.localize("HK.CT.AucunPokemon"));
    return null;
  }

  const nomAttaque = ctItem.system.attaqueEnseignee?.trim();
  if (!nomAttaque) {
    ui.notifications.warn(game.i18n.localize("HK.CT.AucuneAttaqueDefinie"));
    return null;
  }

  const options = pokemons.map((p) => `<option value="${p.uuid}">${p.name}</option>`).join("");
  const resultat = await foundry.applications.api.DialogV2.input({
    window: { title: game.i18n.format("HK.CT.Titre", { attaque: nomAttaque }) },
    content: `
      <div class="form-group">
        <label>${game.i18n.localize("HK.CT.Pokemon")}</label>
        <select name="pokemonUuid">${options}</select>
      </div>
    `
  });
  if (!resultat) return null;

  const pokemon = await fromUuid(resultat.pokemonUuid);
  if (!pokemon) return null;

  const dejaConnue = pokemon.items.some((i) => i.type === "attaque" && i.name.toLowerCase() === nomAttaque.toLowerCase());
  if (dejaConnue) {
    ui.notifications.warn(game.i18n.format("HK.CT.DejaConnue", { pokemon: pokemon.name, attaque: nomAttaque }));
    return null;
  }

  const pack = game.packs.get("hakai-kousen.attaques");
  const index = await pack.getIndex();
  const cible = nomAttaque.toLowerCase();
  const entree = index.find((e) => e.name.toLowerCase() === cible);

  let donneesAttaque;
  if (entree) {
    const source = await pack.getDocument(entree._id);
    donneesAttaque = source.toObject();
    delete donneesAttaque._id;
  } else {
    donneesAttaque = { name: nomAttaque, type: "attaque" };
    ui.notifications.warn(game.i18n.format("HK.CT.AttaqueIntrouvable", { attaque: nomAttaque }));
  }

  await pokemon.createEmbeddedDocuments("Item", [donneesAttaque]);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: dresseur }),
    content: `<p>${game.i18n.format("HK.CT.Apprise", { pokemon: pokemon.name, attaque: nomAttaque })}</p>`
  });

  if (ctItem.system.usageUnique) await ctItem.delete();

  return pokemon;
}
