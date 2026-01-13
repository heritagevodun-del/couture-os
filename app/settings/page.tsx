"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  LogOut,
  Trash2,
  User,
  ShieldAlert,
  Store,
  MapPin,
  Phone,
  Save,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Gestion des messages de succès/erreur (Feedback utilisateur)
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Données du formulaire Atelier
  const [profile, setProfile] = useState({
    shop_name: "",
    shop_address: "",
    shop_phone: "",
  });

  // --- 1. CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");

        // Charger les infos de l'atelier s'il y en a
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data && !error) {
          setProfile({
            shop_name: data.shop_name || "",
            shop_address: data.shop_address || "",
            shop_phone: data.shop_phone || "",
          });
        }
      }
    };
    getProfile();
  }, []);

  // --- 2. SAUVEGARDE DU PROFIL ATELIER ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Upsert = Mise à jour si existe, Création sinon
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      shop_name: profile.shop_name,
      shop_address: profile.shop_address,
      shop_phone: profile.shop_phone,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde." });
    } else {
      setMessage({
        type: "success",
        text: "Infos de l'atelier mises à jour !",
      });
      // Effacer le message après 3 secondes
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // --- 3. DÉCONNEXION ---
  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  // --- 4. SUPPRESSION DE COMPTE ---
  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      "🛑 DANGER : Supprimer définitivement votre compte et toutes vos données ?"
    );
    if (!confirm) return;

    const confirm2 = window.prompt("Tapez 'SUPPRIMER' pour confirmer :");
    if (confirm2 !== "SUPPRIMER") return;

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        // Suppression en cascade manuelle (Sécurité)
        await supabase.from("profiles").delete().eq("id", user.id);
        await supabase.from("orders").delete().eq("user_id", user.id);
        await supabase.from("clients").delete().eq("user_id", user.id);
        await supabase.from("models").delete().eq("user_id", user.id);

        await supabase.auth.signOut();
        router.push("/login");
      }
    } catch (error) {
      console.error(error); // Utilisation de la variable error pour corriger le linter
      alert("Une erreur est survenue lors de la suppression.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="p-2 bg-white rounded-xl border border-gray-200 text-gray-500 hover:text-black transition"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            {/* Correction : l'Atelier avec &apos; */}
            <h1 className="text-2xl font-bold text-gray-900">
              Paramètres de l&apos;Atelier
            </h1>
            <p className="text-gray-500 text-sm">
              Configurez votre identité commerciale
            </p>
          </div>
        </div>

        {/* Message de confirmation (Toast) */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message.type === "success" ? "✅" : "⚠️"} {message.text}
          </div>
        )}

        {/* --- FORMULAIRE PROFIL ATELIER --- */}
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
            <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center">
              <Store size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Identité Visuelle
            </h2>
          </div>

          <div className="space-y-5">
            {/* Nom de l'atelier */}
            <div>
              {/* Correction : l'atelier avec &apos; */}
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l&apos;atelier / Marque
              </label>
              <input
                type="text"
                placeholder="Ex: Doigtd'Or Couture"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition"
                value={profile.shop_name}
                onChange={(e) =>
                  setProfile({ ...profile, shop_name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Téléphone Pro */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone Pro (Facture)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="+229 97..."
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition"
                    value={profile.shop_phone}
                    onChange={(e) =>
                      setProfile({ ...profile, shop_phone: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse / Ville
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Cotonou, Bénin"
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition"
                    value={profile.shop_address}
                    onChange={(e) =>
                      setProfile({ ...profile, shop_address: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50 shadow-md"
              >
                {saving ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <Save size={18} />
                )}
                {saving ? "Sauvegarde..." : "Enregistrer les modifications"}
              </button>
            </div>
          </div>
        </form>

        {/* --- COMPTE & SÉCURITÉ --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Déconnexion */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">
                <User size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">
                  Compte connecté
                </p>
                <p className="text-sm font-medium truncate w-40">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
            >
              <LogOut size={18} /> Déconnexion
            </button>
          </div>

          {/* Zone de Danger */}
          <div className="bg-red-50 rounded-2xl border border-red-100 p-6 h-fit">
            <div className="flex items-center gap-2 text-red-800 font-bold mb-2">
              <ShieldAlert size={20} /> Zone Danger
            </div>
            <p className="text-xs text-red-600 mb-4 leading-relaxed">
              La suppression est irréversible. Toutes les données (Clients,
              Commandes, CA) seront effacées.
            </p>
            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 py-3 rounded-xl font-medium hover:bg-red-600 hover:text-white transition"
            >
              <Trash2 size={18} /> Supprimer le compte
            </button>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-xs text-gray-400">
            ID Atelier: {userEmail ? userEmail.split("@")[0] : "..."}
          </p>
          <p className="text-xs text-gray-300 mt-1">CoutureOS Pro v2.0</p>
        </div>
      </div>
    </div>
  );
}
