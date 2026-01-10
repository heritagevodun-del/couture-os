"use client";

import { useState, useEffect } from "react";
// CORRECTION DÉFINITIVE : 3 fois "../" pour remonter à la racine de 'app'
import { supabase } from "../../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function NewOrder() {
  const params = useParams(); // Pour avoir l'ID du client
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    price: "",
    deadline: "",
    description: "",
    status: "en_attente",
  });

  // 1. SÉCURITÉ : Vérification de la session au chargement
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

    if (!params?.id) return;

    // 2. RÉCUPÉRATION DU PROPRIÉTAIRE
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Session expirée. Veuillez vous reconnecter.");
      router.push("/login");
      return;
    }

    // Conversion du prix en nombre (ou 0 si vide)
    const priceInt = formData.price ? parseInt(formData.price) : 0;

    // 3. ENVOI AVEC L'ÉTIQUETTE user_id
    const { error } = await supabase.from("orders").insert([
      {
        client_id: params.id,
        title: formData.title,
        price: priceInt,
        deadline: formData.deadline,
        description: formData.description,
        status: formData.status,
        user_id: session.user.id, // <--- INDISPENSABLE POUR LA SÉCURITÉ
      },
    ]);

    if (error) {
      alert("Erreur lors de la création de la commande ! " + error.message);
      console.error(error);
      setLoading(false);
    } else {
      // Retour au profil du client
      router.push(`/clients/${params.id}`);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Nouvelle Commande 👗
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titre de la commande */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Modèle / Titre
            </label>
            <input
              id="title"
              type="text"
              name="title"
              required
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
              placeholder="Ex: Robe de soirée rouge"
              value={formData.title}
              onChange={handleChange}
            />
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
                id="price"
                type="number"
                name="price"
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
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
              <input
                id="deadline"
                type="date"
                name="deadline"
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
                value={formData.deadline}
                onChange={handleChange}
              />
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
              id="description"
              name="description"
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
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
              id="status"
              name="status"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
            </select>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-6">
            <Link
              href={`/clients/${params?.id}`}
              className="w-1/2 text-center py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? "Création..." : "Créer la commande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
