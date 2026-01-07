import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoutureOS - Gestion Atelier",
  // J'ai retiré la mention "Bénin & France" pour viser l'international
  description:
    "Le système d'exploitation ultime pour les couturiers professionnels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* NOTE: On garde "fr" pour l'instant car le texte de l'app sera en français.
      Nous passerons ce paramètre en dynamique lors de la phase d'internationalisation.
    */
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
