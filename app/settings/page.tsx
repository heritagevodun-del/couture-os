"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image"; // 👈 On importe l'optimiseur
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

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [profile, setProfile] = useState({
    shop_name: "",
    shop_address: "",
    shop_phone: "",
    currency: "FCFA",
    avatar_url: "",
  });

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
          shop_address: data.address || "", // Attention à la DB (address vs shop_address)
          shop_phone: data.phone || "", // Attention à la DB (phone vs shop_phone)
          currency: data.currency || "FCFA",
          avatar_url: data.avatar_url || "",
        });
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
      }
      setLoading(false);
    };
    getProfile();
  }, [router, supabase]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setMessage({
          type: "error",
          text: "Votre logo est trop lourd (Maximum 2 Mo).",
        });
        return;
      }
      setAvatarFile(file);
      // Génère une URL locale temporaire pour la prévisualisation immédiate
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let finalAvatarUrl = profile.avatar_url;

    // 1. Si une nouvelle image a été sélectionnée, on l'upload
    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`; // Unicité garantie
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) {
        console.error("Erreur Upload:", uploadError);
        setMessage({
          type: "error",
          text: "Impossible de télécharger le logo.",
        });
        setSaving(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);
      finalAvatarUrl = publicUrl;
    }

    // 2. Mise à jour de la table des profils
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
      console.error("Erreur Sauvegarde SQL:", error);
      setMessage({ type: "error", text: "Erreur lors de la sauvegarde." });
    } else {
      setMessage({
        type: "success",
        text: "Paramètres enregistrés avec succès.",
      });
      setProfile((prev) => ({ ...prev, avatar_url: finalAvatarUrl }));

      // 🛡️ UX PRO : On force le rafraîchissement complet pour que le nouveau logo/nom apparaisse partout
      router.refresh();
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "🛑 Êtes-vous sûr de vouloir fermer définitivement votre atelier ? Toutes les données seront perdues.",
      )
    )
      return;
    if (window.prompt("Pour confirmer, écrivez 'SUPPRIMER' :") !== "SUPPRIMER")
      return;

    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  if (loading)
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#F8F9FA] dark:bg-[#050505]">
        <Loader2 className="animate-spin text-[#D4AF37]" size={40} />
      </div>
    );

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] dark:bg-[#050505] p-4 md:p-8 transition-colors duration-300 font-sans pb-24">
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* --- HEADER --- */}
        <div className="flex items-center gap-4 mb-10">
          <Link
            href="/dashboard"
            className="p-3 bg-white dark:bg-[#111] rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-[#D4AF37] transition-colors shadow-sm"
            aria-label="Retour au tableau de bord"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white font-serif tracking-tight">
              Paramètres
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Configurez l&apos;identité commerciale de votre atelier.
            </p>
          </div>
        </div>

        {/* --- ALERTE --- */}
        {message && (
          <div
            className={`mb-8 p-4 rounded-xl flex items-center gap-3 text-sm font-bold shadow-sm animate-in slide-in-from-top-2 ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50"
                : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 size={20} className="shrink-0" />
            ) : (
              <ShieldAlert size={20} className="shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* --- FORMULAIRE --- */}
        <form onSubmit={handleSaveProfile} className="space-y-6 mb-10">
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8 transition-all">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
              <Store className="text-[#D4AF37]" size={20} />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Identité Visuelle
              </h2>
            </div>

            {/* AVATAR UPLOAD */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative group cursor-pointer">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-black flex items-center justify-center shadow-inner relative">
                  {avatarPreview ? (
                    // 🛡️ UX : Si l'URL commence par "blob:" (image locale pas encore sauvée), on utilise <img> car Next/Image bloque les blobs.
                    // Sinon (image Supabase), on utilise l'optimisation Next/Image.
                    avatarPreview.startsWith("blob:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarPreview}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={avatarPreview}
                        alt="Logo Atelier"
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    )
                  ) : (
                    <User
                      size={48}
                      className="text-gray-300 dark:text-gray-700"
                      strokeWidth={1}
                    />
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-2.5 bg-[#D4AF37] text-black rounded-full hover:bg-[#b5952f] cursor-pointer shadow-lg transition-transform hover:scale-110"
                  aria-label="Changer le logo de l'atelier"
                >
                  <Camera size={18} />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-4 uppercase tracking-wider">
                Logo de l&apos;entreprise (Max 2Mo)
              </p>
            </div>

            {/* CHAMPS TEXTES */}
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="shop_name"
                  className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider ml-1"
                >
                  Nom de l&apos;atelier <span className="text-red-500">*</span>
                </label>
                <input
                  id="shop_name"
                  type="text"
                  required
                  placeholder="Ex: Maison Couture Paris"
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#D4AF37]/50 outline-none dark:text-white transition-all font-bold text-sm placeholder-gray-400"
                  value={profile.shop_name}
                  onChange={(e) =>
                    setProfile({ ...profile, shop_name: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="shop_phone"
                    className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider ml-1"
                  >
                    Téléphone Professionnel
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      id="shop_phone"
                      type="tel"
                      placeholder="+229 90..."
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#D4AF37]/50 outline-none dark:text-white transition-all text-sm font-medium placeholder-gray-400"
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
                    className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider ml-1"
                  >
                    Devise (Facturation)
                  </label>
                  <div className="relative">
                    <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      id="currency"
                      type="text"
                      placeholder="FCFA, EUR, USD..."
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#D4AF37]/50 outline-none dark:text-white transition-all text-sm font-bold placeholder-gray-400 uppercase"
                      value={profile.currency}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          currency: e.target.value.toUpperCase(),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="shop_address"
                  className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider ml-1"
                >
                  Adresse Physique (Sur factures)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-4 text-gray-400 h-4 w-4" />
                  <textarea
                    id="shop_address"
                    rows={2}
                    placeholder="123 Avenue de la Mode, Quartier X"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#D4AF37]/50 outline-none dark:text-white transition-all resize-none text-sm font-medium placeholder-gray-400"
                    value={profile.shop_address}
                    onChange={(e) =>
                      setProfile({ ...profile, shop_address: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto flex justify-center items-center gap-2 bg-[#D4AF37] hover:bg-[#b5952f] text-black px-10 py-4 rounded-2xl font-bold hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] disabled:shadow-none"
              >
                {saving ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <Save size={18} />
                )}
                {saving ? "Mise à jour..." : "Enregistrer les modifications"}
              </button>
            </div>
          </div>
        </form>

        {/* --- ZONE SYSTÈME & DANGER --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1.5 font-serif text-lg">
                Compte Opérateur
              </h3>
              <p className="text-xs font-bold text-gray-400 tracking-wider mb-8 break-all bg-gray-50 dark:bg-black p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                {userEmail}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-gray-50 dark:bg-black text-gray-700 dark:text-gray-300 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors border border-gray-200 dark:border-gray-800"
            >
              <LogOut size={16} /> Se déconnecter
            </button>
          </div>

          <div className="bg-red-50/50 dark:bg-red-950/10 rounded-3xl border border-red-100 dark:border-red-900/30 p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-500 font-bold mb-3 uppercase tracking-wider text-[11px]">
                <ShieldAlert size={16} /> Zone de Danger
              </div>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-8 leading-relaxed font-medium">
                La suppression du compte est immédiate et irréversible. Toutes
                les données clients et commandes seront perdues.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 py-3.5 rounded-xl font-bold text-sm hover:bg-red-600 hover:text-white dark:hover:bg-red-900 transition-colors shadow-sm"
            >
              <Trash2 size={16} /> Détruire l&apos;atelier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
