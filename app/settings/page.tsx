"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client"; // ✅ Correction Import
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
  Coins,
  Camera,
  CheckCircle2,
} from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Gestion des messages (Feedback)
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Données du formulaire
  const [profile, setProfile] = useState({
    shop_name: "",
    shop_address: "",
    shop_phone: "",
    currency: "FCFA",
    avatar_url: "",
  });

  // --- 1. CHARGEMENT ---
  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserEmail(user.email || "");

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data && !error) {
        setProfile({
          shop_name: data.shop_name || "",
          shop_address: data.address || "", // Mappage DB
          shop_phone: data.phone || "", // Mappage DB
          currency: data.currency || "FCFA",
          avatar_url: data.avatar_url || "",
        });
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
      }
      setLoading(false);
    };
    getProfile();
  }, [router, supabase]);

  // --- 2. GESTION AVATAR ---
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // 2 Mo max
      if (file.size > 2 * 1024 * 1024) {
        setMessage({
          type: "error",
          text: "L'image est trop lourde (Max 2Mo).",
        });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // --- 3. SAUVEGARDE ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let finalAvatarUrl = profile.avatar_url;

    // A. Upload de la nouvelle image si nécessaire
    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars") // Assure-toi que ce bucket existe et est public
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) {
        console.error(uploadError);
        setMessage({
          type: "error",
          text: "Erreur upload image. Vérifiez votre connexion.",
        });
        setSaving(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);
      finalAvatarUrl = publicUrl;
    }

    // B. Mise à jour Profil
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      shop_name: profile.shop_name,
      address: profile.shop_address,
      phone: profile.shop_phone,
      currency: profile.currency,
      avatar_url: finalAvatarUrl,
      updated_at: new Date().toISOString(),
    });

    setSaving(false);

    if (error) {
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde." });
    } else {
      setMessage({ type: "success", text: "Profil mis à jour avec succès !" });
      setProfile((prev) => ({ ...prev, avatar_url: finalAvatarUrl }));

      // Rafraîchir pour mettre à jour le dashboard
      setTimeout(() => {
        router.refresh();
        setMessage(null);
      }, 2000);
    }
  };

  // --- 4. DÉCONNEXION ---
  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  // --- 5. SUPPRESSION COMPTE ---
  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      "🛑 Êtes-vous sûr ? Cette action est irréversible.",
    );
    if (!confirm) return;

    const confirmText = window.prompt("Écrivez 'SUPPRIMER' pour confirmer :");
    if (confirmText !== "SUPPRIMER") return;

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Cascade delete manuelle pour nettoyer proprement
      await supabase.from("orders").delete().eq("user_id", user.id);
      await supabase.from("clients").delete().eq("user_id", user.id);
      await supabase.from("models").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);

      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard"
            className="p-2 bg-white dark:bg-neutral-900 rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white transition shadow-sm"
            aria-label="Retour au tableau de bord"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Paramètres
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Configurez votre identité commerciale
            </p>
          </div>
        </div>

        {/* Toast Notification */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-bold shadow-sm animate-in slide-in-from-top-2 ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <ShieldAlert size={18} />
            )}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* CARTE IDENTITÉ & LOGO */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50 dark:border-gray-800">
              <Store className="text-gray-400" size={20} />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Identité Visuelle
              </h2>
            </div>

            {/* Upload Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-inner">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="Logo Atelier"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User
                      size={40}
                      className="text-gray-300 dark:text-gray-600"
                    />
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-2 bg-black text-white rounded-full hover:bg-gray-800 cursor-pointer shadow-lg transition-transform hover:scale-110"
                  aria-label="Changer le logo"
                >
                  <Camera size={16} />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Logo de l&apos;atelier (Max 2Mo)
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="shop_name"
                  className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase"
                >
                  Nom de l&apos;atelier
                </label>
                <input
                  id="shop_name"
                  type="text"
                  required
                  placeholder="Ex: Maison Couture"
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white transition-all font-medium"
                  value={profile.shop_name}
                  onChange={(e) =>
                    setProfile({ ...profile, shop_name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="shop_phone"
                    className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase"
                  >
                    Téléphone Pro
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      id="shop_phone"
                      type="text"
                      placeholder="+229 97..."
                      className="w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white transition-all"
                      value={profile.shop_phone}
                      onChange={(e) =>
                        setProfile({ ...profile, shop_phone: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="currency"
                    className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase"
                  >
                    Devise (Monnaie)
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      id="currency"
                      type="text"
                      placeholder="FCFA"
                      className="w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white transition-all"
                      value={profile.currency}
                      onChange={(e) =>
                        setProfile({ ...profile, currency: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="shop_address"
                  className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase"
                >
                  Adresse (Pour Facture)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-gray-400 h-4 w-4" />
                  <textarea
                    id="shop_address"
                    rows={2}
                    placeholder="123 Rue du Commerce, Cotonou"
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white transition-all resize-none"
                    value={profile.shop_address}
                    onChange={(e) =>
                      setProfile({ ...profile, shop_address: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 shadow-lg dark:shadow-none"
              >
                {saving ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <Save size={18} />
                )}
                {saving ? "Sauvegarde..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </form>

        {/* --- ZONE DANGER & COMPTE --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Déconnexion */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Session active
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-6">
                {userEmail}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <LogOut size={16} /> Se déconnecter
            </button>
          </div>

          {/* Suppression */}
          <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 p-6">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold mb-2">
              <ShieldAlert size={18} /> Zone de Danger
            </div>
            <p className="text-xs text-red-600 dark:text-red-400/80 mb-6 leading-relaxed">
              La suppression du compte est définitive. Toutes vos données
              clients et commandes seront effacées.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 py-3 rounded-xl font-bold text-sm hover:bg-red-600 hover:text-white dark:hover:bg-red-900 transition-colors"
            >
              <Trash2 size={16} /> Supprimer mon compte
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-300 dark:text-gray-700 pb-8">
          CoutureOS Pro v2.1 • ID: {userEmail.split("@")[0]}
        </div>
      </div>
    </div>
  );
}
