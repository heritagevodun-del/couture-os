// --- TYPES STRICTS POUR LA FACTURATION ---
export type PricingZone = {
  priceId: string;
  amount: string;
  currency: string;
  period: string;
  label: string;
};

export type PlanInfo = {
  key: string;
  title: string;
  description: string;
  features: string[];
  pricing: {
    africa: PricingZone;
    world: PricingZone;
  };
};

// --- CONFIGURATION DES ABONNEMENTS ---
export const SUBSCRIPTION_PLANS: Record<string, PlanInfo> = {
  PREMIUM: {
    key: "pro", // 👈 Aligné avec les métadonnées de la DB
    title: "Couture OS Pro",
    description:
      "L'outil numérique ultime pour propulser votre atelier de création.",
    features: [
      "Carnet d'adresses & clients illimités",
      "Prise de mensurations haute précision",
      "Gestion des commandes de bout en bout",
      "Génération de factures PDF professionnelles",
      "Notifications clients automatisées via WhatsApp",
      "Sauvegarde cloud sécurisée & Galerie privée",
    ],
    pricing: {
      africa: {
        // ID Stripe Live pour la zone Afrique
        priceId: "price_1SzGr7EQ6UKEvtgm1uBmoR9R",
        amount: "2 000",
        currency: "FCFA",
        period: "/mois",
        label: "Zone Afrique",
      },
      world: {
        // ID Stripe Live pour l'International
        priceId: "price_1SzGtVEQ6UKEvtgmI1ZtuvDw",
        amount: "9,99",
        currency: "€",
        period: "/mois",
        label: "International",
      },
    },
  },
};
