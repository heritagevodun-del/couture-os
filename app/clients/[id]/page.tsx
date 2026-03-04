"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trash2,
  FileText,
  MessageCircle,
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

// 🛡️ CORRECTION TS : Définition d'un type propre pour le dictionnaire de mesures
type MeasurementsData = {
  _template_id?: string;
  _custom_fields_def?: CustomFieldDef[];
  [key: string]: string | CustomFieldDef[] | undefined;
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

  // États d'édition avec le nouveau type strict
  const [isEditingMeasurements, setIsEditingMeasurements] = useState(false);
  const [tempMeasurements, setTempMeasurements] = useState<MeasurementsData>(
    {},
  );

  // États pour l'ajout dynamique de mesures
  const [isAddingCustomField, setIsAddingCustomField] = useState(false);
  const [newCustomFieldLabel, setNewCustomFieldLabel] = useState("");

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

      const [profileRes, clientRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("clients")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("orders")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (profileRes.data) {
        setShopProfile({
          shop_name: profileRes.data.shop_name || "Mon Atelier",
          shop_address: profileRes.data.shop_address || "",
          shop_phone: profileRes.data.shop_phone || "",
          email: user.email || "",
          currency: profileRes.data.currency || "FCFA",
        });
      }

      if (clientRes.error || !clientRes.data) {
        console.error("Erreur client:", clientRes.error);
        setLoading(false);
        return;
      }

      setClient(clientRes.data);
      setTempMeasurements(clientRes.data.measurements || {});
      setTempClientData({
        full_name: clientRes.data.full_name,
        phone: clientRes.data.phone || "",
        city: clientRes.data.city || "",
        notes: clientRes.data.notes || "",
      });

      setOrders(ordersRes.data || []);
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

  const getLabelForField = (key: string) => {
    if (key.startsWith("_") && key !== "_custom_fields_def") return null;

    const field = currentTemplate.fields.find((f) => f.id === key);
    if (field) return field.label;

    const tempCustomDefs = tempMeasurements?._custom_fields_def || [];
    const tempCustomField = tempCustomDefs.find((f) => f.id === key);
    if (tempCustomField) return tempCustomField.label;

    const customDefs: CustomFieldDef[] =
      client?.measurements?._custom_fields_def || [];
    const customField = customDefs.find((f) => f.id === key);
    if (customField) return customField.label;

    return key.replace(/_/g, " ").replace("custom", "Mesure");
  };

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

  const handleSaveMeasurements = async () => {
    if (!client) return;
    const { error } = await supabase
      .from("clients")
      .update({ measurements: tempMeasurements })
      .eq("id", client.id);
    if (!error) {
      setClient({ ...client, measurements: tempMeasurements });
      setIsEditingMeasurements(false);
      setIsAddingCustomField(false);
    }
  };

  const handleMeasureChange = (key: string, rawValue: string) => {
    const sanitizedValue = rawValue.replace(",", ".");
    setTempMeasurements((prev) => ({ ...prev, [key]: sanitizedValue }));
  };

  const handleAddCustomField = () => {
    if (!newCustomFieldLabel.trim()) return;

    const newId = `custom_${Date.now()}`;
    const newDef: CustomFieldDef = {
      id: newId,
      label: newCustomFieldLabel.trim(),
    };

    setTempMeasurements((prev) => {
      const existingDefs = Array.isArray(prev._custom_fields_def)
        ? prev._custom_fields_def
        : [];
      return {
        ...prev,
        _custom_fields_def: [...existingDefs, newDef],
        [newId]: "",
      };
    });

    setNewCustomFieldLabel("");
    setIsAddingCustomField(false);
  };

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

  const handleDownloadInvoice = (e: React.MouseEvent, order: Order) => {
    e.stopPropagation();
    if (!client) return;

    const numericOrderNumber =
      Math.floor(new Date(order.created_at).getTime() / 1000) % 1000000;

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
        client_order_number: numericOrderNumber,
      },
    });
  };

  const sendWhatsApp = (type: "reminder" | "ready", order: Order) => {
    if (!client?.phone)
      return alert("Ce client n'a pas de numéro de téléphone enregistré.");
    const shop = shopProfile?.shop_name || "L'Atelier";
    const cleanPhone = client.phone.replace(/[^0-9+]/g, "");

    const reste = order.price - (order.advance || 0);
    const devise = shopProfile?.currency || "FCFA";
    let msg = "";

    if (type === "reminder") {
      msg = `Bonjour ${client.full_name} 👋, c'est ${shop}. Petit rappel pour votre commande "${order.title}". Il reste ${reste.toLocaleString("fr-FR")} ${devise} à régler. Merci !`;
    } else {
      msg = `Bonne nouvelle ${client.full_name} ! 🎉 Votre commande "${order.title}" est prête à l'atelier. Reste à payer : ${reste.toLocaleString("fr-FR")} ${devise}. À très vite !`;
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading)
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#F8F9FA] dark:bg-[#050505]">
        <Loader2 className="animate-spin text-[#D4AF37] mb-4" size={40} />
        <p className="text-gray-400 font-serif text-sm">
          Ouverture du dossier client...
        </p>
      </div>
    );

  if (!client)
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#F8F9FA] dark:bg-[#050505] text-gray-500 gap-4">
        <p>Client introuvable ou supprimé.</p>
        <Link
          href="/clients"
          className="text-[#D4AF37] font-bold hover:underline"
        >
          Retour au carnet d&apos;adresses
        </Link>
      </div>
    );

  return (
    <main className="min-h-[100dvh] bg-[#F8F9FA] dark:bg-[#050505] pb-24 transition-colors duration-300 font-sans selection:bg-[#D4AF37]/30">
      {/* HEADER NAV STICKY */}
      <div className="bg-white/80 dark:bg-[#111]/80 backdrop-blur-md px-4 py-4 md:px-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 z-40 transition-colors">
        <Link
          href="/clients"
          className="text-gray-500 dark:text-gray-400 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <ArrowLeft size={16} />{" "}
          <span className="hidden sm:inline">Mes Clients</span>
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditingClient(true)}
            className="p-2 bg-gray-100 dark:bg-black rounded-xl hover:bg-[#D4AF37] hover:text-black dark:hover:bg-[#D4AF37] dark:hover:text-black transition-all border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
            aria-label="Modifier les informations du client"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={handleDeleteClient}
            className="p-2 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100 dark:border-red-900/30"
            aria-label="Supprimer le client"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* --- CARTE IDENTITÉ VIP --- */}
        <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#D4AF37]/5 to-transparent dark:from-[#D4AF37]/10 dark:to-transparent pointer-events-none" />

          <div className="relative z-10 w-24 h-24 bg-black dark:bg-black text-[#D4AF37] rounded-full flex items-center justify-center text-4xl font-black mb-5 shadow-2xl ring-4 ring-white dark:ring-[#111] border-2 border-[#D4AF37]/30 group-hover:scale-105 transition-transform duration-500">
            {client.full_name.charAt(0).toUpperCase()}
          </div>

          <h1 className="relative z-10 text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 font-serif tracking-tight">
            {client.full_name}
          </h1>

          <div className="relative z-10 flex flex-wrap justify-center items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">
            {client.phone && (
              <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 px-4 py-1.5 rounded-full">
                <Phone size={14} className="text-[#D4AF37]" /> {client.phone}
              </span>
            )}
            {client.city && (
              <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 px-4 py-1.5 rounded-full">
                <MapPin size={14} className="text-[#D4AF37]" /> {client.city}
              </span>
            )}
          </div>

          <div className="relative z-10 flex gap-4 w-full max-w-md">
            <a
              href={`tel:${client.phone}`}
              className="flex-1 bg-gray-50 dark:bg-black text-gray-900 dark:text-white py-4 rounded-xl font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors flex justify-center items-center gap-2 border border-gray-200 dark:border-gray-800 shadow-sm"
            >
              <Phone size={18} /> Appeler
            </a>
            <a
              href={`https://wa.me/${client.phone.replace(/[^0-9+]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#25D366] hover:bg-[#20b858] text-white py-4 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2 shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] hover:-translate-y-0.5"
            >
              <MessageCircle size={18} /> WhatsApp
            </a>
          </div>

          {client.notes && (
            <div className="relative z-10 mt-8 w-full bg-[#D4AF37]/5 border border-[#D4AF37]/20 p-5 rounded-2xl text-left flex gap-4">
              <StickyNote
                className="text-[#D4AF37] shrink-0 mt-0.5"
                size={20}
              />
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {client.notes}
              </p>
            </div>
          )}
        </div>

        {/* --- SECTION MESURES --- */}
        <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Ruler size={150} className="rotate-45" />
          </div>

          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 relative z-10">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.1em] flex items-center gap-2">
              <Ruler size={18} className="text-[#D4AF37]" /> Mensurations{" "}
              <span className="text-gray-400 font-normal">
                ({currentTemplate.label})
              </span>
            </h2>
            {!isEditingMeasurements ? (
              <button
                onClick={() => setIsEditingMeasurements(true)}
                className="text-xs font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-black px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all w-full sm:w-auto text-center"
              >
                Mettre à jour
              </button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setIsEditingMeasurements(false);
                    setIsAddingCustomField(false);
                    setTempMeasurements(client?.measurements || {});
                  }}
                  className="flex-1 sm:flex-none text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:text-black dark:hover:text-white px-4 py-2.5 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveMeasurements}
                  className="flex-1 sm:flex-none text-xs font-bold text-black bg-[#D4AF37] hover:bg-[#b5952f] px-6 py-2.5 rounded-xl shadow-md transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            )}
          </div>

          <div className="p-6 md:p-8 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Affichage des champs de mesures */}
              {Object.entries(tempMeasurements).map(([key, value]) => {
                if (key.startsWith("_") && key !== "_custom_fields_def")
                  return null;
                if (key === "_custom_fields_def") return null;

                const label = getLabelForField(key);
                if (!label) return null;

                // 🛡️ CORRECTION TS : On s'assure que la valeur affichée est bien un texte
                const displayValue = typeof value === "string" ? value : "";

                return (
                  <div
                    key={key}
                    className="bg-gray-50 dark:bg-black p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 focus-within:ring-2 focus-within:ring-[#D4AF37]/50 transition-all group flex flex-col justify-center"
                  >
                    <span
                      className="block text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-1.5 truncate group-focus-within:text-[#D4AF37] transition-colors"
                      title={label}
                    >
                      {label}
                    </span>
                    {isEditingMeasurements ? (
                      <input
                        type="text"
                        inputMode="decimal"
                        className="w-full bg-transparent border-none outline-none font-black text-gray-900 dark:text-white p-0 text-xl md:text-2xl placeholder-gray-300"
                        value={displayValue}
                        onChange={(e) =>
                          handleMeasureChange(key, e.target.value)
                        }
                        aria-label={`Modifier ${label}`}
                      />
                    ) : (
                      <span className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight block">
                        {displayValue || "--"}{" "}
                        <span className="text-xs font-medium text-gray-400 ml-0.5">
                          cm
                        </span>
                      </span>
                    )}
                  </div>
                );
              })}

              {/* 🛡️ BOUTON D'AJOUT DE NOUVELLE MESURE (Visible uniquement en mode édition) */}
              {isEditingMeasurements && (
                <div className="bg-gray-50/50 dark:bg-[#111] p-3.5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col justify-center items-center transition-all min-h-[85px]">
                  {!isAddingCustomField ? (
                    <button
                      onClick={() => setIsAddingCustomField(true)}
                      className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#D4AF37] transition-colors w-full h-full justify-center"
                    >
                      <Plus size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Ajouter
                      </span>
                    </button>
                  ) : (
                    <div className="w-full animate-in fade-in zoom-in-95 flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Ex: Épaule gauche"
                        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-[#D4AF37]"
                        value={newCustomFieldLabel}
                        onChange={(e) => setNewCustomFieldLabel(e.target.value)}
                        autoFocus
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddCustomField()
                        }
                      />
                      <div className="flex gap-1 w-full">
                        <button
                          onClick={() => {
                            setIsAddingCustomField(false);
                            setNewCustomFieldLabel("");
                          }}
                          className="flex-1 bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded py-1.5 text-[10px] font-bold uppercase hover:bg-gray-300 dark:hover:bg-gray-700 transition"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleAddCustomField}
                          className="flex-1 bg-[#D4AF37] text-black rounded py-1.5 text-[10px] font-bold uppercase hover:bg-[#b5952f] transition"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {Object.keys(tempMeasurements).length === 0 && (
              <p className="text-center text-sm text-gray-400 italic py-4">
                Aucune mesure enregistrée pour le moment.
              </p>
            )}
          </div>
        </div>

        {/* --- SECTION COMMANDES --- */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 px-2 gap-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-[0.1em] flex items-center gap-2">
              <ShoppingBag size={18} className="text-[#D4AF37]" /> Historique (
              {orders.length})
            </h2>
            <Link
              href={`/clients/${id}/new-order`}
              className="flex justify-center items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-5 py-3 rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-md w-full sm:w-auto"
            >
              <Plus size={16} /> Créer une commande
            </Link>
          </div>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-[#111]">
                <ShoppingBag
                  size={40}
                  className="mx-auto mb-3 text-gray-300 dark:text-gray-700"
                  strokeWidth={1.5}
                />
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Ce client n&apos;a pas encore passé de commande.
                </p>
              </div>
            ) : (
              orders.map((order) => {
                const reste = order.price - (order.advance || 0);
                const isPaid = reste <= 0;

                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-[#111] p-5 md:p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate group-hover:text-[#D4AF37] transition-colors">
                          {order.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium bg-gray-50 dark:bg-black inline-block px-2 py-1 rounded-md border border-gray-100 dark:border-gray-800">
                          Livraison :{" "}
                          {new Date(order.deadline).toLocaleDateString(
                            "fr-FR",
                            {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-gray-900 dark:text-white block text-xl tracking-tight">
                          {new Intl.NumberFormat("fr-FR").format(order.price)}{" "}
                          <span className="text-xs font-bold text-gray-400 uppercase">
                            {shopProfile?.currency}
                          </span>
                        </span>
                        <span
                          className={`inline-block mt-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            isPaid
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50"
                              : "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400 border border-red-100 dark:border-red-900/50"
                          }`}
                        >
                          {isPaid
                            ? "Payé ✔"
                            : `Reste: ${new Intl.NumberFormat("fr-FR").format(reste)}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 gap-3 mt-1">
                      {/* SÉLECTEUR DE STATUT DE PRODUCTION */}
                      <div className="relative">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleUpdateStatus(order.id, e.target.value)
                          }
                          aria-label={`Statut de la commande ${order.title}`}
                          className={`appearance-none pl-4 pr-10 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border outline-none transition-all ${
                            order.status === "termine"
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50"
                              : order.status === "en_cours"
                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50"
                                : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900/50"
                          }`}
                        >
                          <option value="en_attente">En attente</option>
                          <option value="en_cours">En production</option>
                          <option value="essayage">Prêt pour essayage</option>
                          <option value="termine">Terminé & Livré</option>
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
                        />
                      </div>

                      {/* BOUTONS D'ACTION (FACTURE & WHATSAPP) */}
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={(e) => handleDownloadInvoice(e, order)}
                          className="flex-1 sm:flex-none flex items-center justify-center p-2.5 bg-gray-50 dark:bg-black rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition border border-gray-200 dark:border-gray-800 shadow-sm"
                          aria-label="Télécharger le reçu PDF"
                          title="Télécharger la Facture PDF"
                        >
                          <FileText size={18} />
                        </button>

                        <button
                          onClick={() =>
                            sendWhatsApp(
                              order.status === "termine" ? "ready" : "reminder",
                              order,
                            )
                          }
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 p-2.5 px-4 bg-[#25D366]/10 text-[#25D366] rounded-xl hover:bg-[#25D366] hover:text-white transition-all border border-[#25D366]/20 font-bold text-xs"
                          aria-label="Notifier par WhatsApp"
                        >
                          <MessageCircle size={16} />
                          <span className="hidden md:inline">Notifier</span>
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

      {/* --- MODAL EDIT CLIENT --- */}
      {isEditingClient && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111] w-full max-w-sm rounded-3xl p-6 md:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl md:text-2xl dark:text-white font-serif tracking-tight">
                Modifier le profil
              </h3>
              <button
                onClick={() => setIsEditingClient(false)}
                className="p-2 rounded-full bg-gray-50 dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500"
                aria-label="Fermer la fenêtre"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1"
                  htmlFor="edit-fullname"
                >
                  Nom complet
                </label>
                <input
                  id="edit-fullname"
                  className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]/50 dark:text-white font-medium text-sm transition-all"
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
                  className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1"
                  htmlFor="edit-phone"
                >
                  Téléphone
                </label>
                <input
                  id="edit-phone"
                  type="tel"
                  className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]/50 dark:text-white font-medium text-sm transition-all"
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
                  className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1"
                  htmlFor="edit-city"
                >
                  Ville
                </label>
                <input
                  id="edit-city"
                  className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]/50 dark:text-white font-medium text-sm transition-all"
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
                  className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1"
                  htmlFor="edit-notes"
                >
                  Notes
                </label>
                <textarea
                  id="edit-notes"
                  className="w-full p-4 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]/50 resize-none dark:text-white font-medium text-sm transition-all"
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
                className="w-full bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold py-4 rounded-xl hover:-translate-y-0.5 transition-transform text-base shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] mt-2"
              >
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
