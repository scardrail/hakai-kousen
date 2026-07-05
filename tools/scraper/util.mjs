export function safeFilename(name) {
  return name.replace(/[/\\:*?"<>|]/g, "_");
}

/** Le site affiche les noms en `text-transform: capitalize` (CSS) mais le HTML brut est en
 * minuscules ("bulbizarre", "jet-pierres") : on reproduit la capitalisation nous-mêmes. */
export function capitalizeName(raw) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/(^|[\s\-(])(\p{L})/gu, (_, sep, lettre) => sep + lettre.toUpperCase());
}
