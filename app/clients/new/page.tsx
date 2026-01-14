"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  FileText,
  Loader2,
} from "lucide-react";

export default function NewClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    city: "",
    notes: "",
  });

  // 1. SÉCURITÉ : On vérifie que l'utilisateur est connecté
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    };
    checkUser();
  }, [router]);

  // Fonction qui gère les changements dans les champs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Fonction d'envoi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Session expirée, veuillez vous reconnecter.");
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("clients").insert([
      {
        full_name: formData.full_name,
        phone: formData.phone,
        city: formData.city || "Non renseigné",
        notes: formData.notes,
        user_id: session.user.id,
      },
    ]);

    if (error) {
      alert("Erreur lors de l'enregistrement ! " + error.message);
      console.error(error);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <Link
            href="/"
            className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-black hover:border-gray-300 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Nouveau Client</h1>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom Complet */}
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  id="full_name"
                  type="text"
                  name="full_name"
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="Ex: Jean Dupont"
                  value={formData.full_name}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Téléphone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Téléphone (International)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  id="phone"
                  type="text"
                  name="phone"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="Ex: +33 6 12..."
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Ville (Champ libre) */}
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ville / Pays
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  id="city"
                  type="text"
                  name="city"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="Ex: Paris, France"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Note (Optionnel)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none transition-all resize-none"
                  placeholder="Préférences, allergies..."
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Bouton */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Enregistrer le client"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
