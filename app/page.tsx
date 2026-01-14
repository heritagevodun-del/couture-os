"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  Search,
  UserPlus,
  Image as ImageIcon,
  Wallet,
  Scissors,
  Users,
  ChevronRight,
  Loader2,
} from "lucide-react";

// Types
type Client = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
};

type DashboardStats = {
  totalRevenue: number;
  activeOrders: number;
  totalClients: number;
  currency: string;
};

export default function Dashboard() {
  // On ne garde que 'clients' dans le state, pas 'filteredClients' (c'est redondant)
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    activeOrders: 0,
    totalClients: 0,
    currency: "FCFA",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState("");
  const router = useRouter();

  // --- 1. CHARGEMENT ET CALCULS ---
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // A. Récupérer le Profil (Nom atelier + Devise)
      const { data: profile } = await supabase
        .from("profiles")
        .select("shop_name, currency")
        .eq("id", user.id)
        .single();

      const currencySymbol = profile?.currency || "FCFA";
      setShopName(profile?.shop_name || "L'Atelier");

      // B. Récupérer les Clients
      const { data: clientsData } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // C. Récupérer les Commandes (pour les stats)
      const { data: ordersData } = await supabase
        .from("orders")
        .select("price, status")
        .eq("user_id", user.id);

      // D. Calculs des Stats
      const revenue =
        ordersData?.reduce((sum, order) => sum + (order.price || 0), 0) || 0;
      const active =
        ordersData?.filter((o) => o.status !== "termine").length || 0;

      setStats({
        totalRevenue: revenue,
        activeOrders: active,
        totalClients: clientsData?.length || 0,
        currency: currencySymbol,
      });

      setClients(clientsData || []);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  // --- 2. FILTRAGE (Calculé à la volée = Plus rapide, Pas d'erreur) ---
  const filteredClients = clients.filter(
    (client) =>
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone && client.phone.includes(searchTerm)) ||
      (client.city &&
        client.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-black" size={40} />
          <p className="text-gray-400 text-sm font-medium">
            Chargement de votre atelier...
          </p>
        </div>
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* --- HEADER --- */}
      <header className="bg-white px-6 pt-8 pb-6 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-gray-500 text-sm">Bonjour,</p>
            <h1 className="text-2xl font-bold text-gray-900 truncate max-w-[200px]">
              {shopName} 👋
            </h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/catalogue"
              className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition border border-gray-200"
              title="Catalogue"
            >
              <ImageIcon size={20} className="text-gray-600" />
            </Link>
            <Link
              href="/settings"
              className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition border border-gray-200"
              title="Paramètres"
            >
              <Settings size={20} className="text-gray-600" />
            </Link>
          </div>
        </div>

        {/* --- KPI CARDS (STATS) --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Carte CA (Noire) */}
          <div className="bg-black text-white p-4 rounded-2xl shadow-lg col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-1 opacity-80">
              <Wallet size={16} />
              <span className="text-xs font-medium uppercase tracking-wide">
                Chiffre d&apos;Affaires
              </span>
            </div>
            <div className="text-2xl font-bold truncate">
              {stats.totalRevenue.toLocaleString()}{" "}
              <span className="text-sm font-normal text-gray-400">
                {stats.currency}
              </span>
            </div>
          </div>

          {/* Carte Commandes en cours */}
          <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1 text-blue-600">
              <Scissors size={16} />
              <span className="text-xs font-bold uppercase">En cours</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.activeOrders}
            </div>
          </div>

          {/* Carte Clients Total */}
          <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1 text-gray-500">
              <Users size={16} />
              <span className="text-xs font-bold uppercase">Clients</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalClients}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto p-6">
        {/* --- BARRE DE RECHERCHE --- */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Rechercher un client, une ville..."
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* --- TITRE SECTION + BOUTON --- */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Vos Clients</h2>
          <Link
            href="/clients/new"
            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-md hover:bg-gray-800 transition"
          >
            <UserPlus size={16} /> Nouveau
          </Link>
        </div>

        {/* --- LISTE CLIENTS --- */}
        <div className="flex flex-col gap-3">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
              <Users size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                {searchTerm
                  ? "Aucun résultat trouvé."
                  : "Votre carnet est vide."}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-blue-600 text-sm font-medium mt-2"
                >
                  Effacer la recherche
                </button>
              )}
            </div>
          ) : (
            filteredClients.map((client) => (
              <Link href={`/clients/${client.id}`} key={client.id}>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-black transition group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-700 font-bold text-lg group-hover:bg-black group-hover:text-white transition-colors border border-gray-100">
                      {getInitials(client.full_name)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {client.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {client.city} • {client.phone}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className="text-gray-300 group-hover:text-black transition"
                    size={20}
                  />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
