import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// --- CONFIGURATION DU PARTAGE (SEO & RÉSEAUX SOCIAUX) ---
export const metadata: Metadata = {
  // Le titre dans l'onglet du navigateur
  title: "Atelier CoutureOS",
  // La description pour Google
  description:
    "L'application de gestion complète pour couturiers et stylistes. Clients, Mesures, Commandes et Catalogue.",

  // Ton URL officielle (Indispensable pour que l'image s'affiche sur WhatsApp)
  metadataBase: new URL("https://couture-os.vercel.app"),

  openGraph: {
    title: "Atelier CoutureOS 🧵",
    description:
      "Gérez votre atelier de couture simplement : Mesures, Commandes et Catalogue client.",
    // L'image qui s'affichera lors du partage (ton logo)
    images: [
      {
        url: "/icon.png",
        width: 800,
        height: 800,
        alt: "Logo CoutureOS",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
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
