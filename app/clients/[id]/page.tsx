"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trash2,
  FileText,
  MessageCircle,
  BellRing,
  CheckCircle2,
  Edit2,
  X,
  Save,
  Loader2, // On l'utilise maintenant !
} from "lucide-react";
import { generateInvoice } from "../../utils/invoiceGenerator";

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
  description: string;
  created_at: string;
};

type ShopProfile = {
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  email: string;
  currency: string;
};

export default function ClientDetails() {
  const params = useParams();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [isEditingMeasurements, setIsEditingMeasurements] = useState(false);
  const [tempMeasurements, setTempMeasurements] = useState<
    Record<string, string>
  >({});
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [isEditingClient, setIsEditingClient] = useState(false);
  const [tempClientData, setTempClientData] = useState({
    full_name: "",
    phone: "",
    city: "",
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!params?.id) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setShopProfile({
            shop_name: profile.shop_name,
            shop_address: profile.shop_address,
            shop_phone: profile.shop_phone,
            email: user.email || "",
            currency: profile.currency || "FCFA",
          });
        }
      }

      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", params.id)
        .single();

      if (clientData) {
        setClient(clientData);
        setTempMeasurements(clientData.measurements || {});
        setTempClientData({
          full_name: clientData.full_name,
          phone: clientData.phone,
          city: clientData.city,
          notes: clientData.notes || "",
        });
      }

      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("client_id", params.id)
        .order("created_at", { ascending: false });

      setOrders(ordersData || []);
      setLoading(false);
    };

    fetchData();
  }, [params?.id]);

  const handleUpdateClient = async () => {
    if (!client) return;
    const { error } = await supabase
      .from("clients")
      .update({
        full_name: tempClientData.full_name,
        phone: tempClientData.phone,
        city: tempClientData.city,
        notes: tempClientData.notes,
      })
      .eq("id", client.id);

    if (error) {
      alert("Erreur lors de la mise à jour : " + error.message);
    } else {
      setClient({ ...client, ...tempClientData });
      setIsEditingClient(false);
    }
  };

  const sendWhatsAppMessage = (type: "reminder" | "ready", order: Order) => {
    if (!client || !client.phone) {
      alert("Ajoutez d'abord un numéro de téléphone au client.");
      return;
    }

    const shopName = shopProfile?.shop_name || "L'Atelier";
    const currency = shopProfile?.currency || "FCFA";
    const cleanPhone = client.phone.replace(/[^0-9]/g, "");

    let message = "";

    if (type === "reminder") {
      message = `Bonjour ${
        client.full_name
      }, ici ${shopName}. 👋\n\nPetit rappel concernant votre commande "${
        order.title
      }".\nMontant total : ${order.price.toLocaleString()} ${currency}.\n\nMerci de votre confiance ! 🧵`;
    } else if (type === "ready") {
      message = `Bonne nouvelle ${client.full_name} ! 🎉\n\nVotre tenue "${order.title}" est terminée et prête à être récupérée à ${shopName}.\n\nÀ très vite !`;
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  const handleDownloadInvoice = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    if (!client) return;

    const index = orders.findIndex((o) => o.id === order.id);
    const sequentialNumber = orders.length - index;

    const currentShop = shopProfile || {
      shop_name: "Votre Atelier",
      shop_address: "",
      shop_phone: "",
      email: "",
      currency: "FCFA",
    };

    generateInvoice({
      shop: {
        name: currentShop.shop_name,
        address: currentShop.shop_address,
        phone: currentShop.shop_phone,
        email: currentShop.email,
        currency: currentShop.currency,
      },
      client: {
        name: client.full_name,
        phone: client.phone,
        city: client.city,
      },
      order: {
        id: order.id,
        title: order.title,
        date: new Date().toISOString().split("T")[0],
        deadline: order.deadline,
        description: order.description,
        price: order.price,
        status: order.status,
        client_order_number: sequentialNumber,
      },
    });
  };

  const handleDeleteClient = async () => {
    if (!client) return;
    if (
      !confirm("🛑 ATTENTION : Supprimer ce client et toutes ses commandes ?")
    )
      return;
    setLoading(true);

    await supabase.from("orders").delete().eq("client_id", client.id);
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", client.id);

    if (error) {
      alert("Erreur : " + error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  const handleSaveMeasurements = async () => {
    if (!client) return;
    const { error } = await supabase
      .from("clients")
      .update({ measurements: tempMeasurements })
      .eq("id", client.id);
    if (!error) {
      setClient({ ...client, measurements: tempMeasurements });
      setIsEditingMeasurements(false);
    }
  };

  const handleMeasurementChange = (key: string, value: string) => {
    setTempMeasurements((prev) => ({ ...prev, [key]: value }));
  };

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

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === editingOrder.id ? editingOrder : o))
      );
      setEditingOrder(null);
    }
  };

  const handleDeleteOrder = async () => {
    if (!editingOrder) return;
    if (!window.confirm("Supprimer cette commande ?")) return;
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", editingOrder.id);
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== editingOrder.id));
      setEditingOrder(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // --- CORRECTION ICI : Utilisation de Loader2 ---
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );

  if (!client) return <p className="text-center p-8">Client introuvable.</p>;

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <Link
          href="/"
          className="text-gray-500 hover:text-black flex items-center gap-2 text-sm font-medium"
        >
          ← Retour
        </Link>
      </div>

      <div className="max-w-xl mx-auto p-6 flex flex-col gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center relative group">
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => setIsEditingClient(true)}
              className="p-2 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-full transition-all"
              title="Modifier les infos client"
              aria-label="Modifier les infos client"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={handleDeleteClient}
              className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-all"
              title="Supprimer ce client"
              aria-label="Supprimer ce client"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-md mb-4 border-4 border-gray-50">
            {getInitials(client.full_name)}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">
            {client.full_name}
          </h1>
          <p className="text-gray-500 text-sm font-medium mt-1">
            📍 {client.city}
          </p>

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
                  href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition shadow-sm"
                >
                  <MessageCircle size={18} /> WhatsApp
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

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              Commandes{" "}
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
              <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400 text-sm">
                Aucune commande.
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => setEditingOrder(order)}
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-black transition group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                        {order.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        📅{" "}
                        {new Date(order.deadline).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900">
                      {order.price.toLocaleString()} {shopProfile?.currency}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                    <div className="flex gap-2">
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

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleDownloadInvoice(e, order)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Télécharger la facture"
                        aria-label="Télécharger la facture"
                      >
                        <FileText size={18} />
                      </button>

                      {client.phone &&
                        (order.status === "termine" ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendWhatsAppMessage("ready", order);
                            }}
                            className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition"
                            title="Prévenir que c'est prêt"
                            aria-label="Prévenir que c'est prêt"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sendWhatsAppMessage("reminder", order);
                            }}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Relancer pour paiement"
                            aria-label="Relancer pour paiement"
                          >
                            <BellRing size={18} />
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">📏 Mesures</h2>
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
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none font-medium"
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {STANDARD_MEASUREMENTS.map((m) => (
                  <div
                    key={m.key}
                    className="p-3 bg-gray-50 rounded-xl text-center border border-gray-100"
                  >
                    <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mb-1">
                      {m.label}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {client.measurements?.[m.key]
                        ? `${client.measurements[m.key]} cm`
                        : "-"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditingClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in">
            <h3 className="text-lg font-bold mb-4 border-b pb-2 flex items-center justify-between">
              Modifier le client
              <button
                onClick={() => setIsEditingClient(false)}
                className="text-gray-400 hover:text-black"
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="client-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nom complet
                </label>
                <input
                  id="client-name"
                  type="text"
                  className="w-full border rounded-lg p-3"
                  value={tempClientData.full_name}
                  onChange={(e) =>
                    setTempClientData({
                      ...tempClientData,
                      full_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="client-phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Téléphone
                </label>
                <input
                  id="client-phone"
                  type="text"
                  className="w-full border rounded-lg p-3"
                  value={tempClientData.phone}
                  onChange={(e) =>
                    setTempClientData({
                      ...tempClientData,
                      phone: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="client-city"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Ville
                </label>
                <input
                  id="client-city"
                  type="text"
                  className="w-full border rounded-lg p-3"
                  value={tempClientData.city}
                  onChange={(e) =>
                    setTempClientData({
                      ...tempClientData,
                      city: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="client-notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Notes
                </label>
                <textarea
                  id="client-notes"
                  className="w-full border rounded-lg p-3"
                  rows={3}
                  value={tempClientData.notes}
                  onChange={(e) =>
                    setTempClientData({
                      ...tempClientData,
                      notes: e.target.value,
                    })
                  }
                />
              </div>
              <div className="pt-2">
                <button
                  onClick={handleUpdateClient}
                  className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 flex items-center justify-center gap-2"
                >
                  <Save size={18} /> Enregistrer les modifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">
              Modifier la commande
            </h3>
            <div className="space-y-4">
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
              <div>
                <label
                  htmlFor="edit-price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Prix
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
                    setEditingOrder({
                      ...editingOrder,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="en_attente">🟡 En attente</option>
                  <option value="en_cours">🔵 En cours</option>
                  <option value="termine">🟢 Terminé</option>
                </select>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button
                  onClick={handleUpdateOrder}
                  className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800"
                >
                  Enregistrer
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingOrder(null)}
                    className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 rounded-xl"
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
