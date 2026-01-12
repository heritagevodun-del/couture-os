"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Loader2, Tag } from "lucide-react";

export default function NewOrder() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    deadline: "",
    description: "",
    status: "en_attente",
  });

  // 1. SÉCURITÉ : Vérification session
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) router.push("/login");
    };
    checkUser();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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

    if (!params?.id) return;

    // 2. RÉCUPÉRATION USER
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login");
      return;
    }

    const priceInt = formData.price ? parseInt(formData.price) : 0;

    // 3. ENVOI
    const { error } = await supabase.from("orders").insert([
      {
        client_id: params.id,
        title: formData.title,
        price: priceInt,
        deadline: formData.deadline,
        description: formData.description,
        status: formData.status,
        user_id: session.user.id,
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      router.push(`/clients/${params.id}`);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* --- HEADER --- */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <Link
            href={`/clients/${params?.id}`}
            className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Nouvelle Commande</h1>
        </div>

        {/* --- FORMULAIRE --- */}
        <div className="p-6 md:p-8">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Titre */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Modèle / Titre
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  id="title" // AJOUT DE L'ID
                  type="text"
                  name="title"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  placeholder="Ex: Robe de soirée rouge"
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Prix */}
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Prix (FCFA)
                </label>
                <input
                  id="price" // AJOUT DE L'ID
                  type="number"
                  name="price"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                  placeholder="25000"
                  value={formData.price}
                  onChange={handleChange}
                />
              </div>

              {/* Date limite */}
              <div>
                <label
                  htmlFor="deadline"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Date de livraison
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    id="deadline" // AJOUT DE L'ID
                    type="date"
                    name="deadline"
                    required
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-sm"
                    value={formData.deadline}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Détails (Tissu, modifications...)
              </label>
              <textarea
                id="description" // AJOUT DE L'ID
                name="description"
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all resize-none"
                placeholder="Pagne Woodin, col V, doublure..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Statut */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Statut initial
              </label>
              <select
                id="status" // AJOUT DE L'ID
                name="status"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all bg-white"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="en_attente">🟡 En attente</option>
                <option value="en_cours">🔵 En cours</option>
                <option value="termine">🟢 Terminé</option>
              </select>
            </div>

            {/* Bouton Créer */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Créer la commande"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
