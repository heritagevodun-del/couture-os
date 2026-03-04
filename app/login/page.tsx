"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import Logo from "@/components/Logo";
import { normalizeEmail, isBlockedEmail } from "@/lib/security";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Info,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // 🛡️ NOUVEAU STATE : Empêche le clignotement du formulaire au chargement
  const [isInitializing, setIsInitializing] = useState(true);

  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Gestion des messages d'URL
  useEffect(() => {
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    if (error === "auth-callback-error" || error === "auth-code-error") {
      setInfoMessage(
        "Ce lien n&apos;est plus valide. Connectez-vous simplement ci-dessous.",
      );
      setIsLogin(true);
    }

    if (message === "email-verified") {
      setSuccessMessage("Vérification terminée. Vous pouvez vous connecter.");
      setIsLogin(true);
    }
  }, [searchParams]);

  // Surveillance Session (Optimisée)
  useEffect(() => {
    const checkInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // L'utilisateur est DÉJÀ connecté. On vérifie son statut et on le redirige directement.
        const { data: profile } = await supabase
          .from("profiles")
          .select("subscription_status")
          .eq("id", session.user.id)
          .single();

        if (
          profile?.subscription_status === "active" ||
          profile?.subscription_status === "kkiapay_active" ||
          profile?.subscription_status === "trialing" ||
          profile?.subscription_status === "pro"
        ) {
          router.push("/dashboard");
        } else {
          router.push("/subscription-expired");
        }
      } else {
        // S'il n'est pas connecté, on affiche le formulaire
        setIsInitializing(false);
      }
    };

    checkInitialSession();

    // On écoute UNIQUEMENT l'événement de connexion active
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_IN" && session) {
          setIsInitializing(true); // On cache le formulaire pendant la redirection
          const { data: profile } = await supabase
            .from("profiles")
            .select("subscription_status")
            .eq("id", session.user.id)
            .single();

          if (
            profile?.subscription_status === "active" ||
            profile?.subscription_status === "kkiapay_active" ||
            profile?.subscription_status === "trialing" ||
            profile?.subscription_status === "pro"
          ) {
            router.push("/dashboard");
          } else {
            router.push("/subscription-expired");
          }
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    setSuccessMessage("");
    setInfoMessage("");

    const searchEmail = email.toLowerCase().trim();

    if (!validateEmail(searchEmail)) {
      setEmailError("Email invalide.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(searchEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings/password`,
      });
      if (error) throw error;
      setSuccessMessage("Lien envoyé ! Vérifiez vos emails.");
    } catch (error: unknown) {
      let message = "Erreur lors de l&apos;envoi.";
      if (error instanceof Error) message = error.message;
      setGlobalError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    setEmailError("");
    setPasswordError("");
    setInfoMessage("");

    const inputEmail = email.toLowerCase().trim();
    const strictEmail = normalizeEmail(email);

    if (!isLogin && isBlockedEmail(strictEmail)) {
      setGlobalError(
        "Les adresses temporaires ou jetables ne sont pas acceptées.",
      );
      return;
    }

    if (!validateEmail(inputEmail)) {
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
        const { error } = await supabase.auth.signInWithPassword({
          email: inputEmail,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: strictEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: { full_name: strictEmail.split("@")[0] },
          },
        });
        if (error) throw error;
        setSuccessMessage("Compte créé ! Vérifiez vos emails pour confirmer.");
        setIsLogin(true);
      }
    } catch (error: unknown) {
      let msg = "Une erreur est survenue.";
      if (error instanceof Error) msg = error.message;
      else if (typeof error === "string") msg = error;

      if (msg.includes("Invalid login"))
        msg = "Email ou mot de passe incorrect.";
      if (msg.includes("already registered"))
        msg = "Cet email est déjà utilisé.";
      setGlobalError(msg);
      setLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505]">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505] p-4 sm:p-6 transition-colors duration-300 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-[#111] p-8 sm:p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="flex justify-center mb-8">
          <Logo className="w-16 h-16 sm:w-20 sm:h-20 shadow-lg rounded-2xl" />
        </div>

        <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight font-serif">
          {isForgotPassword
            ? "Mot de passe oublié ?"
            : isLogin
              ? "Bon retour"
              : "Créer votre atelier"}
        </h2>

        {globalError && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-3 border border-red-100 dark:border-red-900/30 animate-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" /> {globalError}
          </div>
        )}
        {infoMessage && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 text-sm rounded-xl flex gap-3 border border-yellow-200 dark:border-yellow-900/30 animate-in slide-in-from-top-2">
            <Info size={20} className="shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 text-sm rounded-xl border border-green-200 dark:border-green-900/30 flex items-center gap-2 justify-center animate-in slide-in-from-top-2">
            <CheckCircle2 size={20} className="shrink-0" /> {successMessage}
          </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label
                htmlFor="reset-email"
                className="text-xs font-bold text-gray-500 uppercase ml-1"
              >
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 outline-none dark:text-white transition-all"
                required
              />
            </div>
            <button
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black py-4 rounded-xl font-bold transition-all flex justify-center items-center gap-2 shadow-lg"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Envoyer le lien"
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="w-full text-sm text-gray-500 hover:text-black dark:hover:text-white mt-2 flex justify-center gap-2 items-center"
            >
              <ArrowLeft size={16} /> Retour à la connexion
            </button>
          </form>
        ) : (
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-xs font-bold text-gray-500 uppercase ml-1"
              >
                Email
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]/50 dark:text-white transition-all ${emailError ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  placeholder="nom@exemple.com"
                  required
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-500 ml-1 mt-1">{emailError}</p>
              )}
            </div>
            <div>
              <div className="flex justify-between ml-1">
                <label
                  htmlFor="password"
                  className="text-xs font-bold text-gray-500 uppercase"
                >
                  Mot de passe
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs font-bold hover:text-[#D4AF37] text-gray-400 transition-colors"
                  >
                    Oublié ?
                  </button>
                )}
              </div>
              <div className="relative mt-1">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-800/50 border rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]/50 dark:text-white transition-all ${passwordError ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black dark:hover:text-white"
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-red-500 ml-1 mt-1">
                  {passwordError}
                </p>
              )}
            </div>
            {!isLogin && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-xs font-bold text-gray-500 uppercase ml-1"
                >
                  Confirmation
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]/50 dark:text-white transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}
            <button
              disabled={loading}
              className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black py-4 rounded-xl font-bold hover:scale-[1.02] transition-transform mt-6 shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.23)] flex justify-center items-center gap-2 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : isLogin ? (
                "Accéder à mon atelier"
              ) : (
                "Créer mon atelier"
              )}
            </button>
          </form>
        )}
        {!isForgotPassword && (
          <div className="mt-8 text-center pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 mb-2">
              {isLogin ? "Nouveau sur Couture OS ?" : "Déjà un compte ?"}
            </p>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold hover:text-[#D4AF37] dark:text-gray-300 dark:hover:text-[#D4AF37] transition-all"
            >
              {isLogin ? "Créer un compte gratuitement" : "Se connecter"}
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050505]">
          <Loader2 className="text-[#D4AF37] animate-spin" size={40} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
