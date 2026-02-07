import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Par défaut, destination finale = Dashboard
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    // Échange du code temporaire contre une session active
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ✅ SUCCÈS : L'email est confirmé.
      // On redirige IMMÉDIATEMENT vers le Dashboard.
      // C'est le 'SubscriptionGuard' là-bas qui vérifiera les 60 jours.
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // ❌ ERREUR : Code invalide ou expiré
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
