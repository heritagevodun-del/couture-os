"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase"; // On remonte de 2 dossiers pour trouver la lib
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewClient() {
  const router = useRouter(); // Pour rediriger l'utilisateur après l'enregistrement
  const [loading, setLoading] = useState(false);

  // Les données du formulaire
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    city: "Cotonou", // Valeur par défaut
    notes: "",
  });

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

  // Fonction qui envoie les données à Supabase quand on clique sur "Enregistrer"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Empêche la page de se recharger
    setLoading(true);

    const { error } = await supabase.from("clients").insert([
      {
        full_name: formData.full_name,
        phone: formData.phone,
        city: formData.city,
        notes: formData.notes,
      },
    ]);

    if (error) {
      // Note: Dans une string JavaScript classique ("..."), on peut utiliser l'apostrophe normale.
      alert("Erreur lors de l'enregistrement !");
      console.error(error);
      setLoading(false);
    } else {
      // Si c'est bon, on retourne à l'accueil
      router.push("/");
      router.refresh(); // Rafraîchit les données de l'accueil
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
            {/* CORRECTION: Ajout de htmlFor et id pour lier le label à l'input */}
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
            {/* C'est ici qu'était l'erreur : le select avait besoin d'un id */}
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
