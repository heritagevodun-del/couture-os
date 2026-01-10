import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// --- 1. CONFIGURATION DU PARTAGE & PWA ---
export const metadata: Metadata = {
  // Le titre dans l'onglet du navigateur
  title: "Atelier CoutureOS",
  // La description pour Google
  description:
    "L'application de gestion complète pour couturiers et stylistes. Clients, Mesures, Commandes et Catalogue.",

  // Ton URL officielle
  metadataBase: new URL("https://couture-os.vercel.app"),

  // Configuration PWA (Le lien vers le fichier que tu vas créer juste après)
  manifest: "/manifest.json",

  // Configuration spécifique Apple (iPhone/iPad)
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CoutureOS",
  },

  // Partage réseaux sociaux (Open Graph)
  openGraph: {
    title: "Atelier CoutureOS 🧵",
    description:
      "Gérez votre atelier de couture simplement : Mesures, Commandes et Catalogue client.",
    images: [
      {
        url: "/icon.png", // Assure-toi d'avoir cette image dans public/
        width: 800,
        height: 800,
        alt: "Logo CoutureOS",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
};

// --- 2. RÉGLAGE DU ZOOM MOBILE & COULEURS ---
export const viewport: Viewport = {
  themeColor: "#000000", // La couleur de la barre du haut sur Android
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Empêche le zoom manuel pour faire "vrai appli"
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
