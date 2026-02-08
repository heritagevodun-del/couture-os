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
            }
          },
        },
      },
    );

    // Échange du code temporaire contre une session active
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ✅ SUCCÈS : Redirection vers la destination prévue (ou Dashboard)
      // On nettoie l'URL pour ne pas traîner le code
      const forwardedUrl = new URL(next, origin);
      return NextResponse.redirect(forwardedUrl);
    }

    // Log serveur pour debugging si besoin
    console.error("Auth Callback Error:", error.message);
  }

  // ⚠️ CAS "LIEN CONSOMMÉ OU EXPIRÉ"
  // On redirige vers login avec un code d'erreur spécifique 'auth-callback-error'
  // Le frontend affichera un message jaune "Lien invalide, essayez de vous connecter".
  return NextResponse.redirect(`${origin}/login?error=auth-callback-error`);
}
