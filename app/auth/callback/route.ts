import { createServerClient } from "@supabase/ssr"; // ✅ Correction : Suppression de CookieOptions inutile
import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Par défaut, on vise le dashboard, mais on va vérifier si on a le droit d'y aller
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

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 🚀 LOGIQUE INTELLIGENTE V2
      // On vérifie le profil pour rediriger au bon endroit
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_status")
          .eq("id", user.id)
          .single();

        // ✅ CAS 1 : Client légitime (Essai en cours ou Abonné) -> Dashboard
        if (
          profile?.subscription_status === "active" ||
          profile?.subscription_status === "trialing"
        ) {
          return NextResponse.redirect(`${origin}${next}`);
        }
      }

      // ❌ CAS 2 : Nouveau client (Free) ou Expiré -> Pricing (Pour activer l'essai)
      return NextResponse.redirect(`${origin}/pricing`);
    }
  }

  // En cas d'erreur de lien
  return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
}
