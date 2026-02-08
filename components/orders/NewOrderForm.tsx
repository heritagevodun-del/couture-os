"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  Tag,
  FileText,
  Banknote,
  Coins,
  AlertCircle,
  Save,
} from "lucide-react";

interface NewOrderFormProps {
  clientId: string;
}

export default function NewOrderForm({ clientId }: NewOrderFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState("FCFA");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    advance: "",
    deadline: "",
    description: "",
    status: "en_attente",
  });

  // Récupération de la devise
  useEffect(() => {
    const getCurrency = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("currency")
        .eq("id", user.id)
        .single();

      if (profile?.currency) setCurrency(profile.currency);
    };
    getCurrency();
  }, [supabase]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Conversion des montants
      const priceInt = formData.price ? parseFloat(formData.price) : 0;
      const advanceInt = formData.advance ? parseFloat(formData.advance) : 0;

      const { error } = await supabase.from("orders").insert([
        {
          client_id: clientId,
          title: formData.title,
          price: priceInt,
          advance: advanceInt,
          deadline: formData.deadline || null,
          description: formData.description,
          status: formData.status,
          user_id: user.id,
        },
      ]);

      if (error) throw error;

      router.push(`/clients/${clientId}`);
      router.refresh();
    } catch (err: unknown) {
      // ✅ CORRECTION ICI : Typage sécurisé de l'erreur
      let message = "Une erreur inconnue est survenue";

      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "object" && err !== null && "message" in err) {
        message = String((err as { message: unknown }).message);
      }

      setErrorMsg("Erreur : " + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* --- HEADER --- */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/clients/${clientId}`}
          className="p-2 bg-white dark:bg-neutral-900 rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white transition shadow-sm"
          aria-label="Retour au client"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Nouvelle Commande
        </h1>
      </div>

      {/* --- CARD FORMULAIRE --- */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-6 md:p-8">
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-2">
              <AlertCircle size={18} /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Titre */}
            <div>
              <label
                htmlFor="title"
                className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2"
              >
                Modèle / Titre <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  id="title"
                  type="text"
                  name="title"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all dark:text-white font-medium text-base"
                  placeholder="Ex: Robe de soirée rouge"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* GRILLE PRIX & AVANCE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prix Total */}
              <div>
                <label
                  htmlFor="price"
                  className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2"
                >
                  Prix Total ({currency}){" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="price"
                    type="number"
                    name="price"
                    required
                    inputMode="decimal"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all dark:text-white font-medium text-base"
                    placeholder="0"
                    value={formData.price}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Avance */}
              <div>
                <label
                  htmlFor="advance"
                  className="block text-xs font-bold text-green-600 dark:text-green-400 uppercase mb-2"
                >
                  Avance Perçue
                </label>
                <div className="relative">
                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 h-5 w-5" />
                  <input
                    id="advance"
                    type="number"
                    name="advance"
                    inputMode="decimal"
                    className="w-full pl-12 pr-4 py-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-green-700 dark:text-green-300 font-bold placeholder-green-300 text-base"
                    placeholder="0"
                    value={formData.advance}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Date limite */}
            <div>
              <label
                htmlFor="deadline"
                className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2"
              >
                Date de Livraison
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                <input
                  id="deadline"
                  type="date"
                  name="deadline"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all dark:text-white font-medium appearance-none text-base"
                  value={formData.deadline}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2"
              >
                Détails (Tissu, modifications...)
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-gray-400 h-5 w-5" />
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all resize-none dark:text-white text-base"
                  placeholder="Pagne Woodin, col V, doublure en soie..."
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Statut */}
            <div>
              <label
                htmlFor="status"
                className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2"
              >
                Statut initial
              </label>
              <div className="relative">
                <select
                  id="status"
                  name="status"
                  aria-label="Statut de la commande"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all dark:text-white font-medium appearance-none cursor-pointer text-base"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="en_attente">
                    🟡 En attente (Pas commencé)
                  </option>
                  <option value="en_cours">🔵 En cours (Fabrication)</option>
                  <option value="essayage">🟣 Essayage</option>
                  <option value="termine">🟢 Terminé (Prêt à livrer)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  ▼
                </div>
              </div>
            </div>

            {/* Bouton Créer */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-gray-200 dark:shadow-none"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-6 w-6" />
                ) : (
                  <>
                    <Save size={20} />
                    Créer la commande
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
