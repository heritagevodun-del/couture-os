import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 1. Initialisation de la réponse vierge (on copie les headers existants)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Création du client Supabase pour le contexte Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Étape Critique A : Mettre à jour les cookies de la requête entrante
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          // Étape Critique B : Recréer la réponse pour inclure ces changements
          response = NextResponse.next({
            request,
          });

          // Étape Critique C : Mettre à jour les cookies de la réponse sortante
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 3. Rafraîchissement de la session (Token Refresh)
  // Cette ligne est vitale : elle vérifie si le token est encore bon.
  // S'il est expiré, Supabase va utiliser 'setAll' ci-dessus pour en créer un nouveau.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Protection basique (Optionnel, mais le SubscriptionGuard fait déjà le travail fin)
  // Si l'utilisateur n'est pas connecté et essaie d'aller sur le dashboard
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // On applique le middleware partout SAUF sur les fichiers statiques et images
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
