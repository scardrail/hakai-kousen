import { getEfficacite } from "../helpers/type-chart.mjs";
import { HK } from "../helpers/config.mjs";

/**
 * Objets_liste.md, baies de résistance : divise par 2 les dégâts d'une attaque super efficace du
 * type visé. Seul sous-ensemble d'objets tenus à effet chiffré dans les sources (les objets
 * "montant la puissance" d'un type, les Choix, Orbes, Griffe Rasoir... n'ont aucun pourcentage
 * précisé nulle part) : les autres catégories d'objet tenu restent donc en texte libre.
 */
const BAIES_RESISTANCE = {
  "Baie Pocpoc": "eau",
  "Baie Parma": "electrik",
  "Baie Ratam": "plante",
  "Baie Nanone": "glace",
  "Baie Pomroz": "combat",
  "Baie Kébia": "poison",
  "Baie Jouca": "sol",
  "Baie Cobaba": "vol",
  "Baie Yapap": "psy",
  "Baie Panga": "insecte",
  "Baie Charti": "roche",
  "Baie Sédra": "spectre",
  "Baie Fraigo": "dragon",
  "Baie Lampou": "tenebres",
  "Baie Babiri": "acier",
  "Baie Selro": "fee"
};

/**
 * Calcule les dégâts d'une attaque (Les combats.md, "Dégâts d'une capacité") :
 * base -> STAB (x1,5 arrondi bas) -> bonus objets/capacités -> météo -> efficacité de type -> baie
 * de résistance éventuelle -> x2 si critique.
 */
export function calculerDegats({ attaquant, cible, attaqueItem, critique = false, meteo = "aucune", bonusFixe = 0 }) {
  const type = attaqueItem.system.type;
  let total = attaqueItem.system.degats ?? 0;

  const stab = (attaquant.system.types ?? []).includes(type);
  if (stab) total = Math.floor(total * 1.5);

  total += bonusFixe;

  const multMeteo = HK.meteos[meteo]?.multiplicateurs?.[type];
  if (multMeteo) total = Math.floor(total * multMeteo);

  const efficacite = getEfficacite(type, cible.system.types ?? []);
  total = Math.floor(total * efficacite);

  // Baie Zalis : 1re attaque de type Normal encaissée, quelle que soit l'efficacité. Les autres
  // baies de résistance ne s'appliquent qu'aux attaques super efficaces de leur type.
  let baieDeclenchee = null;
  const objetTenu = cible.system.objetTenu;
  if (objetTenu === "Baie Zalis" && type === "normal") {
    total = Math.floor(total / 2);
    baieDeclenchee = objetTenu;
  } else if (BAIES_RESISTANCE[objetTenu] === type && efficacite > 1) {
    total = Math.floor(total / 2);
    baieDeclenchee = objetTenu;
  }

  if (critique) total *= 2;

  return { total: Math.max(0, total), stab, efficacite, baieDeclenchee };
}
