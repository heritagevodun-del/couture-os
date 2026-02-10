// Fichier : app/constants/plans.ts

export const SUBSCRIPTION_PLANS = {
  PREMIUM: {
    key: "premium",
    title: "CoutureOS Premium",
    description: "La solution complète pour gérer votre atelier.",
    features: [
      "Clients & Commandes illimités",
      "Galerie photos & Mesures complètes",
      "Sauvegarde sécurisée Cloud",
      "Factures PDF & WhatsApp",
    ],
    pricing: {
      africa: {
        // 👇 COLLE TON ID STRIPE LIVE POUR L'AFRIQUE ICI (ex: price_1P...)
        priceId: "price_1SzGr7EQ6UKEvtgm1uBmoR9R",
        amount: "2 000",
        currency: "FCFA",
        period: "/mois",
        label: "Zone Afrique",
      },
      world: {
        // 👇 COLLE TON ID STRIPE LIVE INTERNATIONAL ICI (ex: price_1P...)
        priceId: "price_1SzGtVEQ6UKEvtgmI1ZtuvDw",
        amount: "9,99",
        currency: "€",
        period: "/mois",
        label: "International",
      },
    },
  },
};
