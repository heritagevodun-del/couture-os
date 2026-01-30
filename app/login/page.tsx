"use client";

import { supabase } from "../lib/supabase";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Session } from "@supabase/supabase-js";
import Logo from "@/components/Logo"; // On utilise ton nouveau logo !
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

// Sous-composant pour gérer les paramètres d'URL (obligatoire Next.js)
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);

  // --- ÉTATS DU FORMULAIRE ---
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- ÉTATS D'ERREURS & SUCCÈS ---
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // --- 0. GESTION DES ERREURS URL (Retour du callback) ---
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "auth-code-error") {
      setGlobalError(
        "Le lien de connexion est invalide ou a expiré. Veuillez réessayer.",
      );
    }
  }, [searchParams]);

  // --- 1. GESTION SESSION ---
  useEffect(() => {
    // Vérifier si déjà connecté
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) router.push("/dashboard"); // CORRECTION : Vers le Dashboard !
    });

    // Écouter les changements (ex: après clic email)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) router.push("/dashboard"); // CORRECTION : Vers le Dashboard !
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // --- 2. VALIDATION EMAIL ---
  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(String(email).toLowerCase());
  };

  // --- 3. LOGIQUE MOT DE PASSE OUBLIÉ ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    setEmailError("");
    setSuccessMessage("");

    if (!validateEmail(email)) {
      setEmailError("L'adresse email semble incorrecte.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
      });
      if (error) throw error;
      setSuccessMessage("Email envoyé ! Vérifiez votre boîte de réception.");
    } catch (error: unknown) {
      let errorMessage = "Erreur lors de l'envoi.";
      if (error instanceof Error) errorMessage = error.message;
      setGlobalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- 4. LOGIQUE CONNEXION / INSCRIPTION ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setGlobalError("");
    setSuccessMessage("");

    // A. Validation
    if (!validateEmail(email)) {
      setEmailError("L'adresse email semble incorrecte.");
      return;
    }
    if (password.length < 6) {
      setPasswordError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // --- CONNEXION ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // La redirection est gérée par le useEffect (onAuthStateChange)
      } else {
        // --- INSCRIPTION ---
        // Important : On redirige vers le callback pour valider l'email
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;

        setSuccessMessage(
          "Compte créé avec succès ! Vérifiez vos emails pour confirmer l'inscription avant de vous connecter.",
        );
        setIsLogin(true); // On bascule sur l'écran de connexion
      }
    } catch (error: unknown) {
      let errorMessage = "Une erreur est survenue.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        errorMessage = String((error as { message: unknown }).message);
      }

      if (errorMessage.includes("Invalid login credentials"))
        errorMessage = "Email ou mot de passe incorrect.";
      if (errorMessage.includes("User already registered"))
        errorMessage = "Cet email est déjà utilisé.";

      setGlobalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (session) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 p-6 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 p-10 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
        {/* --- LOGO OFFICIEL --- */}
        <div className="flex justify-center mb-8">
          <Logo className="w-20 h-20 shadow-lg rounded-full" />
        </div>

        {/* --- TITRE --- */}
        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
          {isForgotPassword
            ? "Mot de passe oublié ?"
            : isLogin
              ? "Bon retour parmi nous"
              : "Créer votre atelier"}
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-10 text-sm">
          {isForgotPassword
            ? "Nous vous enverrons un lien de récupération."
            : isLogin
              ? "Connectez-vous pour gérer vos commandes."
              : "Rejoignez la révolution de la couture digitale."}
        </p>

        {/* --- MESSAGES --- */}
        {globalError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0" />
            {globalError}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-xl border border-green-200 dark:border-green-900 text-center animate-in fade-in slide-in-from-top-2 flex flex-col items-center gap-2">
            <CheckCircle2 size={24} />
            {successMessage}
          </div>
        )}

        {/* --- FORMULAIRE --- */}
        {isForgotPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="exemple@atelier.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:bg-white dark:focus:bg-neutral-900 outline-none transition-all placeholder:text-gray-400 text-gray-900 dark:text-white font-medium"
                  required
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-500 font-medium">{emailError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold hover:bg-gray-900 dark:hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Envoyer le lien"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setGlobalError("");
                setSuccessMessage("");
              }}
              className="w-full text-sm text-gray-500 hover:text-black dark:hover:text-white mt-4 flex items-center justify-center gap-2 transition-colors font-medium"
            >
              <ArrowLeft size={16} /> Retour à la connexion
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Adresse Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="exemple@atelier.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:bg-white dark:focus:bg-neutral-900 outline-none transition-all placeholder:text-gray-400 text-gray-900 dark:text-white font-medium ${
                    emailError
                      ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  required
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-500 font-medium">{emailError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Mot de passe
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setGlobalError("");
                    }}
                    className="text-xs font-bold text-black dark:text-white hover:underline transition-all"
                  >
                    Oublié ?
                  </button>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError("");
                  }}
                  className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:bg-white dark:focus:bg-neutral-900 outline-none transition-all placeholder:text-gray-400 text-gray-900 dark:text-white font-medium ${
                    passwordError
                      ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:bg-white dark:focus:bg-neutral-900 outline-none transition-all placeholder:text-gray-400 text-gray-900 dark:text-white font-medium ${
                      passwordError
                        ? "border-red-500 bg-red-50 dark:bg-red-900/10"
                        : "border-gray-200 dark:border-gray-700"
                    }`}
                    required
                  />
                </div>
                {passwordError && (
                  <p className="text-xs text-red-500 font-medium">
                    {passwordError}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold hover:bg-gray-900 dark:hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg mt-4"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isLogin ? (
                "Se connecter"
              ) : (
                "Commencer l'aventure"
              )}
            </button>
          </form>
        )}

        {!isForgotPassword && (
          <div className="mt-8 text-center pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {isLogin ? "Nouveau ici ?" : "Déjà un compte ?"}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setGlobalError("");
                setEmailError("");
                setPasswordError("");
              }}
              className="text-black dark:text-white font-bold hover:underline transition-all"
            >
              {isLogin ? "Créer un compte gratuitement" : "Se connecter"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant Principal avec Suspense (Requis pour useSearchParams dans Next.js)
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
