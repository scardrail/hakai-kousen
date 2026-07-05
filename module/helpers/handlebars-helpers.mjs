export function registerHandlebarsHelpers() {
  Handlebars.registerHelper("includes", (array, valeur) => Array.isArray(array) && array.includes(valeur));
}
