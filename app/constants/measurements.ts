// --- DÉFINITIONS DES TYPES (Pour la rigueur du code) ---

export type MeasurementField = {
  id: string; // La clé qui sera sauvée en base (ex: 'tour_taille')
  label: string; // Ce que l'utilisateur voit (ex: 'Tour de Taille')
  unit?: string; // cm, pouces, etc.
};

export type MeasurementTemplate = {
  id: string;
  label: string; // Le nom du gabarit dans la liste déroulante
  icon: string; // Une petite icône pour faire joli
  fields: MeasurementField[];
};

// --- LA BIBLIOTHÈQUE DES GABARITS MONDIAUX ---

export const MEASUREMENT_TEMPLATES: MeasurementTemplate[] = [
  {
    id: "femme_standard",
    label: "Femme - Standard (Robe/Jupe)",
    icon: "👩",
    fields: [
      { id: "epaule", label: "Épaule à Épaule" },
      { id: "poitrine", label: "Tour de Poitrine" },
      { id: "taille", label: "Tour de Taille" },
      { id: "hanches", label: "Tour de Hanches" },
      { id: "longueur_robe", label: "Longueur Totale Robe" },
      { id: "longueur_manche", label: "Longueur Manche" },
      { id: "tour_bras", label: "Tour de Bras" },
    ],
  },
  {
    id: "homme_costume",
    label: "Homme - Costume / Chemise",
    icon: "👨",
    fields: [
      { id: "col", label: "Tour de Cou" },
      { id: "carrure_dos", label: "Carrure Dos" },
      { id: "poitrine", label: "Tour de Poitrine" },
      { id: "ventre", label: "Tour de Ventre" },
      { id: "longueur_veste", label: "Longueur Veste" },
      { id: "longueur_manche", label: "Longueur Manche" },
      { id: "ceinture", label: "Ceinture Pantalon" },
      { id: "longueur_jambe", label: "Longueur Pantalon" },
    ],
  },
  {
    id: "afrique_femme",
    label: "Afrique Femme - Boubou / Pagne",
    icon: "🌍",
    fields: [
      { id: "dos", label: "Largeur Dos" },
      { id: "longueur_boubou", label: "Longueur Boubou" },
      { id: "taille_pagne", label: "Tour Taille Pagne" },
      { id: "bassin_pagne", label: "Tour Bassin Pagne" },
      { id: "longueur_pagne", label: "Longueur Pagne/Jupe" },
      { id: "profondeur_encolure", label: "Profondeur Encolure" },
      { id: "fente", label: "Hauteur Fente" },
    ],
  },
  {
    id: "afrique_homme",
    label: "Afrique Homme - Agbada / Tunique",
    icon: "🌍",
    fields: [
      { id: "envergure", label: "Envergure (Grand Boubou)" },
      { id: "longueur_caftan", label: "Longueur Caftan" },
      { id: "encolure", label: "Tour Encolure" },
      { id: "poignet", label: "Tour Poignet" },
      { id: "cuisse", label: "Largeur Cuisse (Pantalon)" },
      { id: "longueur_pantalon", label: "Longueur Pantalon" },
    ],
  },
  {
    id: "enfant",
    label: "Enfant (Mixte)",
    icon: "👶",
    fields: [
      { id: "stature", label: "Hauteur Totale (Stature)" },
      { id: "poitrine", label: "Tour de Poitrine" },
      { id: "taille", label: "Tour de Taille" },
      { id: "longueur_dos", label: "Longueur Dos" },
      { id: "longueur_vetement", label: "Longueur Vêtement" },
    ],
  },
];
