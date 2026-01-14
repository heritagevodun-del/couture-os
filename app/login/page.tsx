"use client";

import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Session } from "@supabase/supabase-js";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  // --- ÉTATS DU FORMULAIRE ---
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // true = Connexion, false = Inscription
  const [isForgotPassword, setIsForgotPassword] = useState(false); // Mode mot de passe oublié
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- ÉTATS D'ERREURS & SUCCÈS ---
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // --- 1. GESTION SESSION ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) router.push("/");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) router.push("/");
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
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setSuccessMessage("Email envoyé ! Vérifiez votre boîte de réception.");
    } catch (error: unknown) {
      let errorMessage = "Erreur lors de l'envoi.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
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

    // A. Validation Email
    if (!validateEmail(email)) {
      setEmailError("L'adresse email semble incorrecte (ex: jean@mail.com)");
      return;
    }

    // B. Validation Mot de passe
    if (password.length < 6) {
      setPasswordError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    // C. Validation Confirmation (Inscription seulement)
    if (!isLogin && password !== confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // --- Mode Connexion ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // --- Mode Inscription ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert(
          "Compte créé ! Vérifiez vos emails pour confirmer l'inscription."
        );
        setIsLogin(true);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        {/* --- LOGO PREMIUM --- */}
        <div className="flex justify-center mb-8">
          <div className="relative w-20 h-20 bg-black rounded-full border-2 border-[#D4AF37] shadow-lg flex items-center justify-center group hover:scale-105 transition-transform duration-500">
            {/* Aiguille stylisée */}
            <div className="absolute w-[140%] h-[2px] bg-gradient-to-r from-gray-400 to-white -rotate-45 rounded-full shadow-sm flex items-center justify-end pr-[3px]">
              <div className="w-[6px] h-[6px] bg-[#D4AF37] rounded-full shadow-sm animate-pulse"></div>
            </div>
            {/* Initiales ou Symbole */}
            <span className="text-[#D4AF37] font-bold text-2xl tracking-tighter">
              OS
            </span>
          </div>
        </div>

        {/* --- TITRE --- */}
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-2 tracking-tight">
          {isForgotPassword
            ? "Mot de passe oublié ?"
            : isLogin
            ? "Bon retour parmi nous"
            : "Créer votre atelier"}
        </h2>
        <p className="text-center text-gray-500 mb-10 text-sm">
          {isForgotPassword
            ? "Nous vous enverrons un lien de récupération."
            : isLogin
            ? "Connectez-vous pour gérer vos commandes."
            : "Rejoignez la révolution de la couture digitale."}
        </p>

        {/* --- MESSAGES D'ERREUR/SUCCÈS --- */}
        {globalError && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-3 border border-red-100 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} className="shrink-0" />
            {globalError}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 text-sm rounded-xl border border-green-200 text-center animate-in fade-in slide-in-from-top-2">
            {successMessage}
          </div>
        )}

        {/* CAS 1 : MOT DE PASSE OUBLIÉ */}
        {isForgotPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="exemple@atelier.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium"
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
              className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-900 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Envoyer le lien de récupération"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setGlobalError("");
                setSuccessMessage("");
              }}
              className="w-full text-sm text-gray-500 hover:text-black mt-4 flex items-center justify-center gap-2 transition-colors font-medium"
            >
              <ArrowLeft size={16} /> Retour à la connexion
            </button>
          </form>
        ) : (
          /* CAS 2 : CONNEXION / INSCRIPTION */
          <form onSubmit={handleAuth} className="space-y-6">
            {/* CHAMP EMAIL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
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
                  className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium ${
                    emailError ? "border-red-500 bg-red-50" : "border-gray-200"
                  }`}
                  required
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-500 font-medium">{emailError}</p>
              )}
            </div>

            {/* CHAMP PASSWORD */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Mot de passe
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setGlobalError("");
                      setEmailError("");
                    }}
                    className="text-xs font-bold text-black hover:underline transition-all"
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
                  className={`w-full pl-12 pr-12 py-3.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium ${
                    passwordError
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* CHAMP CONFIRM PASSWORD (Inscription seulement) */}
            {!isLogin && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-black focus:bg-white outline-none transition-all placeholder:text-gray-400 text-gray-900 font-medium ${
                      passwordError
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
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

            {/* BOUTON PRINCIPAL */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-900 transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 mt-4"
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

        {/* TOGGLE CONNEXION / INSCRIPTION */}
        {!isForgotPassword && (
          <div className="mt-8 text-center pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">
              {isLogin ? "Nouveau ici ?" : "Déjà un compte ?"}
            </p>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setGlobalError("");
                setEmailError("");
                setPasswordError("");
              }}
              className="text-black font-bold hover:underline transition-all"
            >
              {isLogin ? "Créer un compte gratuitement" : "Se connecter"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
