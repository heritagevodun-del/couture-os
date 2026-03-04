import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // 🛡️ SÉCURITÉ & DX : Fail-fast pour éviter les bugs silencieux en production
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error(
      "🔥 ERREUR CRITIQUE : Les variables d'environnement Supabase (URL ou ANON_KEY) sont manquantes.",
    );
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
