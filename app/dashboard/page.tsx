"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import {
  Settings,
  UserPlus,
  LayoutDashboard,
  Wallet,
  Scissors,
  Users,
  Loader2,
  PlusCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

// --- TYPES ---
type DashboardStats = {
  totalRevenue: number;
  activeOrdersCount: number;
  totalClients: number;
  currency: string;
};

type OrderWithClient = {
  id: string;
  client_id: string; // <--- AJOUTÉ ICI (Important pour le lien)
  title: string;
  deadline: string | null;
  status: string;
  price: number;
  clients: { full_name: string } | null;
};

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState("");

  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    activeOrdersCount: 0,
    totalClients: 0,
    currency: "FCFA",
  });

  const [recentOrders, setRecentOrders] = useState<OrderWithClient[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Vérification Session
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 2. Récupérer le Profil
      const { data: profile } = await supabase
        .from("profiles")
        .select("shop_name, currency")
        .eq("id", user.id)
        .single();

      const currency = profile?.currency || "FCFA";
      setShopName(profile?.shop_name || "L'Atelier");

      // 3. Récupérer les Commandes (AVEC client_id)
      const { data: orders } = await supabase
        .from("orders")
        .select(
          `
          id, client_id, title, deadline, status, price, created_at,
          clients (full_name)
        `,
        ) // <--- J'ai ajouté 'client_id' ici
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // 4. Récupérer le nombre de clients
      const { count: clientCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // --- CALCULS ---
      const safeOrders = (orders || []) as unknown as OrderWithClient[];
      const revenue = safeOrders.reduce((sum, o) => sum + (o.price || 0), 0);
      const activeOrders = safeOrders.filter(
        (o) => o.status !== "termine" && o.status !== "annule",
      );

      setStats({
        totalRevenue: revenue,
        activeOrdersCount: activeOrders.length,
        totalClients: clientCount || 0,
        currency: currency,
      });

      setRecentOrders(activeOrders.slice(0, 5));
      setLoading(false);
    };

    fetchData();
  }, [router]);

  // Helper couleurs
  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_attente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700";
      case "en_cours":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700";
      case "essayage":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700";
      case "termine":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-950 text-gray-400">
        <Loader2
          className="animate-spin mb-4 text-black dark:text-white"
          size={40}
        />
        <p className="text-sm font-medium">Chargement de votre atelier...</p>
      </div>
    );

  return (
    <main className="min-h-screen bg-[#F8F9FA] dark:bg-neutral-950 pb-24 transition-colors duration-300">
      {/* --- HEADER --- */}
      <header className="bg-white dark:bg-neutral-900 px-6 pt-12 pb-12 border-b border-gray-100 dark:border-gray-800 shadow-sm z-20 transition-colors">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-gray-400 text-xs font-bold tracking-wider uppercase mb-1">
                Tableau de bord
              </p>
              <div className="flex items-center gap-3">
                <Logo className="w-8 h-8 shadow-sm rounded-full" />
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-full">
                  {shopName}
                </h1>
              </div>
            </div>
            <Link
              href="/settings"
              className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-black hover:text-white dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
              aria-label="Paramètres"
            >
              <Settings size={20} />
            </Link>
          </div>

          {/* --- CARTE CA --- */}
          <div className="bg-black dark:bg-neutral-800 text-white p-6 md:p-8 rounded-2xl shadow-xl shadow-gray-200 dark:shadow-none relative overflow-hidden border border-gray-800 transition-all hover:scale-[1.01]">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-white/60">
                <Wallet size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Chiffre d&apos;Affaires
                </span>
              </div>
              <div className="text-4xl md:text-5xl font-bold tracking-tight">
                {stats.totalRevenue.toLocaleString()}{" "}
                <span className="text-lg md:text-2xl font-medium text-[#D4AF37]">
                  {stats.currency}
                </span>
              </div>
            </div>
            {/* Effet Gold */}
            <div className="absolute -right-10 -bottom-20 w-48 h-48 bg-[#D4AF37] rounded-full opacity-20 blur-3xl pointer-events-none animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* --- CONTENU PRINCIPAL --- */}
      <div className="max-w-5xl mx-auto px-6 -mt-8 relative z-10">
        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-8">
          <Link
            href="/clients"
            className="bg-white dark:bg-neutral-900 p-5 md:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-2 text-center group hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all cursor-pointer"
          >
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Scissors size={24} />
            </div>
            <div>
              <span className="block text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {stats.activeOrdersCount}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">
                En production
              </span>
            </div>
          </Link>

          <Link
            href="/clients"
            className="bg-white dark:bg-neutral-900 p-5 md:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-2 text-center group hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all cursor-pointer"
          >
            <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <div>
              <span className="block text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalClients}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">
                Clients
              </span>
            </div>
          </Link>
        </div>

        {/* --- ACTIONS RAPIDES --- */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wide mb-4 flex items-center gap-2">
            <PlusCircle size={16} /> Actions Rapides
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide md:grid md:grid-cols-2">
            <Link
              href="/clients/new"
              className="flex-shrink-0 w-64 md:w-auto bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 pl-4 pr-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:border-black dark:hover:border-white transition-all group"
            >
              <div className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-xl group-hover:bg-[#D4AF37] transition-colors">
                <UserPlus size={20} />
              </div>
              <span className="font-bold text-sm text-gray-900 dark:text-white">
                Nouveau Client
              </span>
            </Link>

            <Link
              href="/catalogue"
              className="flex-shrink-0 w-64 md:w-auto bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 pl-4 pr-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:border-black dark:hover:border-white transition-all group"
            >
              <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded-xl group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition-colors">
                <LayoutDashboard size={20} />
              </div>
              <span className="font-bold text-sm text-gray-900 dark:text-white">
                Catalogue Modèles
              </span>
            </Link>
          </div>
        </div>

        {/* --- PRODUCTION EN COURS (MODIFIÉE POUR LIENS) --- */}
        <div className="pb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wide flex items-center gap-2">
              <Clock size={16} /> Production en cours
            </h2>
            <Link
              href="/clients"
              className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              Tout voir <ArrowRight size={12} />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                <CheckCircle2
                  size={40}
                  className="mx-auto text-gray-300 dark:text-gray-600 mb-3"
                />
                <p className="text-gray-400 dark:text-gray-500 font-medium text-sm">
                  Tout est calme. Aucune commande active.
                </p>
                <Link
                  href="/clients"
                  className="text-xs text-[#D4AF37] mt-2 block hover:underline"
                >
                  Créer une commande depuis un client
                </Link>
              </div>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/clients/${order.client_id}`} // <--- LE LIEN MAGIQUE EST ICI
                  className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between hover:border-gray-300 dark:hover:border-gray-600 transition-colors group cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-[#D4AF37] transition-colors">
                      {order.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Users size={10} />
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {order.clients?.full_name || "Client supprimé"}
                      </span>
                    </p>
                    <div className="mt-1">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(order.status)}`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block font-bold text-sm text-gray-900 dark:text-white">
                      {order.price?.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md mt-1 inline-block">
                      {order.deadline
                        ? `Pour le ${new Date(order.deadline).toLocaleDateString()}`
                        : "Pas de date"}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
