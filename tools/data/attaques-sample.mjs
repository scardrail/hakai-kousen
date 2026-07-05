/**
 * Échantillon d'attaques pour tester le moteur de combat (Phase 1).
 * "source" documente la provenance de chaque valeur :
 *  - "Docs_source" : chiffre donné explicitement dans les règles communautaires.
 *  - "hakaikousen.fr" : relevé sur le Dex en ligne (via récupération de page, non un scrape brut).
 *  - "standard" : valeur Pokémon canonique reprise en attendant les chiffres officiels HK
 *    (aucune donnée HK-spécifique trouvée dans Docs_source pour cette attaque).
 */
export const ATTAQUES_SAMPLE = [
  {
    name: "Griffe",
    system: {
      type: "normal",
      categorie: "physique",
      portee: "cible",
      energie: 0,
      precision: 100,
      degats: 4,
      effets:
        "<p>Précision 100% confirmée par l'exemple de Créer un Pokémon.md (Salamèche vs Rattata). Dégâts de base (4) repris de la valeur standard Pokémon (Griffe/Scratch), non retrouvés dans Docs_source.</p>"
    }
  },
  {
    name: "Flammèche",
    system: {
      type: "feu",
      categorie: "speciale",
      portee: "cible",
      energie: 2,
      precision: 100,
      degats: 4,
      statut: { type: "brulure", chance: 10 },
      effets: "<p>Valeurs standard Pokémon (Flammèche/Ember) reprises en attendant les chiffres officiels Hakaï Kōsen.</p>"
    }
  },
  {
    name: "Charge",
    system: {
      type: "normal",
      categorie: "physique",
      portee: "cible",
      energie: 0,
      precision: 100,
      degats: 6,
      effets: "<p>Dégâts de base (6) confirmés par l'exemple chiffré des combats (Les combats.md).</p>"
    }
  },
  {
    name: "Grincement",
    system: {
      type: "normal",
      categorie: "autre",
      portee: "cible",
      energie: 0,
      precision: 85,
      modifStats: [{ caracteristique: "end", valeur: -2, cible: "cible" }],
      effets: "<p>Exemple entièrement chiffré des combats (Les combats.md) : 85% de précision, -2 en Endurance à la cible.</p>"
    }
  },
  {
    name: "Hydrocanon",
    system: {
      type: "eau",
      categorie: "speciale",
      portee: "cible",
      energie: 6,
      precision: 80,
      degats: 20,
      effets:
        "<p>Précision de 80% confirmée par Système de jeu.md. Dégâts (20) repris de la valeur standard Pokémon (Hydrocanon/Hydro Pump), non retrouvés dans Docs_source.</p>"
    }
  },
  {
    name: "Ultralaser",
    system: {
      type: "normal",
      categorie: "speciale",
      portee: "rayon",
      energie: 6,
      precision: 90,
      degats: 15,
      effets: "<p>Exemple entièrement chiffré de Créer un Pokémon.md : le lanceur doit se reposer au tour suivant (à gérer manuellement pour l'instant).</p>"
    }
  },
  {
    name: "Lance-Flammes",
    system: {
      type: "feu",
      categorie: "speciale",
      portee: "rayon",
      energie: 3,
      precision: 100,
      degats: 9,
      statut: { type: "brulure", chance: 10 },
      effets: "<p>Relevé sur hakaikousen.fr/attaque : 10% de chance de brûler la cible.</p>"
    }
  },
  {
    name: "Jet-Pierres",
    system: {
      type: "roche",
      categorie: "physique",
      portee: "cible",
      energie: 1,
      precision: 90,
      degats: 5,
      effets: "<p>Citée dans Système de jeu.md (Onix). Valeurs standard Pokémon (Jet-Pierres/Rock Throw) reprises en attendant les chiffres officiels.</p>"
    }
  }
];
