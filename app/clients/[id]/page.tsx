"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";

// --- TYPES ---

// 1. Définition des mesures standards
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

// 2. Définition d'une Commande
type Order = {
  id: string;
  title: string;
  deadline: string;
  status: string;
  price: number;
};

// 3. Définition d'un Client
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

  // États (Mémoire de la page)
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour la modification des mesures
  const [isEditing, setIsEditing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tempMeasurements, setTempMeasurements] = useState<Record<string, any>>(
    {}
  );

  // --- CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const fetchData = async () => {
      if (!params || !params.id) return;

      // A. Récupérer le Client
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", params.id)
        .single();

      if (clientError) {
        console.error("Erreur client:", clientError);
      } else {
        setClient(clientData);
        setTempMeasurements(clientData.measurements || {});
      }

      // B. Récupérer ses Commandes
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("client_id", params.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Erreur commandes:", ordersError);
      } else {
        setOrders(ordersData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [params]);

  // --- SAUVEGARDE MESURES ---
  const handleSaveMeasurements = async () => {
    if (!client) return;
    const { error } = await supabase
      .from("clients")
      .update({ measurements: tempMeasurements })
      .eq("id", client.id);

    if (error) {
      alert("Erreur sauvegarde !");
    } else {
      setClient({ ...client, measurements: tempMeasurements });
      setIsEditing(false);
    }
  };

  // --- GESTION INPUT MESURES ---
  const handleInputChange = (key: string, value: string) => {
    setTempMeasurements((prev) => ({ ...prev, [key]: value }));
  };

  // --- ESTHÉTIQUE : COULEURS DES STATUTS ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_attente":
        return "bg-gray-100 text-gray-600";
      case "en_cours":
        return "bg-blue-100 text-blue-700";
      case "termine":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "en_attente":
        return "En attente";
      case "en_cours":
        return "En cours";
      case "termine":
        return "Terminé";
      default:
        return status;
    }
  };

  if (loading)
    return <div className="p-10 text-center text-gray-500">Chargement...</div>;
  if (!client)
    return <div className="p-10 text-center text-red-500">Introuvable</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-black inline-block transition"
        >
          ← Retour à l&apos;atelier
        </Link>

        {/* --- 1. CARTE IDENTITÉ --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
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

        {/* --- 2. COMMANDES --- */}
        <div className="flex justify-between items-end">
          <h2 className="text-xl font-bold text-gray-900">Commandes 👗</h2>
          <Link
            href={`/clients/${client.id}/new-order`}
            className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition"
          >
            + Nouvelle Commande
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {orders.length > 0 ? (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition"
              >
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {order.title}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Livraison : {order.deadline || "Non définie"}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                  <p className="font-bold text-gray-900 mt-2">
                    {order.price ? order.price.toLocaleString() + " FCFA" : "-"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-8 rounded-xl border border-gray-100 border-dashed text-center text-gray-400">
              Aucune commande pour le moment.
            </div>
          )}
        </div>

        {/* --- 3. MESURES --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              📏 Mesures
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm border border-gray-300 px-3 py-1 rounded-lg hover:bg-white transition"
              >
                Modifier
              </button>
            )}
          </div>
          <div className="p-8">
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {STANDARD_MEASUREMENTS.map((m) => (
                  <div key={m.key}>
                    {/* CORRECTION ICI : Ajout de htmlFor et id pour lier le label à l'input */}
                    <label
                      htmlFor={m.key}
                      className="block text-xs font-bold text-gray-500 uppercase mb-1"
                    >
                      {m.label}
                    </label>
                    <input
                      id={m.key}
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      value={tempMeasurements[m.key] || ""}
                      onChange={(e) => handleInputChange(m.key, e.target.value)}
                    />
                  </div>
                ))}
                <div className="col-span-full flex gap-3 pt-4">
                  <button
                    onClick={handleSaveMeasurements}
                    className="flex-1 bg-black text-white py-2 rounded-lg"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 border rounded-lg"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : Object.keys(client.measurements || {}).length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {STANDARD_MEASUREMENTS.map((m) => {
                  const value = client.measurements?.[m.key];
                  if (!value) return null;
                  return (
                    <div
                      key={m.key}
                      className="p-4 bg-gray-50 rounded-lg text-center"
                    >
                      <div className="text-xs text-gray-500 uppercase mb-1">
                        {m.label}
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {value} cm
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-400">Pas de mesures.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
