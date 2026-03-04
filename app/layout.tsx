import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google"; // 👈 Ajout de la police Luxe
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

// Configuration des polices
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans" 
});

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-serif" // 👈 Variable injectée pour le design system
});

// --- 1. CONFIGURATION DU PARTAGE & PWA ---
export const metadata: Metadata = {
  metadataBase: new URL("https://coutureos.com"),
  title: {
    default: "Couture OS | L'Application pour Couturiers Pro",
    template: "%s | Couture OS",
  },
  description:
    "Gérez votre atelier de couture comme un pro. Clients, Mensurations, Commandes et Factures. Disponible sur Mobile et PC.",
  keywords: [
    "Couture",
    "Atelier",
    "Gestion",
    "Mesures",
    "Styliste",
    "Tailleur",
    "Bénin",
    "Mode",
    "SaaS",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Couture OS",
  },
  openGraph: {
    title: "Couture OS 🧵",
    description:
      "Gérez votre atelier simplement : Mensurations, Commandes et Facturation en 1 clic.",
    url: "https://coutureos.com",
    siteName: "Couture OS",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Logo Couture OS - Gestion Atelier",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
};

// --- 2. RÉGLAGE DU ZOOM MOBILE & COULEURS ---
export const viewport: Viewport = {
  themeColor: "#050505", // 👈 Aligné exactement avec notre Noir Absolu
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Évite que le double-tap sur mobile ne zoome l'écran (comportement App Native)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning est obligatoire pour next-themes
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-[#050505] text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark" // 👈 FORÇAGE DU THÈME : Toujours en mode Luxe
          enableSystem={false} // 👈 On ignore les préférences du téléphone du client
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}