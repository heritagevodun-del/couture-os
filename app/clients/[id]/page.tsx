"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trash2,
  FileText,
  MessageCircle,
  CheckCircle2,
  Edit2,
  X,
  ArrowLeft,
  Ruler,
  ShoppingBag,
  Phone,
  MapPin,
  StickyNote,
  Loader2,
  Plus,
} from "lucide-react";
import { generateInvoice } from "../../utils/invoiceGenerator";
import { MEASUREMENT_TEMPLATES } from "../../constants/measurements";

// --- TYPES ---
type Client = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  notes: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  measurements: any;
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

export default function ClientDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopProfile, setShopProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // États d'édition
  const [isEditingMeasurements, setIsEditingMeasurements] = useState(false);
  const [tempMeasurements, setTempMeasurements] = useState<
    Record<string, string>
  >({});

  const [isEditingClient, setIsEditingClient] = useState(false);
  const [tempClientData, setTempClientData] = useState({
    full_name: "",
    phone: "",
    city: "",
    notes: "",
  });

  // --- 1. CHARGEMENT DES DONNÉES ---
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // A. Profil Boutique
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setShopProfile({
          shop_name: profile.shop_name,
          shop_address: profile.shop_address || "",
          shop_phone: profile.shop_phone || "",
          email: user.email || "",
          currency: profile.currency || "FCFA",
        });
      }

      // B. Client
      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
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

      // C. Commandes
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false });

      setOrders(ordersData || []);
      setLoading(false);
    };

    fetchData();
  }, [id, router]);

  // --- 2. LOGIQUE MÉTIER ---

  const currentTemplateId =
    client?.measurements?._template_id || "femme_standard";
  const currentTemplate =
    MEASUREMENT_TEMPLATES.find((t) => t.id === currentTemplateId) ||
    MEASUREMENT_TEMPLATES[0];

  const getLabelForField = (key: string) => {
    if (key.startsWith("_")) return null;
    const field = currentTemplate.fields.find((f) => f.id === key);
    return field ? field.label : key.replace(/_/g, " ");
  };

  // Mise à jour infos client
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
      alert("Erreur : " + error.message);
    } else {
      setClient({ ...client, ...tempClientData });
      setIsEditingClient(false);
    }
  };

  // Sauvegarde Mesures
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

  // Suppression Client
  const handleDeleteClient = async () => {
    if (!client) return;
    if (
      !confirm(
        "🛑 ATTENTION : Supprimer ce client effacera aussi son historique. Continuer ?",
      )
    )
      return;
    setLoading(true);
    await supabase.from("orders").delete().eq("client_id", client.id);
    await supabase.from("clients").delete().eq("id", client.id);
    router.push("/clients");
  };

  // Génération Facture
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

  // WhatsApp
  const sendWhatsApp = (type: "reminder" | "ready", order: Order) => {
    if (!client?.phone) return alert("Pas de numéro de téléphone.");
    const shop = shopProfile?.shop_name || "L'Atelier";
    const cleanPhone = client.phone.replace(/[^0-9]/g, "");
    let msg = "";

    if (type === "reminder") {
      msg = `Bonjour ${client.full_name} 👋, c'est ${shop}. Rappel pour votre commande "${order.title}". Reste à payer : ${order.price} ${shopProfile?.currency}. Merci !`;
    } else {
      msg = `Bonne nouvelle ${client.full_name} ! 🎉 Votre commande "${order.title}" est prête à l'atelier. À très vite !`;
    }
    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };

  // --- RENDER ---

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );

  if (!client)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 text-gray-500">
        Client introuvable.
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-24 transition-colors duration-300">
      {/* HEADER NAV */}
      <div className="bg-white dark:bg-neutral-900 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 z-20">
        <Link
          href="/clients"
          className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-2 text-sm font-bold transition-colors"
        >
          <ArrowLeft size={18} /> Retour
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditingClient(true)}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            aria-label="Modifier le client"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={handleDeleteClient}
            className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors"
            aria-label="Supprimer le client"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* CARTE IDENTITÉ */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-lg">
            {client.full_name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {client.full_name}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <span className="flex items-center gap-1">
              <Phone size={14} /> {client.phone}
            </span>
            {client.city && (
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {client.city}
              </span>
            )}
          </div>

          <div className="flex gap-3 w-full max-w-sm">
            <a
              href={`tel:${client.phone}`}
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white py-3 rounded-xl font-bold text-sm hover:opacity-80 transition flex justify-center items-center gap-2"
            >
              <Phone size={16} /> Appeler
            </a>
            <a
              href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              className="flex-1 bg-[#25D366] text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition flex justify-center items-center gap-2"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
          </div>

          {client.notes && (
            <div className="mt-6 w-full bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 p-4 rounded-xl text-left flex gap-3">
              <StickyNote className="text-yellow-600 shrink-0" size={20} />
              <p className="text-sm text-gray-800 dark:text-gray-300 italic">
                {client.notes}
              </p>
            </div>
          )}
        </div>

        {/* SECTION MESURES */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Ruler size={16} /> Mesures ({currentTemplate.label})
            </h2>
            {!isEditingMeasurements ? (
              <button
                onClick={() => setIsEditingMeasurements(true)}
                className="text-xs font-bold text-black dark:text-white hover:underline"
              >
                Modifier
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingMeasurements(false)}
                  className="text-xs font-bold text-gray-500 hover:text-black"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveMeasurements}
                  className="text-xs font-bold text-green-600 hover:text-green-700"
                >
                  Sauvegarder
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(tempMeasurements).map(([key, value]) => {
                const label = getLabelForField(key);
                if (!label) return null;

                return (
                  <div
                    key={key}
                    className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700"
                  >
                    <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 truncate">
                      {label}
                    </span>
                    {isEditingMeasurements ? (
                      <input
                        type="number"
                        className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white outline-none font-bold text-gray-900 dark:text-white"
                        value={value}
                        onChange={(e) =>
                          setTempMeasurements((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        aria-label={`Modifier ${label}`}
                      />
                    ) : (
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {value}{" "}
                        <span className="text-xs font-normal text-gray-400">
                          cm
                        </span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {Object.keys(tempMeasurements).filter((k) => !k.startsWith("_"))
              .length === 0 && (
              <p className="text-center text-gray-400 text-sm italic">
                Aucune mesure enregistrée.
              </p>
            )}
          </div>
        </div>

        {/* SECTION COMMANDES (CORRIGÉE : AJOUT DU BOUTON CREATE) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <ShoppingBag size={16} /> Historique Commandes
            </h2>
            {/* BOUTON RAJOUTÉ ICI */}
            <Link
              href={`/clients/${id}/new-order`}
              className="flex items-center gap-1 bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:scale-105 transition-transform"
            >
              <Plus size={14} /> Créer
            </Link>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl text-gray-400 text-sm">
                Aucune commande pour ce client.
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {order.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Livraison :{" "}
                        {new Date(order.deadline).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {order.price.toLocaleString()} {shopProfile?.currency}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                        order.status === "termine"
                          ? "bg-green-100 text-green-700"
                          : order.status === "en_cours"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status.replace("_", " ")}
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleDownloadInvoice(e, order)}
                        className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
                        title="Facture"
                        aria-label="Télécharger la facture"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        onClick={() => sendWhatsApp("ready", order)}
                        className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition"
                        title="Prévenir client"
                        aria-label="Envoyer message WhatsApp"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL EDIT CLIENT */}
      {isEditingClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">
              <h3 className="font-bold text-lg dark:text-white">
                Modifier Client
              </h3>
              <button
                onClick={() => setIsEditingClient(false)}
                aria-label="Fermer"
              >
                <X className="dark:text-white" size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Nom complet
                </label>
                <input
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white"
                  placeholder="Nom complet"
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
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Téléphone
                </label>
                <input
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white"
                  placeholder="Téléphone"
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
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Ville
                </label>
                <input
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white"
                  placeholder="Ville"
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
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Notes
                </label>
                <textarea
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none dark:text-white"
                  placeholder="Notes..."
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
              <button
                onClick={handleUpdateClient}
                className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
