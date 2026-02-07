"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import Logo from "@/components/Logo";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

// --- SOUS-COMPOSANT LOGIQUE ---
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // --- ÉTATS ---
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // --- CHAMPS ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- FEEDBACK ---
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 1. GESTION ERREURS URL
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "auth-code-error") {
      setGlobalError("Le lien de connexion est invalide ou a expiré.");
    }
  }, [searchParams]);

  // 2. SURVEILLANCE SESSION & REDIRECTION INTELLIGENTE
  useEffect(() => {
    // Vérification initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Écouteur de changements (Login, Inscription, Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session);

        if (session) {
          // 🕵️‍♂️ VÉRIFICATION DU STATUT D'ABONNEMENT
          const { data: profile } = await supabase
            .from("profiles")
            .select("subscription_status")
            .eq("id", session.user.id)
            .single();

          // Si abonnement actif ou en période d'essai -> Dashboard
          if (
            profile?.subscription_status === "active" ||
            profile?.subscription_status === "trialing"
          ) {
            router.push("/dashboard");
          } else {
            // Sinon (Nouveau compte ou expiré) -> Direction Paiement
            router.push("/pricing");
          }
          router.refresh();
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  // 3. VALIDATION EMAIL
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // 4. RESET PASSWORD
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    setSuccessMessage("");

    if (!validateEmail(email)) {
      setEmailError("Email invalide.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings/password`,
      });
      if (error) throw error;
      setSuccessMessage("Lien envoyé ! Vérifiez vos emails.");
    } catch (error: unknown) {
      // ✅ Correction : on utilise unknown au lieu de any
      let message = "Erreur lors de l'envoi.";
      if (error instanceof Error) {
        message = error.message;
      }
      setGlobalError(message);
    } finally {
      setLoading(false);
    }
  };

  // 5. LOGIN / SIGNUP
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    setEmailError("");
    setPasswordError("");

    if (!validateEmail(email)) {
      setEmailError("Email incorrect.");
      return;
    }
    if (password.length < 6) {
      setPasswordError("6 caractères minimum.");
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setPasswordError("Mots de passe différents.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // CONNEXION
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // INSCRIPTION
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: email.split("@")[0],
            },
          },
        });
        if (error) throw error;

        setSuccessMessage("Compte créé ! Vérifiez vos emails.");
        setIsLogin(true);
      }
    } catch (error: unknown) {
      // ✅ Correction : on utilise unknown + Type Guard
      let msg = "Une erreur est survenue.";

      if (error instanceof Error) {
        msg = error.message;
      } else if (typeof error === "string") {
        msg = error;
      }

      if (msg.includes("Invalid login credentials"))
        msg = "Email ou mot de passe incorrect.";
      if (msg.includes("User already registered")) msg = "Email déjà utilisé.";
      setGlobalError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (session) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-4 sm:p-6 transition-colors duration-300 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex justify-center mb-8">
          <Logo className="w-16 h-16 sm:w-20 sm:h-20 shadow-lg rounded-2xl" />
        </div>

        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
          {isForgotPassword
            ? "Mot de passe oublié ?"
            : isLogin
              ? "Bon retour"
              : "Créer votre atelier"}
        </h2>

        {globalError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900">
            <AlertCircle size={18} /> {globalError}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-xl border border-green-200 dark:border-green-900 flex items-center gap-2 justify-center">
            <CheckCircle2 size={18} /> {successMessage}
          </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all"
                  placeholder="email@exemple.com"
                  required
                />
              </div>
            </div>
            <button
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold flex justify-center gap-2 hover:opacity-90 transition-all"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Envoyer"}
            </button>
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="w-full text-sm text-gray-500 hover:text-black mt-2 flex justify-center gap-2 items-center"
            >
              <ArrowLeft size={16} /> Retour
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all ${emailError ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  placeholder="email@exemple.com"
                  required
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-500 ml-1">{emailError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between ml-1">
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Mot de passe
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs font-bold hover:underline"
                  >
                    Oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800 border rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all ${passwordError ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                  Confirmation
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all ${passwordError ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold flex justify-center gap-2 hover:opacity-90 transition-all mt-6 shadow-lg"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : isLogin ? (
                "Se connecter"
              ) : (
                "Suivant : Choisir mon offre"
              )}
            </button>
          </form>
        )}

        {!isForgotPassword && (
          <div className="mt-8 text-center pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 mb-2">
              {isLogin ? "Nouveau ici ?" : "Déjà un compte ?"}
            </p>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold hover:underline transition-all"
            >
              {isLogin ? "Créer un compte" : "Se connecter"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-950">
          <Loader2 className="text-white animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
