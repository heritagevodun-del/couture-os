"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useParams, useRouter } from "next/navigation"; // Ajout de useRouter
import Link from "next/link";
import { Trash2 } from "lucide-react"; // Ajout de l'icône poubelle

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
  const router = useRouter(); // Pour la redirection après suppression

  // Données
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Édition des mesures
  const [isEditingMeasurements, setIsEditingMeasurements] = useState(false);
  const [tempMeasurements, setTempMeasurements] = useState<
    Record<string, string>
  >({});

  // --- NOUVEAU : ÉDITION COMMANDE (MODAL) ---
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

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

  // --- LOGIQUE SUPPRESSION CLIENT (NOUVEAU) ---
  const handleDeleteClient = async () => {
    if (!client) return;

    // 1. Confirmation de sécurité
    const confirm = window.confirm(
      "🛑 ATTENTION : Voulez-vous vraiment supprimer ce client ?\n\nCette action est irréversible et effacera également tout l'historique de ses commandes."
    );
    if (!confirm) return;

    setLoading(true);

    // 2. Supprimer d'abord les commandes liées (Nettoyage)
    const { error: ordersError } = await supabase
      .from("orders")
      .delete()
      .eq("client_id", client.id);

    if (ordersError) {
      alert(
        "Erreur lors de la suppression des commandes : " + ordersError.message
      );
      setLoading(false);
      return;
    }

    // 3. Supprimer le client
    const { error: clientError } = await supabase
      .from("clients")
      .delete()
      .eq("id", client.id);

    if (clientError) {
      alert("Erreur lors de la suppression du client : " + clientError.message);
      setLoading(false);
    } else {
      // 4. Redirection vers l'accueil
      router.push("/");
    }
  };

  // --- LOGIQUE MESURES ---
  const handleMeasurementChange = (key: string, value: string) => {
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
      setIsEditingMeasurements(false);
    }
  };

  // --- LOGIQUE MODIFICATION COMMANDES ---
  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    const { error } = await supabase
      .from("orders")
      .update({
        title: editingOrder.title,
        status: editingOrder.status,
        price: editingOrder.price,
      })
      .eq("id", editingOrder.id);

    if (error) {
      alert("Erreur mise à jour commande : " + error.message);
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === editingOrder.id ? editingOrder : o))
      );
      setEditingOrder(null);
    }
  };

  const handleDeleteOrder = async () => {
    if (!editingOrder) return;
    const confirm = window.confirm("Supprimer cette commande définitivement ?");
    if (!confirm) return;

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", editingOrder.id);

    if (error) {
      alert("Erreur suppression : " + error.message);
    } else {
      setOrders((prev) => prev.filter((o) => o.id !== editingOrder.id));
      setEditingOrder(null);
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
      <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <Link
          href="/"
          className="text-gray-500 hover:text-black flex items-center gap-2 text-sm font-medium"
        >
          ← Retour à l&apos;atelier
        </Link>
      </div>

      <div className="max-w-xl mx-auto p-6 flex flex-col gap-6">
        {/* --- 1. CARTE PROFIL (Modifiée avec bouton supprimer) --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center relative">
          {/* BOUTON SUPPRIMER CLIENT (NOUVEAU) */}
          <button
            onClick={handleDeleteClient}
            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
            title="Supprimer ce client"
          >
            <Trash2 size={20} />
          </button>

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
               Commandes
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
                  onClick={() => setEditingOrder(order)}
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center cursor-pointer hover:border-black transition group"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
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
                    <p className="text-xs text-gray-400 mt-1">Modifier ›</p>
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
            {!isEditingMeasurements && (
              <button
                onClick={() => setIsEditingMeasurements(true)}
                className="text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
              >
                Modifier
              </button>
            )}
          </div>

          <div className="p-6">
            {isEditingMeasurements ? (
              // MODE ÉDITION MESURES
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
                          handleMeasurementChange(m.key, e.target.value)
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
                    onClick={() => setIsEditingMeasurements(false)}
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
              // MODE AFFICHAGE MESURES
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

      {/* --- MODAL DE MODIFICATION DE COMMANDE --- */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">
              Modifier la commande
            </h3>

            <div className="space-y-4">
              {/* Titre */}
              <div>
                <label
                  htmlFor="edit-title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Titre
                </label>
                <input
                  id="edit-title"
                  type="text"
                  className="w-full border rounded-lg p-2"
                  value={editingOrder.title}
                  onChange={(e) =>
                    setEditingOrder({ ...editingOrder, title: e.target.value })
                  }
                />
              </div>

              {/* Prix */}
              <div>
                <label
                  htmlFor="edit-price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Prix (FCFA)
                </label>
                <input
                  id="edit-price"
                  type="number"
                  className="w-full border rounded-lg p-2"
                  value={editingOrder.price}
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      price: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              {/* Statut */}
              <div>
                <label
                  htmlFor="edit-status"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Statut
                </label>
                <select
                  id="edit-status"
                  className="w-full border rounded-lg p-2 bg-white"
                  value={editingOrder.status}
                  onChange={(e) =>
                    setEditingOrder({ ...editingOrder, status: e.target.value })
                  }
                >
                  <option value="en_attente">🟡 En attente</option>
                  <option value="en_cours">🔵 En cours</option>
                  <option value="termine">🟢 Terminé</option>
                </select>
              </div>

              {/* Boutons d'action */}
              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={handleUpdateOrder}
                  className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800"
                >
                  Enregistrer les modifications
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingOrder(null)}
                    className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteOrder}
                    className="flex-1 bg-red-50 text-red-600 font-medium py-3 rounded-xl hover:bg-red-100 border border-red-100"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
