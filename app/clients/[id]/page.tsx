"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useParams } from "next/navigation"; // J'ai retiré useRouter qui ne servait pas
import Link from "next/link";

// --- 1. CONFIGURATION DES MESURES ---
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
  // CORRECTION 1 : On remplace 'any' par un type précis
  measurements: Record<string, string> | null;
};

type Order = {
  id: string;
  title: string;
  status: string;
  deadline: string;
  price: number;
};

export default function ClientDetails() {
  const params = useParams();
  // CORRECTION 3 : Suppression de 'const router = useRouter()' car inutile ici

  // Données
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Édition des mesures
  const [isEditing, setIsEditing] = useState(false);
  // CORRECTION 1 (bis) : Typage précis pour l'état
  const [tempMeasurements, setTempMeasurements] = useState<
    Record<string, string>
  >({});

  // --- CHARGEMENT ---
  useEffect(() => {
    const fetchClientData = async () => {
      if (!params?.id) return;

      // 1. Charger le client
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", params.id)
        .single();

      if (clientError) {
        console.error("Erreur client:", clientError);
      } else {
        setClient(clientData);
        // On initialise les mesures temporaires avec celles existantes
        setTempMeasurements(clientData.measurements || {});
      }

      // 2. Charger ses commandes
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("client_id", params.id)
        .order("created_at", { ascending: false });

      if (ordersError) console.error("Erreur commandes:", ordersError);
      else setOrders(ordersData || []);

      setLoading(false);
    };

    fetchClientData();
  }, [params?.id]);

  // --- LOGIQUE MESURES ---
  const handleInputChange = (key: string, value: string) => {
    setTempMeasurements((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveMeasurements = async () => {
    if (!client) return;
    const { error } = await supabase
      .from("clients")
      .update({ measurements: tempMeasurements })
      .eq("id", client.id);

    if (error) {
      alert("Erreur lors de la sauvegarde !");
    } else {
      setClient({ ...client, measurements: tempMeasurements });
      setIsEditing(false);
    }
  };

  // --- UTILITAIRES ---
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 animate-pulse">Chargement du dossier...</p>
      </div>
    );
  }

  if (!client) return <p className="text-center p-8">Client introuvable.</p>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Navigation */}
      <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center sticky top-0 z-10">
        <Link
          href="/"
          className="text-gray-500 hover:text-black flex items-center gap-2 text-sm font-medium"
        >
          {/* CORRECTION 2 : Utilisation de &apos; pour l'apostrophe */}← Retour
          à l&apos;atelier
        </Link>
      </div>

      <div className="max-w-xl mx-auto p-6 flex flex-col gap-6">
        {/* --- 1. CARTE PROFIL --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-md mb-4 border-4 border-gray-50">
            {getInitials(client.full_name)}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">
            {client.full_name}
          </h1>
          <div className="flex items-center gap-2 text-gray-500 mt-1 text-sm font-medium">
            <span>📍 {client.city}</span>
          </div>

          <div className="flex gap-3 mt-6 w-full">
            {client.phone && (
              <>
                <a
                  href={`tel:${client.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-900 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  📞 Appeler
                </a>
                <a
                  href={`https://wa.me/${client.phone.replace(/\s+/g, "")}`}
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition shadow-sm"
                >
                  💬 WhatsApp
                </a>
              </>
            )}
          </div>

          {client.notes && (
            <div className="mt-6 w-full bg-yellow-50 border border-yellow-100 p-4 rounded-xl text-left">
              <p className="text-xs text-yellow-600 font-bold uppercase mb-1">
                Note personnelle
              </p>
              {/* CORRECTION 2 : Utilisation de &quot; pour les guillemets */}
              <p className="text-sm text-gray-800 italic">
                &quot;{client.notes}&quot;
              </p>
            </div>
          )}
        </div>

        {/* --- 2. COMMANDES --- */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              👗 Commandes
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {orders.length}
              </span>
            </h2>
            <Link
              href={`/clients/${client.id}/new-order`}
              className="bg-black text-white text-sm px-4 py-2 rounded-lg shadow-md hover:bg-gray-800 transition"
            >
              + Créer
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {orders.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center">
                <p className="text-gray-400 text-sm">
                  Aucune commande pour le moment.
                </p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {order.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      📅 {new Date(order.deadline).toLocaleDateString("fr-FR")}
                    </p>
                    <div className="mt-2">
                      {order.status === "en_attente" && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-medium">
                          En attente
                        </span>
                      )}
                      {order.status === "en_cours" && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          En cours
                        </span>
                      )}
                      {order.status === "termine" && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                          Terminé
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      {order.price.toLocaleString()} F
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- 3. MESURES --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              📏 Mesures
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
              >
                Modifier
              </button>
            )}
          </div>

          <div className="p-6">
            {isEditing ? (
              // --- MODE ÉDITION ---
              <div className="grid grid-cols-2 gap-4">
                {STANDARD_MEASUREMENTS.map((m) => (
                  <div key={m.key}>
                    <label
                      htmlFor={m.key}
                      className="block text-xs font-bold text-gray-500 uppercase mb-1"
                    >
                      {m.label}
                    </label>
                    <div className="relative">
                      <input
                        id={m.key}
                        type="number"
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none font-medium"
                        value={tempMeasurements[m.key] || ""}
                        onChange={(e) =>
                          handleInputChange(m.key, e.target.value)
                        }
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-400 text-sm">
                        cm
                      </span>
                    </div>
                  </div>
                ))}
                <div className="col-span-2 flex gap-3 pt-4 mt-2 border-t border-gray-100">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-3 text-gray-600 font-medium bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveMeasurements}
                    className="flex-1 py-3 bg-black text-white font-bold rounded-xl shadow-md hover:bg-gray-800 transition"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            ) : (
              // --- MODE AFFICHAGE ---
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {STANDARD_MEASUREMENTS.map((m) => {
                  const value = client.measurements?.[m.key];
                  return (
                    <div
                      key={m.key}
                      className="p-3 bg-gray-50 rounded-xl text-center border border-gray-100"
                    >
                      <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                        {m.label}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {value ? `${value} cm` : "-"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
