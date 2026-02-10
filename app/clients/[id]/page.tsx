"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
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
  ChevronDown,
} from "lucide-react";
import { generateInvoice } from "../../utils/invoiceGenerator";
import { MEASUREMENT_TEMPLATES } from "../../constants/measurements";

// --- TYPES ---
type CustomFieldDef = { id: string; label: string };

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
  advance: number;
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
  const supabase = createClient();

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
          shop_name: profile.shop_name || "Mon Atelier",
          shop_address: profile.shop_address || "",
          shop_phone: profile.shop_phone || "",
          email: user.email || "",
          currency: profile.currency || "FCFA",
        });
      }

      // B. Client
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (clientError || !clientData) {
        console.error("Erreur client:", clientError);
        setLoading(false);
        return;
      }

      setClient(clientData);
      setTempMeasurements(clientData.measurements || {});
      setTempClientData({
        full_name: clientData.full_name,
        phone: clientData.phone,
        city: clientData.city,
        notes: clientData.notes || "",
      });

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
  }, [id, router, supabase]);

  // --- 2. LOGIQUE MÉTIER ---

  const currentTemplateId =
    client?.measurements?._template_id || "femme_standard";
  const currentTemplate =
    MEASUREMENT_TEMPLATES.find((t) => t.id === currentTemplateId) ||
    MEASUREMENT_TEMPLATES[0];

  // ✅ CORRECTION AFFICHAGE CUSTOM
  const getLabelForField = (key: string) => {
    if (key.startsWith("_") && key !== "_custom_fields_def") return null;

    // 1. Chercher dans le template standard
    const field = currentTemplate.fields.find((f) => f.id === key);
    if (field) return field.label;

    // 2. Chercher dans les définitions custom enregistrées
    const customDefs: CustomFieldDef[] =
      client?.measurements?._custom_fields_def || [];
    const customField = customDefs.find((f) => f.id === key);
    if (customField) return customField.label;

    // 3. Fallback
    return key.replace(/_/g, " ").replace("custom", "Mesure");
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
        "🛑 ATTENTION : Supprimer ce client effacera aussi son historique de commandes. Continuer ?",
      )
    )
      return;

    setLoading(true);
    await supabase.from("orders").delete().eq("client_id", client.id);
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", client.id);

    if (error) {
      alert("Erreur lors de la suppression");
      setLoading(false);
    } else {
      router.push("/clients");
    }
  };

  // ✅ Changement de statut de commande
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      );
    }
  };

  // Génération Facture
  const handleDownloadInvoice = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    if (!client) return;

    const sortedOrders = [...orders].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    const sequentialNumber =
      sortedOrders.findIndex((o) => o.id === order.id) + 1;

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
        date: order.created_at,
        deadline: order.deadline,
        description: order.description,
        price: order.price,
        advance: order.advance || 0,
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

    const reste = order.price - (order.advance || 0);
    const devise = shopProfile?.currency || "FCFA";
    let msg = "";

    if (type === "reminder") {
      msg = `Bonjour ${client.full_name} 👋, c'est ${shop}. Petit rappel pour votre commande "${order.title}". Reste à payer : ${reste.toLocaleString()} ${devise}. Merci !`;
    } else {
      msg = `Bonne nouvelle ${client.full_name} ! 🎉 Votre commande "${order.title}" est prête. Reste à payer : ${reste.toLocaleString()} ${devise}. À très vite !`;
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );

  if (!client)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-950 text-gray-500 gap-4">
        <p>Client introuvable ou supprimé.</p>
        <Link href="/clients" className="text-black dark:text-white underline">
          Retour aux clients
        </Link>
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-24 transition-colors duration-300">
      {/* HEADER NAV STICKY */}
      <div className="bg-white dark:bg-neutral-900 px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 z-20 shadow-sm md:shadow-none">
        <Link
          href="/clients"
          className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-2 text-sm font-bold transition-colors"
        >
          <ArrowLeft size={18} />{" "}
          <span className="hidden md:inline">Retour liste</span>
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditingClient(true)}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            title="Modifier"
            // ✅ FIX A11Y : Label explicite
            aria-label="Modifier les informations client"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={handleDeleteClient}
            className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-colors"
            title="Supprimer"
            // ✅ FIX A11Y : Label explicite
            aria-label="Supprimer le client"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
        {/* CARTE IDENTITÉ */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-gray-50 to-transparent dark:from-gray-800/50 dark:to-transparent -z-0" />

          <div className="relative z-10 w-24 h-24 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-xl ring-4 ring-white dark:ring-neutral-900">
            {client.full_name.charAt(0).toUpperCase()}
          </div>

          <h1 className="relative z-10 text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {client.full_name}
          </h1>

          <div className="relative z-10 flex flex-wrap justify-center items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
              <Phone size={12} /> {client.phone}
            </span>
            {client.city && (
              <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                <MapPin size={12} /> {client.city}
              </span>
            )}
          </div>

          <div className="relative z-10 flex gap-3 w-full max-w-sm">
            <a
              href={`tel:${client.phone}`}
              className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition flex justify-center items-center gap-2"
            >
              <Phone size={18} /> Appeler
            </a>
            <a
              href={`https://wa.me/${client.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#25D366] text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 transition flex justify-center items-center gap-2 shadow-lg shadow-green-100 dark:shadow-none"
            >
              <MessageCircle size={18} /> WhatsApp
            </a>
          </div>

          {client.notes && (
            <div className="relative z-10 mt-6 w-full bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 p-4 rounded-xl text-left flex gap-3">
              <StickyNote className="text-yellow-600 shrink-0" size={20} />
              <p className="text-sm text-gray-800 dark:text-gray-300 italic">
                {client.notes}
              </p>
            </div>
          )}
        </div>

        {/* SECTION MESURES */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/30">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Ruler size={16} /> Mesures ({currentTemplate.label})
            </h2>
            {!isEditingMeasurements ? (
              <button
                onClick={() => setIsEditingMeasurements(true)}
                className="text-xs font-bold text-black dark:text-white hover:underline bg-white dark:bg-black px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                Modifier
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditingMeasurements(false)}
                  className="text-xs font-bold text-gray-500 hover:text-black px-3 py-1.5"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveMeasurements}
                  className="text-xs font-bold text-white bg-black dark:bg-white dark:text-black px-3 py-1.5 rounded-lg shadow-sm"
                >
                  Sauvegarder
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(tempMeasurements).map(([key, value]) => {
                if (key.startsWith("_") && key !== "_custom_fields_def")
                  return null;
                if (key === "_custom_fields_def") return null;

                const label = getLabelForField(key);
                if (!label) return null;

                return (
                  <div
                    key={key}
                    className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800"
                  >
                    <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 truncate">
                      {label}
                    </span>
                    {isEditingMeasurements ? (
                      <input
                        type="number"
                        inputMode="decimal"
                        className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white outline-none font-bold text-gray-900 dark:text-white p-0 text-lg"
                        value={value}
                        onChange={(e) =>
                          setTempMeasurements((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        // ✅ FIX A11Y : Label pour l'input
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
          </div>
        </div>

        {/* SECTION COMMANDES */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <ShoppingBag size={16} /> Historique Commandes
            </h2>
            <Link
              href={`/clients/${id}/new-order`}
              className="flex items-center gap-1 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-xs font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-gray-200 dark:shadow-none"
            >
              <Plus size={14} /> Créer
            </Link>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-gray-400 text-sm bg-gray-50 dark:bg-gray-900/50">
                <ShoppingBag size={32} className="mx-auto mb-2 opacity-20" />
                Aucune commande pour ce client.
              </div>
            ) : (
              orders.map((order) => {
                const reste = order.price - (order.advance || 0);
                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 transition hover:shadow-md"
                  >
                    {/* Header Commande */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base">
                          {order.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Livraison :{" "}
                          <span className="font-medium">
                            {new Date(order.deadline).toLocaleDateString()}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900 dark:text-white block text-lg">
                          {order.price.toLocaleString()}{" "}
                          <span className="text-sm font-normal text-gray-500">
                            {shopProfile?.currency}
                          </span>
                        </span>
                        {/* Étiquette Paiement */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${reste > 0 ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"}`}
                        >
                          {reste > 0
                            ? `Reste: ${reste.toLocaleString()}`
                            : "Payé ✔"}
                        </span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800 gap-2">
                      {/* ✅ SÉLECTEUR DE STATUT */}
                      <div className="relative">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleUpdateStatus(order.id, e.target.value)
                          }
                          // ✅ FIX A11Y : Label pour le select
                          aria-label={`Statut de la commande ${order.title}`}
                          className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer border-none outline-none transition-colors ${
                            order.status === "termine"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                              : order.status === "en_cours"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                          }`}
                        >
                          <option value="en_attente">En attente</option>
                          <option value="en_cours">En cours</option>
                          <option value="essayage">Essayage</option>
                          <option value="termine">Terminé</option>
                        </select>
                        <ChevronDown
                          size={12}
                          className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                        />
                      </div>

                      <div className="flex gap-2">
                        {/* Bouton Facture */}
                        <button
                          onClick={(e) => handleDownloadInvoice(e, order)}
                          className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition border border-gray-100 dark:border-gray-700"
                          title="Facture PDF"
                          // ✅ FIX A11Y : Label
                          aria-label="Télécharger la facture"
                        >
                          <FileText size={16} />
                        </button>

                        {/* Bouton WhatsApp */}
                        <button
                          onClick={() => sendWhatsApp("ready", order)}
                          className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition border border-green-100 dark:border-green-900/30 flex items-center gap-1"
                          title="Envoyer message 'Prêt'"
                          // ✅ FIX A11Y : Label
                          aria-label="Envoyer un message WhatsApp"
                        >
                          <CheckCircle2 size={16} />
                          <span className="text-xs font-bold hidden sm:inline">
                            Prêt
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL EDIT CLIENT */}
      {isEditingClient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl dark:text-white">
                Modifier Client
              </h3>
              <button
                onClick={() => setIsEditingClient(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                // ✅ FIX A11Y : Label
                aria-label="Fermer la fenêtre"
              >
                <X className="dark:text-white" size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {/* ✅ FIX A11Y : Ajout de ID et HTMLFOR */}
              <div>
                <label
                  className="block text-xs font-bold text-gray-500 mb-1 ml-1"
                  htmlFor="edit-fullname"
                >
                  Nom complet
                </label>
                <input
                  id="edit-fullname"
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white font-medium"
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
                <label
                  className="block text-xs font-bold text-gray-500 mb-1 ml-1"
                  htmlFor="edit-phone"
                >
                  Téléphone
                </label>
                <input
                  id="edit-phone"
                  type="tel"
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white font-medium"
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
                <label
                  className="block text-xs font-bold text-gray-500 mb-1 ml-1"
                  htmlFor="edit-city"
                >
                  Ville
                </label>
                <input
                  id="edit-city"
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white dark:text-white font-medium"
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
                <label
                  className="block text-xs font-bold text-gray-500 mb-1 ml-1"
                  htmlFor="edit-notes"
                >
                  Notes
                </label>
                <textarea
                  id="edit-notes"
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none dark:text-white font-medium"
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
                className="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl hover:scale-[1.02] transition-transform text-lg shadow-lg"
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
