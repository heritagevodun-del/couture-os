import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// --- 1. CONFIGURATION DU PARTAGE & PWA ---
export const metadata: Metadata = {
  // URL Officielle (Très important pour le SEO Google)
  metadataBase: new URL("https://coutureos.com"),

  // Titre Intelligent : Affiche "CoutureOS" par défaut, ou "Page | CoutureOS"
  title: {
    default: "CoutureOS - L'Application pour Couturiers Pro",
    template: "%s | CoutureOS",
  },

  // Description pour Google et les réseaux sociaux
  description:
    "Gérez votre atelier de couture comme un pro. Clients, Mesures, Commandes et Catalogue. Disponible sur Mobile et PC.",

  // Mots-clés pour le référencement
  keywords: [
    "Couture",
    "Atelier",
    "Gestion",
    "Mesures",
    "Styliste",
    "Bénin",
    "Mode",
    "App",
  ],

  // Configuration PWA
  manifest: "/manifest.json",

  // Configuration Apple (iPhone/iPad)
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CoutureOS",
  },

  // Apparence lors du partage (WhatsApp, Facebook, LinkedIn...)
  openGraph: {
    title: "CoutureOS 🧵",
    description:
      "Gérez votre atelier simplement : Mesures, Commandes et Catalogue.",
    url: "https://coutureos.com",
    siteName: "CoutureOS",
    images: [
      {
        url: "/icon-512.png", // On utilise ton image HD générée
        width: 512,
        height: 512,
        alt: "Logo CoutureOS - Gestion Atelier",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
};

// --- 2. RÉGLAGE DU ZOOM MOBILE & COULEURS ---
export const viewport: Viewport = {
  themeColor: "#000000", // Noir Luxe pour la barre de statut mobile
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Bloque le zoom pour l'effet "Application Native"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
