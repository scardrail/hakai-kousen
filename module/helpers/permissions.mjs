/**
 * Pour les effets de bord de combat (statuts, météo, KO) : plusieurs clients sont connectés en
 * même temps et déclenchent tous les mêmes hooks (updateCombat, updateActor...), mais un seul doit
 * exécuter l'effet (sinon dégâts/messages de chat dupliqués). `activeGM` est le mécanisme prévu par
 * Foundry pour ça.
 */
export function isActiveGM() {
  return game.users.activeGM?.id === game.user.id;
}
