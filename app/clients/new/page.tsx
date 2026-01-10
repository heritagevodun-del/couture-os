"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Les données du formulaire
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    city: "Cotonou",
    notes: "",
  });

  // 1. SÉCURITÉ : On vérifie que l'utilisateur est connecté
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        // Pas connecté ? Hop, au login !
        router.push("/login");
      }
    };
    checkUser();
  }, [router]);

  // Fonction qui gère les changements dans les champs
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

  // Fonction d'envoi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 2. RÉCUPÉRATION DE L'ID UTILISATEUR
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Session expirée, veuillez vous reconnecter.");
      router.push("/login");
      return;
    }

    // 3. ENVOI AVEC L'ÉTIQUETTE DU PROPRIÉTAIRE (user_id)
    const { error } = await supabase.from("clients").insert([
      {
        full_name: formData.full_name,
        phone: formData.phone,
        city: formData.city,
        notes: formData.notes, // Assure-toi que cette colonne existe dans ta table Supabase !
        user_id: session.user.id, // <--- C'EST LA CLÉ DE LA SÉCURITÉ ICI
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Nouveau Client 🧵
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom Complet */}
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nom complet
            </label>
            <input
              id="full_name"
              type="text"
              name="full_name"
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: Tantine Gisèle"
              value={formData.full_name}
              onChange={handleChange}
            />
          </div>

          {/* Téléphone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Téléphone
            </label>
            <input
              id="phone"
              type="text"
              name="phone"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ex: +229 97..."
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          {/* Ville */}
          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Ville
            </label>
            <select
              id="city"
              name="city"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.city}
              onChange={handleChange}
            >
              <option value="Cotonou">Cotonou</option>
              <option value="Porto-Novo">Porto-Novo</option>
              <option value="Parakou">Parakou</option>
              <option value="Abomey">Abomey</option>
              <option value="Ouidah">Ouidah</option>
              <option value="Abidjan">Abidjan</option>
              <option value="Accra">Accra</option>
              <option value="Douala">Douala</option>
              <option value="Yaoundé">Yaoundé</option>
              <option value="Lagos">Lagos</option>
              <option value="Ibadan">Ibadan</option>
              <option value="Libreville">Libreville</option>
              <option value="Paris">Paris</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Note (Optionnel)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Préférences, allergies..."
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <Link
              href="/"
              className="w-1/2 text-center py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? "Ajout..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
