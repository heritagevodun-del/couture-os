// --- DÉFINITIONS DES TYPES ---

export type MeasurementField = {
  id: string; // Clé BDD (ex: 'tour_taille')
  label: string; // Affichage UI (ex: 'Tour de Taille')
  unit: string; // 🛡️ Rendu obligatoire pour anticiper l'internationalisation
};

export type MeasurementTemplate = {
  id: string;
  label: string; // Nom du gabarit
  fields: MeasurementField[];
};

// --- LA BIBLIOTHÈQUE DES GABARITS MONDIAUX ---

export const MEASUREMENT_TEMPLATES: MeasurementTemplate[] = [
  {
    id: "femme_standard",
    label: "Femme - Standard (Robe/Jupe)",
    fields: [
      { id: "epaule", label: "Épaule à Épaule", unit: "cm" },
      { id: "poitrine", label: "Tour de Poitrine", unit: "cm" },
      { id: "hauteur_poitrine", label: "Hauteur Poitrine", unit: "cm" }, // ✅ Ajout Pro
      { id: "ecart_poitrine", label: "Écart Poitrine", unit: "cm" }, // ✅ Ajout Pro
      { id: "taille", label: "Tour de Taille", unit: "cm" },
      { id: "hanches", label: "Tour de Hanches", unit: "cm" },
      { id: "longueur_robe", label: "Longueur Totale", unit: "cm" },
      { id: "longueur_manche", label: "Longueur Manche", unit: "cm" },
      { id: "tour_bras", label: "Tour de Bras", unit: "cm" },
    ],
  },
  {
    id: "homme_costume",
    label: "Homme - Costume / Chemise",
    fields: [
      { id: "col", label: "Tour de Cou", unit: "cm" },
      { id: "carrure_dos", label: "Carrure Dos", unit: "cm" },
      { id: "poitrine", label: "Tour de Poitrine", unit: "cm" },
      { id: "ventre", label: "Tour de Ventre", unit: "cm" },
      { id: "longueur_veste", label: "Longueur Veste", unit: "cm" },
      { id: "longueur_manche", label: "Longueur Manche", unit: "cm" },
      { id: "ceinture", label: "Ceinture Pantalon", unit: "cm" },
      { id: "cuisse", label: "Tour de Cuisse", unit: "cm" }, // ✅ Ajout Pro
      { id: "longueur_jambe", label: "Longueur Pantalon", unit: "cm" },
    ],
  },
  {
    id: "afrique_femme",
    label: "Afrique Femme - Boubou / Pagne",
    fields: [
      { id: "dos", label: "Largeur Dos", unit: "cm" },
      { id: "poitrine", label: "Tour de Poitrine", unit: "cm" }, // ✅ Souvent nécessaire même en boubou
      { id: "longueur_boubou", label: "Longueur Boubou", unit: "cm" },
      { id: "taille_pagne", label: "Tour Taille Pagne", unit: "cm" },
      { id: "bassin_pagne", label: "Tour Bassin Pagne", unit: "cm" },
      { id: "longueur_pagne", label: "Longueur Pagne/Jupe", unit: "cm" },
      { id: "profondeur_encolure", label: "Profondeur Encolure", unit: "cm" },
      { id: "fente", label: "Hauteur Fente", unit: "cm" },
    ],
  },
  {
    id: "afrique_homme",
    label: "Afrique Homme - Agbada / Tunique",
    fields: [
      { id: "envergure", label: "Envergure (Grand Boubou)", unit: "cm" },
      { id: "longueur_caftan", label: "Longueur Caftan", unit: "cm" },
      { id: "encolure", label: "Tour Encolure", unit: "cm" },
      { id: "poitrine", label: "Tour de Poitrine", unit: "cm" }, // ✅ Toujours utile
      { id: "poignet", label: "Tour Poignet", unit: "cm" },
      { id: "ceinture", label: "Ceinture Pantalon", unit: "cm" },
      { id: "cuisse", label: "Largeur Cuisse", unit: "cm" },
      { id: "longueur_pantalon", label: "Longueur Pantalon", unit: "cm" },
    ],
  },
  {
    id: "enfant",
    label: "Enfant (Mixte)",
    fields: [
      { id: "stature", label: "Hauteur Totale (Stature)", unit: "cm" },
      { id: "poitrine", label: "Tour de Poitrine", unit: "cm" },
      { id: "taille", label: "Tour de Taille", unit: "cm" },
      { id: "longueur_dos", label: "Longueur Dos", unit: "cm" },
      { id: "longueur_vetement", label: "Longueur Vêtement", unit: "cm" },
    ],
  },
];
