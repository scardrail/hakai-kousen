import { getEfficacite } from "../helpers/type-chart.mjs";
import { HK } from "../helpers/config.mjs";

/**
 * Calcule les dégâts d'une attaque (Les combats.md, "Dégâts d'une capacité") :
 * base -> STAB (x1,5 arrondi bas) -> bonus objets/capacités -> météo -> efficacité de type -> x2 si critique.
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

  if (critique) total *= 2;

  return { total: Math.max(0, total), stab, efficacite };
}
