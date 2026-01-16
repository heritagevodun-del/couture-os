import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // swcMinify: true, <--- J'ai supprimé cette ligne qui causait l'erreur
  disable: process.env.NODE_ENV === "development", // Désactive la PWA en mode dev
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // Vos autres configurations Next.js iront ici si besoin
};

export default withPWA(nextConfig);
