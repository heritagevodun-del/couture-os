"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";

// Liste des mesures standards pour la couture
const STANDARD_MEASUREMENTS = [
  { key: "poitrine", label: "Tour de Poitrine" },
  { key: "taille", label: "Tour de Taille" },
  { key: "bassin", label: "Tour de Bassin" },
  { key: "epaule", label: "Épaule à Épaule" },
  { key: "manche", label: "Longueur Manche" },
  { key: "longueur_totale", label: "Longueur Totale" },
  { key: "cuisse", label: "Tour de Cuisse" },
  { key: "dos", label: "Longueur Dos" },
];

type Client = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  notes: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  measurements: Record<string, any> | null;
};

export default function ClientProfile() {
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Mode Édition : Si vrai, on affiche des champs de saisie. Si faux, on affiche le texte.
  const [isEditing, setIsEditing] = useState(false);

  // Variable temporaire pour stocker les mesures pendant qu'on tape
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tempMeasurements, setTempMeasurements] = useState<Record<string, any>>(
    {}
  );

  // 1. Chargement du client
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
        // On initialise les mesures temporaires avec ce qu'il y a dans la base (ou vide)
        setTempMeasurements(data.measurements || {});
      }
      setLoading(false);
    };

    fetchClient();
  }, [params]);

  // 2. Fonction pour sauvegarder les nouvelles mesures
  const handleSave = async () => {
    if (!client) return;

    // On envoie la mise à jour à Supabase
    const { error } = await supabase
      .from("clients")
      .update({ measurements: tempMeasurements }) // On envoie le JSON complet
      .eq("id", client.id);

    if (error) {
      alert("Erreur lors de la sauvegarde !");
      console.error(error);
    } else {
      // Mise à jour locale (pour voir le résultat sans recharger)
      setClient({ ...client, measurements: tempMeasurements });
      setIsEditing(false); // On quitte le mode édition
    }
  };

  // 3. Fonction pour gérer la saisie dans les champs
  const handleInputChange = (key: string, value: string) => {
    setTempMeasurements((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (loading)
    return <div className="p-10 text-center text-gray-500">Chargement...</div>;
  if (!client)
    return <div className="p-10 text-center text-red-500">Introuvable</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-black mb-6 inline-block transition"
        >
          ← Retour à l&apos;atelier
        </Link>

        {/* --- CARTE D'IDENTITÉ --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {client.full_name}
              </h1>
              <div className="flex gap-4 mt-2 text-gray-500">
                <span>📍 {client.city}</span>
                <span>📞 {client.phone || "Pas de numéro"}</span>
              </div>
            </div>
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
              {client.full_name.charAt(0)}
            </div>
          </div>
          {client.notes && (
            <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-100">
              {client.notes}
            </div>
          )}
        </div>

        {/* --- ZONE DES MESURES --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Titre et Bouton Modifier */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              📏 Prise de Mesures
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition"
              >
                ✏️ Modifier
              </button>
            )}
          </div>

          <div className="p-8">
            {isEditing ? (
              /* --- MODE ÉDITION (Formulaire) --- */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {STANDARD_MEASUREMENTS.map((m) => (
                  <div key={m.key}>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                      {m.label} (cm)
                    </label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black outline-none"
                      value={tempMeasurements[m.key] || ""}
                      onChange={(e) => handleInputChange(m.key, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                ))}

                {/* Boutons Sauvegarder / Annuler */}
                <div className="col-span-1 md:col-span-2 flex gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition"
                  >
                    💾 Enregistrer les mesures
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              /* --- MODE AFFICHAGE (Lecture seule) --- */
              <div>
                {/* On vérifie s'il y a au moins une mesure enregistrée */}
                {Object.keys(client.measurements || {}).length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {STANDARD_MEASUREMENTS.map((m) => {
                      const value = client.measurements?.[m.key];
                      // On n'affiche que les mesures qui ont une valeur
                      if (!value) return null;
                      return (
                        <div
                          key={m.key}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center"
                        >
                          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            {m.label}
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {value}{" "}
                            <span className="text-sm font-normal text-gray-400">
                              cm
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Si aucune mesure
                  <div className="text-center py-10">
                    <p className="text-gray-400 mb-4">
                      Aucune mesure pour l&apos;instant.
                    </p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition"
                    >
                      + Commencer la prise de mesures
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
