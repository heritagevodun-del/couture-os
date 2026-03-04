import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Si "next" est présent, on l'utilise, sinon Dashboard par défaut
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // On ignore silencieusement les erreurs d'écriture de cookies
              // C'est le comportement attendu/sécurisé pour les Route Handlers avec Supabase
            }
          },
        },
      },
    );

    // Échange du code temporaire contre une session active
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 🛡️ SÉCURITÉ : Prévention de la faille "Open Redirect"
      // On s'assure que 'next' est une route interne (commence par /)
      // Si un pirate injecte "https://malicious.com", on l'ignore et on force le "/dashboard"
      const isRelativePath = next.startsWith("/") && !next.startsWith("//");
      const secureNext = isRelativePath ? next : "/dashboard";

      return NextResponse.redirect(`${origin}${secureNext}`);
    }

    // Log serveur pour debugging (invisible pour l'utilisateur)
    console.error("Auth Callback Error:", error.message);
  }

  // ⚠️ CAS "LIEN CONSOMMÉ OU EXPIRÉ"
  // On redirige vers login avec un code d'erreur spécifique 'auth-callback-error'
  return NextResponse.redirect(`${origin}/login?error=auth-callback-error`);
}
