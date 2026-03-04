import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 🛡️ LISTE BLANCHE : Toutes les routes nécessitant une authentification stricte
const protectedRoutes = ["/dashboard", "/clients", "/catalogue", "/settings"];

export async function middleware(request: NextRequest) {
  // 1. Initialisation de la réponse vierge
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Création du client Supabase (SSR)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 3. Rafraîchissement et vérification stricte du token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // =========================================================================
  // 🔒 LOGIQUE DE ROUTAGE SÉCURISÉE (ZÉRO RÉGRESSION)
  // =========================================================================

  // Cas A : L'utilisateur n'est PAS connecté et tente d'accéder à une zone privée
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (!user && isProtectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    // UX Pro : On mémorise la page qu'il voulait visiter pour le rediriger après connexion
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cas B : L'utilisateur EST connecté mais tente d'aller sur la page de connexion
  if (user && pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  // Le middleware s'exécute partout SAUF sur les assets statiques et API webhooks
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
