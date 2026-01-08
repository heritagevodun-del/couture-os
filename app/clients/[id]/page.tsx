"use client";

import { useEffect, useState } from "react";
// Le chemin est correct : on remonte de [id] -> clients -> app, puis on descend dans lib
import { supabase } from "../../lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";

type Client = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  notes: string;
  // Ci-dessous, on dit à ESLint d'ignorer la règle 'no-explicit-any' juste pour cette ligne
  // car la structure des mesures sera définie dans la prochaine étape.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  measurements: Record<string, any> | null;
};

export default function ClientProfile() {
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      if (!params || !params.id) return;

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) {
        console.error("Erreur:", error);
      } else {
        setClient(data);
      }
      setLoading(false);
    };

    fetchClient();
  }, [params]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Chargement du profil...
      </div>
    );

  if (!client)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Client introuvable 😢
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Bouton retour */}
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-black mb-6 inline-block transition"
        >
          ← Retour à l&apos;atelier
        </Link>

        {/* En-tête Profil */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {client.full_name}
              </h1>
              <div className="flex gap-4 mt-2 text-gray-500">
                <span className="flex items-center gap-1">
                  📍 {client.city}
                </span>
                <span className="flex items-center gap-1">
                  📞 {client.phone || "Pas de numéro"}
                </span>
              </div>
            </div>

            {/* Avatar avec initiales */}
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
              {client.full_name.charAt(0)}
            </div>
          </div>

          {client.notes && (
            <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100">
              <strong>Note :</strong> {client.notes}
            </div>
          )}
        </div>

        {/* Zone des Mesures */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="text-4xl mb-4">📏</div>
          <h3 className="text-xl font-semibold text-gray-900">
            Mesures du client
          </h3>
          <p className="text-gray-500 mt-2 mb-6 max-w-md">
            Aucune mesure enregistrée pour le moment.
          </p>
          <button className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition">
            + Ajouter des mesures
          </button>
        </div>
      </div>
    </div>
  );
}
