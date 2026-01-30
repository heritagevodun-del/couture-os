"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

// --- TYPES ---
type DashboardStats = {
  totalRevenue: number;
  activeOrdersCount: number;
  totalClients: number;
  currency: string;
};

type OrderPreview = {
  id: string;
  client_name: string;
  title: string;
  deadline: string;
  status: string;
  price: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    activeOrdersCount: 0,
    totalClients: 0,
    currency: "FCFA",
  });
  const [recentOrders, setRecentOrders] = useState<OrderPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopName, setShopName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 1. Profil & Config
      const { data: profile } = await supabase
        .from("profiles")
        .select("shop_name, currency")
        .eq("id", user.id)
        .single();

      const currency = profile?.currency || "FCFA";
      setShopName(profile?.shop_name || "L'Atelier");

      // 2. Stats Globales
      const { data: orders } = await supabase
        .from("orders")
        .select("price, status, deadline, title, id, clients(full_name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const { count: clientCount } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Calculs
      const revenue = orders?.reduce((sum, o) => sum + (o.price || 0), 0) || 0;
      const activeOrders = orders?.filter((o) => o.status !== "termine") || [];

      setStats({
        totalRevenue: revenue,
        activeOrdersCount: activeOrders.length,
        totalClients: clientCount || 0,
        currency: currency,
      });

      // Préparer les 5 dernières commandes
      const recent = activeOrders.slice(0, 5).map((o) => ({
        id: o.id,
        // @ts-expect-error : Supabase jointure typing complex
        client_name: o.clients?.full_name || "Client Inconnu",
        title: o.title || "Commande",
        deadline: o.deadline,
        status: o.status,
        price: o.price,
      }));

      setRecentOrders(recent);
      setLoading(false);
    };

    fetchData();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_attente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700";
      case "en_cours":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700";
      case "termine":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-950 text-gray-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="text-sm font-medium">Synchronisation...</p>
      </div>
    );

  return (
    <main className="min-h-screen bg-[#F8F9FA] dark:bg-neutral-950 pb-24 transition-colors duration-300">
      {/* --- HEADER --- */}
      <header className="bg-white dark:bg-neutral-900 px-6 pt-12 pb-8 border-b border-gray-100 dark:border-gray-800 shadow-sm sticky top-0 z-20 transition-colors">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-gray-400 text-xs font-bold tracking-wider uppercase mb-1">
              Tableau de bord
            </p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {shopName}
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/settings"
              className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-black hover:text-white dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
            >
              <Settings size={20} />
            </Link>
          </div>
        </div>

        {/* --- CARTE CA (Gold & Black) --- */}
        <div className="bg-black dark:bg-neutral-800 text-white p-6 rounded-2xl shadow-xl shadow-gray-200 dark:shadow-none relative overflow-hidden border border-gray-800">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-white/60">
              <Wallet size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">
                Chiffre d&apos;Affaires
              </span>
            </div>
            <div className="text-4xl font-bold tracking-tight">
              {stats.totalRevenue.toLocaleString()}{" "}
              <span className="text-lg font-medium text-[#D4AF37]">
                {stats.currency}
              </span>
            </div>
          </div>
          {/* Effet Gold */}
          <div className="absolute -right-10 -bottom-20 w-40 h-40 bg-[#D4AF37] rounded-full opacity-20 blur-2xl pointer-events-none"></div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 -mt-6 relative z-10">
        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-2 text-center group hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Scissors size={20} />
            </div>
            <div>
              <span className="block text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeOrdersCount}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">
                En production
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-2 text-center group hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all">
            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <Users size={20} />
            </div>
            <div>
              <span className="block text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalClients}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">
                Clients
              </span>
            </div>
          </div>
        </div>

        {/* --- ACTIONS RAPIDES --- */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wide mb-4 flex items-center gap-2">
            <PlusCircle size={16} /> Actions Rapides
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Link
              href="/clients/new"
              className="flex-shrink-0 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 pl-4 pr-6 py-3 rounded-xl flex items-center gap-3 shadow-sm hover:shadow-md hover:border-black dark:hover:border-white transition-all group"
            >
              <div className="bg-black dark:bg-white text-white dark:text-black p-1.5 rounded-lg group-hover:bg-[#D4AF37] transition-colors">
                <UserPlus size={16} />
              </div>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                Nouveau Client
              </span>
            </Link>
            <Link
              href="/catalogue"
              className="flex-shrink-0 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-800 pl-4 pr-6 py-3 rounded-xl flex items-center gap-3 shadow-sm hover:shadow-md hover:border-black dark:hover:border-white transition-all"
            >
              <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white p-1.5 rounded-lg">
                <LayoutDashboard size={16} />
              </div>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">
                Catalogue
              </span>
            </Link>
          </div>
        </div>

        {/* --- PRODUCTION EN COURS --- */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-200 uppercase tracking-wide flex items-center gap-2">
              <Clock size={16} /> Production en cours
            </h2>
            <Link
              href="/clients"
              className="text-xs font-bold text-[#D4AF37] hover:underline"
            >
              Tout voir
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                <CheckCircle2
                  size={32}
                  className="mx-auto text-gray-300 dark:text-gray-600 mb-2"
                />
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Tout est calme. Aucune commande en cours.
                </p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                      {order.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Pour{" "}
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {order.client_name}
                      </span>
                    </p>
                    <div
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(order.status)}`}
                    >
                      {order.status.replace("_", " ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-sm text-gray-900 dark:text-white">
                      {order.price?.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {order.deadline
                        ? new Date(order.deadline).toLocaleDateString()
                        : "Sans date"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
