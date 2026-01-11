"use client";

import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Session } from "@supabase/supabase-js";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  // États du formulaire
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // true = Connexion, false = Inscription
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // États d'erreurs
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [globalError, setGlobalError] = useState("");

  // --- 1. Gestion de la Session (Redirection si déjà connecté) ---
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

  // --- 2. Fonction de Validation Email (Regex) ---
  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(String(email).toLowerCase());
  };

  // --- 3. Gestion de la Soumission ---
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setGlobalError("");

    // A. Validation stricte de l'email
    if (!validateEmail(email)) {
      setEmailError(
        "L&apos;adresse email semble incorrecte (ex: jean@mail.com)"
      );
      return;
    }

    // B. Validation longueur mot de passe
    if (password.length < 6) {
      setPasswordError("Le mot de passe doit faire au moins 6 caractères.");
      return;
    }

    // C. Validation confirmation (seulement pour Inscription)
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
        // La redirection se fait via le useEffect
      } else {
        // --- Mode Inscription ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert(
          "Compte créé ! Vérifiez vos emails pour confirmer l&apos;inscription."
        );
        setIsLogin(true); // On bascule sur la connexion
      }
    } catch (error: unknown) {
      // Correction de l'erreur "Unexpected any"
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

      setGlobalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Si on charge la session, on peut afficher un loader ou rien (ici null)
  // Mais si pas de session, on affiche le formulaire
  if (session) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        {/* --- LOGO COUTUREOS (Conservé) --- */}
        <div className="flex justify-center mb-6">
          <div className="logo-bouton-bg relative w-20 h-20 bg-[#1a1a1a] rounded-full border-2 border-[#D4AF37] shadow-md flex items-center justify-center">
            <div className="absolute w-[140%] h-[3px] bg-gradient-to-r from-gray-200 to-gray-400 -rotate-45 rounded-full shadow-sm flex items-center justify-end pr-[3px]">
              <div className="w-[6px] h-[2px] bg-[#1a1a1a] rounded-full"></div>
            </div>
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
          {isLogin ? "Bienvenue sur CoutureOS" : "Créer un atelier"}
        </h2>
        <p className="text-center text-gray-500 mb-8">
          {isLogin
            ? "La plateforme de gestion pour les pros de la couture."
            : "Rejoignez la communauté des couturiers connectés."}
        </p>

        {/* --- Message d'erreur Global --- */}
        {globalError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            {globalError}
          </div>
        )}

        {/* --- Formulaire Personnalisé --- */}
        <form onSubmit={handleAuth} className="space-y-5">
          {/* Email */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                placeholder="Votre adresse email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(""); // Efface l'erreur quand on tape
                }}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all ${
                  emailError ? "border-red-500 bg-red-50" : "border-gray-200"
                }`}
                required
              />
            </div>
            {emailError && (
              <p className="text-xs text-red-500 mt-1">{emailError}</p>
            )}
          </div>

          {/* Mot de passe */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all ${
                  passwordError ? "border-red-500 bg-red-50" : "border-gray-200"
                }`}
                required
              />
              {/* Bouton Œil */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirmation Mot de passe (Uniquement si Inscription) */}
          {!isLogin && (
            <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Répétez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all ${
                    passwordError
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200"
                  }`}
                  required
                />
              </div>
              {passwordError && (
                <p className="text-xs text-red-500 mt-1">{passwordError}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isLogin ? (
              "Se connecter"
            ) : (
              "Créer mon atelier"
            )}
          </button>
        </form>

        {/* Toggle Lien Bas */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setGlobalError("");
              setEmailError("");
              setPasswordError("");
            }}
            className="text-sm text-gray-600 hover:text-black font-medium underline-offset-2 hover:underline"
          >
            {isLogin
              ? "Pas encore de compte ? S&apos;inscrire"
              : "J&apos;ai déjà un compte, se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
