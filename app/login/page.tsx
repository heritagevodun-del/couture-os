"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Session } from "@supabase/supabase-js";

export default function LoginPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  // Vérifie si l'utilisateur est déjà connecté
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        router.push("/");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        router.push("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          {/* --- LOGO COUTUREOS --- */}
          <div className="flex justify-center mb-6">
            <div className="logo-bouton-bg relative w-20 h-20 bg-[#1a1a1a] rounded-full border-2 border-[#D4AF37] shadow-md flex items-center justify-center">
              <div className="absolute w-[140%] h-[3px] bg-gradient-to-r from-gray-200 to-gray-400 -rotate-45 rounded-full shadow-sm flex items-center justify-end pr-[3px]">
                <div className="w-[6px] h-[2px] bg-[#1a1a1a] rounded-full"></div>
              </div>
            </div>
          </div>

          <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
            Bienvenue sur CoutureOS
          </h2>
          <p className="text-center text-gray-500 mb-8">
            La plateforme de gestion pour les pros de la couture.
          </p>

          {/* Formulaire de Connexion 100% Français */}
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#000000",
                    brandAccent: "#333333",
                  },
                },
              },
            }}
            providers={[]}
            localization={{
              variables: {
                sign_in: {
                  email_label: "Adresse email",
                  password_label: "Mot de passe",
                  email_input_placeholder: "Votre adresse email",
                  password_input_placeholder: "Votre mot de passe",
                  button_label: "Se connecter",
                  loading_button_label: "Connexion en cours...",
                  link_text: "J'ai déjà un compte, se connecter",
                },
                sign_up: {
                  email_label: "Adresse email",
                  password_label: "Mot de passe",
                  email_input_placeholder: "Votre adresse email",
                  password_input_placeholder: "Choisissez un mot de passe",
                  button_label: "Créer mon atelier",
                  loading_button_label: "Création en cours...",
                  link_text: "Pas encore de compte ? S'inscrire",
                },
                forgotten_password: {
                  email_label: "Adresse email",
                  password_label: "Mot de passe",
                  email_input_placeholder: "Votre adresse email",
                  button_label: "Envoyer les instructions",
                  loading_button_label: "Envoi en cours...",
                  link_text: "Mot de passe oublié ?",
                  confirmation_text:
                    "Vérifiez vos emails pour le lien de réinitialisation",
                },
              },
            }}
          />
        </div>
      </div>
    );
  }

  return null;
}
