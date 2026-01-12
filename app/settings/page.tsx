"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // Correction ici : juste "../" au lieu de "../../"
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  LogOut,
  Trash2,
  User,
  ShieldAlert,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Récupérer l'email de l'utilisateur
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  // --- 1. FONCTION DE DÉCONNEXION ---
  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login"); // Redirection vers la connexion
  };

  // --- 2. FONCTION SUPPRESSION DE COMPTE ---
  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      "🛑 DANGER : Êtes-vous sûr de vouloir supprimer votre compte ?\n\nToutes vos données (Clients, Commandes, Modèles) seront définitivement effacées. Cette action est irréversible."
    );

    if (!confirm) return;

    const confirm2 = window.prompt(
      "Pour confirmer, tapez 'SUPPRIMER' dans la case ci-dessous :"
    );

    if (confirm2 !== "SUPPRIMER") {
      alert("Annulé : Le mot de confirmation était incorrect.");
      return;
    }

    setLoading(true);

    try {
      // 1. Récupérer l'ID utilisateur
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilisateur non trouvé");

      // 2. Supprimer les données (Tables publiques)
      await supabase.from("orders").delete().eq("user_id", user.id);
      await supabase.from("clients").delete().eq("user_id", user.id);
      await supabase.from("models").delete().eq("user_id", user.id);

      // 3. Déconnecter
      await supabase.auth.signOut();

      alert("Votre compte et vos données ont été effacés. Au revoir.");
      router.push("/login");
    } catch (error: unknown) {
      // Correction de l'erreur "Unexpected any"
      let errorMessage = "Une erreur est survenue.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert("Erreur : " + errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        {/* Navigation */}
        <Link
          href="/"
          className="text-gray-500 hover:text-black flex items-center gap-2 text-sm font-medium mb-8"
        >
          <ArrowLeft size={16} /> Retour au tableau de bord
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Paramètres</h1>
        <p className="text-gray-500 mb-8">
          Gérez votre compte et vos préférences.
        </p>

        {/* --- CARTE PROFIL --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
              <User size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Connecté en tant que
              </p>
              <p className="text-gray-900 font-bold">
                {userEmail || "Chargement..."}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <LogOut size={18} />
            )}
            {loading ? "Déconnexion..." : "Se déconnecter"}
          </button>
        </div>

        {/* --- ZONE DE DANGER --- */}
        <div className="border border-red-100 bg-red-50 rounded-2xl p-6">
          <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2">
            <ShieldAlert size={20} /> Zone de danger
          </h3>
          <p className="text-sm text-red-600 mb-4">
            La suppression de votre compte est irréversible. Toutes vos données
            seront perdues.
          </p>

          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 py-3 rounded-xl font-medium hover:bg-red-600 hover:text-white transition"
          >
            <Trash2 size={18} />
            Supprimer mon compte
          </button>
        </div>

        <div className="text-center mt-8 text-xs text-gray-400">
          CoutureOS v1.0.0 &copy; 2026
        </div>
      </div>
    </div>
  );
}
