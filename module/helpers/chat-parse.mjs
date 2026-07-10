/**
 * Le champ de tchat (ProseMirror) envoie du HTML au hook "chatMessage" (ex. "<p>/meteo pluie</p>"),
 * pas du texte brut : on en extrait le texte comme le fait le parseur de commandes de Foundry
 * lui-même (ChatLog.parse), sans quoi une regex de commande ne matche jamais.
 */
export function texteBrut(message) {
  const template = document.createElement("template");
  template.innerHTML = message;
  template.content.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
  return template.content.textContent.trim();
}
