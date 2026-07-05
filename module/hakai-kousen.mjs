import { HK } from "./helpers/config.mjs";
import DresseurDataModel from "./data-models/actor-dresseur.mjs";
import PokemonDataModel from "./data-models/actor-pokemon.mjs";
import AttaqueDataModel from "./data-models/items/attaque.mjs";
import TalentDataModel from "./data-models/items/talent.mjs";
import CompetenceDataModel from "./data-models/items/competence.mjs";
import ConnaissanceDataModel from "./data-models/items/connaissance.mjs";
import SpecialisationDataModel from "./data-models/items/specialisation.mjs";
import ObjetDataModel from "./data-models/items/objet.mjs";
import CtDataModel from "./data-models/items/ct.mjs";
import ArmeDataModel from "./data-models/items/arme.mjs";
import HKActor from "./documents/hk-actor.mjs";
import HKItem from "./documents/hk-item.mjs";
import DresseurSheet from "./sheets/dresseur-sheet.mjs";
import PokemonSheet from "./sheets/pokemon-sheet.mjs";
import HKItemSheet from "./sheets/item-sheet.mjs";
import { registerCombatHooks } from "./combat/status-effects.mjs";
import { registerMeteoHooks } from "./combat/meteo.mjs";
import { registerKoHooks } from "./combat/ko.mjs";
import { registerHandlebarsHelpers } from "./helpers/handlebars-helpers.mjs";

Hooks.once("init", () => {
  console.log("Hakaï Kōsen | Initialisation du système");

  CONFIG.HK = HK;

  CONFIG.Actor.documentClass = HKActor;
  CONFIG.Item.documentClass = HKItem;

  CONFIG.Actor.dataModels.dresseur = DresseurDataModel;
  CONFIG.Actor.dataModels.pokemon = PokemonDataModel;

  CONFIG.Item.dataModels.attaque = AttaqueDataModel;
  CONFIG.Item.dataModels.talent = TalentDataModel;
  CONFIG.Item.dataModels.competence = CompetenceDataModel;
  CONFIG.Item.dataModels.connaissance = ConnaissanceDataModel;
  CONFIG.Item.dataModels.specialisation = SpecialisationDataModel;
  CONFIG.Item.dataModels.objet = ObjetDataModel;
  CONFIG.Item.dataModels.ct = CtDataModel;
  CONFIG.Item.dataModels.arme = ArmeDataModel;

  // Initiative par Pokémon (Les combats.md) : 1d10 + DEX, valable aussi pour un Dresseur seul.
  CONFIG.Combat.initiative = { formula: "1d10 + @caracteristiques.dex.total", decimals: 0 };

  const { Actors, Items } = foundry.documents.collections;

  Actors.unregisterSheet("core", foundry.appv1.sheets.ActorSheet);
  Actors.registerSheet("hakai-kousen", DresseurSheet, { types: ["dresseur"], makeDefault: true, label: "TYPES.Actor.dresseur" });
  Actors.registerSheet("hakai-kousen", PokemonSheet, { types: ["pokemon"], makeDefault: true, label: "TYPES.Actor.pokemon" });

  Items.unregisterSheet("core", foundry.appv1.sheets.ItemSheet);
  Items.registerSheet("hakai-kousen", HKItemSheet, { makeDefault: true });

  registerCombatHooks();
  registerMeteoHooks();
  registerKoHooks();
  registerHandlebarsHelpers();
});

Hooks.once("ready", () => {
  console.log("Hakaï Kōsen | Système prêt");
});
