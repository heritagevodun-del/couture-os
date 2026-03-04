import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // Désactive le Service Worker en mode dev pour éviter les bugs de cache
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // 🛡️ SÉCURITÉ & PERFORMANCE : Liste blanche stricte pour les images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        // Le wildcard '**' permet d'accepter ton URL Supabase sans avoir à la coder en dur
        hostname: "**.supabase.co",
        port: "",
        // On autorise uniquement le dossier public de ton storage
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withPWA(nextConfig);
