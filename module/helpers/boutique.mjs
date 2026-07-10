/**
 * Boutique (Objets_liste.md) : achat d'Objets/CT-CS/Armes depuis les compendiums correspondants,
 * au prix indiqué sur chaque fiche, débité de system.argent du Dresseur. Le CT/l'objet/l'arme
 * acheté est copié tel quel comme Item embarqué (les objets déjà possédés voient simplement leur
 * quantité incrémentée plutôt que de dupliquer une ligne).
 */
const PACKS = {
  objet: "hakai-kousen.objets",
  ct: "hakai-kousen.ct",
  arme: "hakai-kousen.armes"
};

export async function ouvrirBoutique(dresseur) {
  const optionsCategorie = Object.keys(PACKS)
    .map((cle) => `<option value="${cle}">${game.i18n.localize(`TYPES.Item.${cle}`)}</option>`)
    .join("");

  const choixCategorie = await foundry.applications.api.DialogV2.input({
    window: { title: game.i18n.localize("HK.Boutique.Titre") },
    content: `
      <div class="form-group">
        <label>${game.i18n.localize("HK.Boutique.Categorie")}</label>
        <select name="categorie">${optionsCategorie}</select>
      </div>
    `
  });
  if (!choixCategorie) return null;

  const pack = game.packs.get(PACKS[choixCategorie.categorie]);
  const index = await pack.getIndex({ fields: ["system.prix"] });
  const articles = index.map((e) => e).sort((a, b) => a.name.localeCompare(b.name));

  const optionsArticles = articles.map((e) => `<option value="${e._id}">${e.name} — ${e.system?.prix ?? 0}</option>`).join("");
  const choixArticle = await foundry.applications.api.DialogV2.input({
    window: { title: game.i18n.format("HK.Boutique.TitreArticle", { argent: dresseur.system.argent }) },
    content: `
      <div class="form-group">
        <label>${game.i18n.localize("HK.Boutique.Article")}</label>
        <select name="itemId">${optionsArticles}</select>
      </div>
    `
  });
  if (!choixArticle) return null;

  const entree = articles.find((e) => e._id === choixArticle.itemId);
  if (!entree) return null;
  const prix = entree.system?.prix ?? 0;

  if (dresseur.system.argent < prix) {
    ui.notifications.warn(game.i18n.localize("HK.Boutique.ArgentInsuffisant"));
    return null;
  }

  const source = await pack.getDocument(entree._id);

  if (choixCategorie.categorie === "objet") {
    const existant = dresseur.items.find((i) => i.type === "objet" && i.name === source.name);
    if (existant) {
      await existant.update({ "system.quantite": existant.system.quantite + 1 });
    } else {
      const data = source.toObject();
      delete data._id;
      await dresseur.createEmbeddedDocuments("Item", [data]);
    }
  } else {
    const data = source.toObject();
    delete data._id;
    await dresseur.createEmbeddedDocuments("Item", [data]);
  }

  await dresseur.update({ "system.argent": dresseur.system.argent - prix });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: dresseur }),
    content: `<p>${game.i18n.format("HK.Boutique.Achat", { dresseur: dresseur.name, article: source.name, prix })}</p>`
  });

  return true;
}
