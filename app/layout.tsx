import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"; // ✅ Ajout Import

const inter = Inter({ subsets: ["latin"] });

// --- 1. CONFIGURATION DU PARTAGE & PWA (Ton code original préservé) ---
export const metadata: Metadata = {
  // URL Officielle (Très important pour le SEO Google)
  metadataBase: new URL("https://coutureos.com"),

  // Titre Intelligent
  title: {
    default: "CoutureOS - L'Application pour Couturiers Pro",
    template: "%s | CoutureOS",
  },

  // Description
  description:
    "Gérez votre atelier de couture comme un pro. Clients, Mesures, Commandes et Catalogue. Disponible sur Mobile et PC.",

  // Mots-clés
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

  // Configuration Apple
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CoutureOS",
  },

  // Apparence OpenGraph
  openGraph: {
    title: "CoutureOS 🧵",
    description:
      "Gérez votre atelier simplement : Mesures, Commandes et Catalogue.",
    url: "https://coutureos.com",
    siteName: "CoutureOS",
    images: [
      {
        url: "/icon-512.png",
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
  themeColor: "#000000", // Noir Luxe
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ✅ AJOUT : suppressHydrationWarning est obligatoire pour next-themes
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        {/* ✅ AJOUT : Le Provider enveloppe toute l'app */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
