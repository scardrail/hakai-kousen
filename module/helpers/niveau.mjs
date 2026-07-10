import { isActiveGM } from "./permissions.mjs";

const PACK_POKEDEX = "hakai-kousen.pokedex";
const PACK_ATTAQUES = "hakai-kousen.attaques";

/**
 * Coût en XP pour passer du niveau actuel au suivant. "Le Développement du Pokémon" (Créer un
 * Pokémon.md) est explicitement marqué "À faire" dans les sources : aucune formule officielle
 * n'existe. Choix de campagne (phase mécaniques de jeu) : réutilise l'unité déjà en place (1 XP
 * Dresseur = 50 XP Pokémon, Phase 7 entrainement.mjs), avec un coût croissant par niveau.
 */
export function coutProchainNiveau(niveau) {
  return 50 * niveau;
}

function trouverParNom(index, nom) {
  const cible = nom?.trim().toLowerCase();
  if (!cible) return null;
  return index.find((e) => e.name.toLowerCase() === cible) ?? null;
}

/**
 * Fait franchir à un Pokémon tous les niveaux que son XP en banque permet (en boucle, pour
 * absorber un gros gain d'XP d'un coup) : system.xp n'est pas un total cumulé depuis la création
 * mais l'XP en banque vers le PROCHAIN niveau (évite toute incohérence avec un niveau fixé à la
 * main en création/capture). +1 point de compétence à distribuer par niveau gagné (choix
 * utilisateur, aucune règle source). Les nouvelles capacités du palier sont apprises
 * automatiquement, sans jamais rien retirer (choix déjà pris pour les CT : pas de plafond au
 * nombre d'attaques connues).
 */
export async function verifierMonteeNiveau(pokemon) {
  let niveau = pokemon.system.niveau;
  let xp = pokemon.system.xp;
  const niveauxFranchis = [];

  let cout = coutProchainNiveau(niveau);
  while (xp >= cout) {
    xp -= cout;
    niveau += 1;
    niveauxFranchis.push(niveau);
    cout = coutProchainNiveau(niveau);
  }
  if (!niveauxFranchis.length) return;

  const packPokedex = game.packs.get(PACK_POKEDEX);
  const indexPokedex = await packPokedex.getIndex({ fields: ["system.movepoolNiveau"] });
  const gabarit = trouverParNom(indexPokedex, pokemon.system.espece);
  const movepool = gabarit?.system?.movepoolNiveau ?? [];

  const connues = new Set(pokemon.items.filter((i) => i.type === "attaque").map((i) => i.name.toLowerCase()));
  const nouvelles = [...new Set(movepool.filter((m) => niveauxFranchis.includes(m.niveau)).map((m) => m.attaque))].filter(
    (nom) => !connues.has(nom.toLowerCase())
  );

  await pokemon.update({
    "system.niveau": niveau,
    "system.xp": xp,
    "system.pointsCompetence": pokemon.system.pointsCompetence + niveauxFranchis.length
  });

  if (nouvelles.length) {
    const packAttaques = game.packs.get(PACK_ATTAQUES);
    const indexAttaques = await packAttaques.getIndex();
    const itemsACreer = [];
    for (const nom of nouvelles) {
      const entree = trouverParNom(indexAttaques, nom);
      if (!entree) continue;
      const doc = await packAttaques.getDocument(entree._id);
      const data = doc.toObject();
      delete data._id;
      itemsACreer.push(data);
    }
    if (itemsACreer.length) await pokemon.createEmbeddedDocuments("Item", itemsACreer);
  }

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: pokemon }),
    content:
      `<p>${game.i18n.format("HK.Niveau.Monte", { pokemon: pokemon.name, niveau })}</p>` +
      (nouvelles.length ? `<p>${game.i18n.format("HK.Niveau.NouvellesCapacites", { attaques: nouvelles.join(", ") })}</p>` : "")
  });
}

export function registerNiveauHooks() {
  Hooks.on("updateActor", async (actor, changed) => {
    if (!isActiveGM()) return;
    if (actor.type !== "pokemon") return;
    if (foundry.utils.getProperty(changed, "system.xp") === undefined) return;
    await verifierMonteeNiveau(actor);
  });
}
