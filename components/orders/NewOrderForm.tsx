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
  ChevronDown,
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

      // 🛡️ SÉCURITÉ FINANCIÈRE : Remplacement de la virgule mobile AVANT le parsing
      const safePrice = formData.price ? formData.price.replace(",", ".") : "0";
      const safeAdvance = formData.advance
        ? formData.advance.replace(",", ".")
        : "0";

      const priceFloat = parseFloat(safePrice) || 0;
      const advanceFloat = parseFloat(safeAdvance) || 0;

      const { error } = await supabase.from("orders").insert([
        {
          client_id: clientId,
          title: formData.title,
          price: priceFloat,
          advance: advanceFloat,
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
    <div className="max-w-2xl mx-auto pb-24 font-sans">
      {/* --- HEADER --- */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/clients/${clientId}`}
          className="p-3 bg-white dark:bg-[#111] rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-[#D4AF37] transition-colors shadow-sm"
          aria-label="Retour au dossier client"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-serif tracking-tight">
          Nouvelle Commande
        </h1>
      </div>

      {/* --- CARD FORMULAIRE --- */}
      <div className="bg-white dark:bg-[#111] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-6 md:p-10">
          {errorMsg && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-900/50 flex items-center gap-3">
              <AlertCircle size={20} className="shrink-0" />{" "}
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Titre */}
            <div>
              <label
                htmlFor="title"
                className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1"
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
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 outline-none transition-all dark:text-white font-medium text-base placeholder-gray-400"
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
                  className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1"
                >
                  Prix Total ({currency}){" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    id="price"
                    type="text" // 👈 Type Text pour autoriser la virgule sur clavier mobile fr
                    name="price"
                    required
                    inputMode="decimal"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 outline-none transition-all dark:text-white font-bold text-base placeholder-gray-400"
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
                  className="block text-[11px] font-bold text-[#D4AF37] uppercase tracking-wider mb-2 ml-1"
                >
                  Avance Perçue
                </label>
                <div className="relative">
                  <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37] h-5 w-5" />
                  <input
                    id="advance"
                    type="text"
                    name="advance"
                    inputMode="decimal"
                    className="w-full pl-12 pr-4 py-3.5 bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-xl focus:ring-2 focus:ring-[#D4AF37] outline-none transition-all text-gray-900 dark:text-white font-bold placeholder-[#D4AF37]/50 text-base"
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
                className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1"
              >
                Date de Livraison
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                <input
                  id="deadline"
                  type="date"
                  name="deadline"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 outline-none transition-all dark:text-white font-medium appearance-none text-base"
                  value={formData.deadline}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1"
              >
                Détails (Tissu, modifications...)
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 text-gray-400 h-5 w-5" />
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 outline-none transition-all resize-none dark:text-white text-base placeholder-gray-400"
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
                className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 ml-1"
              >
                Statut initial
              </label>
              <div className="relative">
                <select
                  id="status"
                  name="status"
                  aria-label="Statut de la commande"
                  className="w-full pl-4 pr-10 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 outline-none transition-all dark:text-white font-medium appearance-none cursor-pointer text-sm"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="en_attente">
                    🟡 En attente (Pas commencé)
                  </option>
                  <option value="en_cours">🔵 En cours (Fabrication)</option>
                  <option value="essayage">🟣 Prêt pour essayage</option>
                  <option value="termine">🟢 Terminé (Prêt à livrer)</option>
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                />
              </div>
            </div>

            {/* Bouton Créer */}
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold text-lg rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-transform disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgba(212,175,55,0.39)]"
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
