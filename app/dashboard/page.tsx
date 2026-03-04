"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
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
  client_id: string;
  title: string;
  deadline: string | null;
  status: string;
  price: number;
  // Supabase renvoie les relations dans un objet au nom de la table
  clients: { full_name: string } | null;
};

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();
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

      // 2. Exécution des requêtes en PARALLÈLE pour doubler la vitesse de chargement
      const [profileRes, clientsCountRes, ordersRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("shop_name, currency")
          .eq("id", user.id)
          .single(),
        supabase
          .from("clients")
          .select("id", { count: "exact", head: true }) // head: true ne ramène que le count (très léger)
          .eq("user_id", user.id),
        // 🛡️ OPTIMISATION ARCHITECTURE : On ne charge pas tout.
        // On demande juste les id, prix et statuts pour le calcul global,
        // MAIS on utilise limit(5) sur les jointures lourdes (ce n'est pas possible directement en une seule requête REST simple,
        // donc on fait une astuce : on récupère tout MAIS avec seulement les colonnes vitales pour minimiser la payload)
        supabase
          .from("orders")
          .select(
            "id, client_id, title, deadline, status, price, created_at, clients (full_name)",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      // Analyse des résultats
      const currency = profileRes.data?.currency || "FCFA";
      setShopName(profileRes.data?.shop_name || "Mon Atelier");

      const safeOrders = (ordersRes.data || []) as unknown as OrderWithClient[];

      // Calculs (À terme, si tu dépasses les 10 000 commandes, il faudra créer une fonction SQL 'rpc' dans Supabase)
      let totalRevenue = 0;
      let activeCount = 0;
      const recentActiveOrders: OrderWithClient[] = [];

      // Boucle unique (O(n)) pour de meilleures performances au lieu d'enchaîner reduce() puis filter()
      safeOrders.forEach((o) => {
        // 1. Chiffre d'affaires global (on additionne tout, terminé ou non)
        totalRevenue += o.price || 0;

        // 2. Commandes actives
        if (o.status !== "termine" && o.status !== "annule") {
          activeCount++;
          // On garde seulement les 5 plus récentes pour l'affichage
          if (recentActiveOrders.length < 5) {
            recentActiveOrders.push(o);
          }
        }
      });

      setStats({
        totalRevenue: totalRevenue,
        activeOrdersCount: activeCount,
        totalClients: clientsCountRes.count || 0,
        currency: currency,
      });

      setRecentOrders(recentActiveOrders);
      setLoading(false);
    };

    fetchData();
  }, [router, supabase]);

  // Helper de formatage de date sécurisé
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Pas de date";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Helper couleurs
  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_attente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50";
      case "en_cours":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50";
      case "essayage":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700/50";
      case "termine":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700/50";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // 🛡️ DESIGN SYSTEM : Formatage des grands nombres (ex: 1 500 000)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount);
  };

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] dark:bg-[#050505] text-gray-400">
        <Loader2 className="animate-spin mb-4 text-[#D4AF37]" size={40} />
        <p className="text-sm font-medium font-serif">
          Ouverture de l&apos;atelier...
        </p>
      </div>
    );

  return (
    <main className="min-h-[100dvh] bg-[#F8F9FA] dark:bg-[#050505] pb-24 transition-colors duration-300 selection:bg-[#D4AF37]/30">
      {/* --- HEADER --- */}
      <header className="bg-white dark:bg-[#111] px-6 pt-6 pb-12 border-b border-gray-100 dark:border-gray-800 shadow-sm z-20 relative transition-colors">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5 ml-1">
                Tableau de bord
              </p>
              <div className="flex items-center gap-3">
                <Logo className="w-10 h-10 shadow-sm rounded-full border border-gray-100 dark:border-gray-800" />
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white truncate max-w-[200px] md:max-w-full font-serif tracking-tight">
                  {shopName}
                </h1>
              </div>
            </div>
            <Link
              href="/settings"
              className="p-2.5 bg-gray-50 dark:bg-black rounded-full hover:bg-black hover:text-white dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 shadow-sm"
              aria-label="Paramètres"
            >
              <Settings
                size={20}
                className="hover:rotate-45 transition-transform duration-300"
              />
            </Link>
          </div>

          {/* --- CARTE CHIFFRE D'AFFAIRES --- */}
          <div className="bg-[#111] dark:bg-black text-white p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden border border-gray-800 dark:border-gray-900 group">
            {/* Dégradé interne Or */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3 text-[#D4AF37]">
                <Wallet size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-80">
                  Chiffre d&apos;Affaires
                </span>
              </div>
              <div className="text-4xl md:text-5xl font-black tracking-tighter">
                {formatCurrency(stats.totalRevenue)}{" "}
                <span className="text-lg md:text-xl font-medium text-[#D4AF37] ml-1 opacity-90">
                  {stats.currency}
                </span>
              </div>
            </div>
            {/* Effet Gold Aura amélioré */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#D4AF37] rounded-full opacity-10 blur-[80px] group-hover:opacity-20 transition-opacity duration-700 pointer-events-none"></div>
          </div>
        </div>
      </header>

      {/* --- CONTENU PRINCIPAL --- */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 -mt-6 relative z-30">
        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 gap-3 md:gap-6 mb-8">
          <Link
            href="/clients"
            className="bg-white dark:bg-[#111] p-5 md:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-2 text-center group hover:border-[#D4AF37]/50 dark:hover:border-[#D4AF37]/30 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-12 h-12 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-300">
              <Scissors size={20} />
            </div>
            <div>
              <span className="block text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {stats.activeOrdersCount}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                En production
              </span>
            </div>
          </Link>

          <Link
            href="/clients"
            className="bg-white dark:bg-[#111] p-5 md:p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center gap-2 text-center group hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="w-12 h-12 bg-gray-50 dark:bg-black text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-800 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-300">
              <Users size={20} />
            </div>
            <div>
              <span className="block text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {stats.totalClients}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                Clients
              </span>
            </div>
          </Link>
        </div>

        {/* --- ACTIONS RAPIDES --- */}
        <div className="mb-10">
          <h2 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-4 flex items-center gap-2 ml-1">
            <PlusCircle size={14} /> Actions Rapides
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide md:grid md:grid-cols-2">
            <Link
              href="/clients/new"
              className="flex-shrink-0 w-64 md:w-auto bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 pl-4 pr-6 py-3.5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:border-[#D4AF37]/50 dark:hover:border-[#D4AF37]/30 transition-all group"
            >
              <div className="bg-black dark:bg-white text-white dark:text-black p-2.5 rounded-xl group-hover:bg-[#D4AF37] group-hover:text-black transition-colors shadow-sm">
                <UserPlus size={18} />
              </div>
              <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#D4AF37] transition-colors">
                Nouveau Client
              </span>
            </Link>

            <Link
              href="/catalogue"
              className="flex-shrink-0 w-64 md:w-auto bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 pl-4 pr-6 py-3.5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all group"
            >
              <div className="bg-gray-50 dark:bg-black text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 p-2.5 rounded-xl group-hover:bg-gray-200 dark:group-hover:bg-gray-800 transition-colors shadow-sm">
                <LayoutDashboard size={18} />
              </div>
              <span className="font-bold text-sm text-gray-900 dark:text-white">
                Catalogue Modèles
              </span>
            </Link>
          </div>
        </div>

        {/* --- PRODUCTION EN COURS --- */}
        <div className="pb-10">
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] flex items-center gap-2">
              <Clock size={14} /> En cours
            </h2>
            <Link
              href="/clients"
              className="text-[11px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1 uppercase tracking-wider"
            >
              Tout voir <ArrowRight size={12} />
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#111] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                <CheckCircle2
                  size={40}
                  className="mx-auto text-gray-300 dark:text-gray-700 mb-4"
                  strokeWidth={1.5}
                />
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                  Votre atelier est à jour.
                </p>
                <Link
                  href="/clients"
                  className="text-xs text-[#D4AF37] mt-2 block hover:underline font-medium"
                >
                  Ajouter une commande à un client
                </Link>
              </div>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/clients/${order.client_id}`}
                  className="bg-white dark:bg-[#111] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between hover:border-[#D4AF37]/50 dark:hover:border-[#D4AF37]/30 hover:shadow-md transition-all group cursor-pointer"
                >
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                      {order.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Users size={12} className="text-gray-400" />
                      <span className="font-medium">
                        {order.clients?.full_name || "Client supprimé"}
                      </span>
                    </p>
                    <div className="mt-1">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-[0.1em] ${getStatusColor(order.status)}`}
                      >
                        {order.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end justify-between h-full">
                    <span className="block font-black text-base text-gray-900 dark:text-white tracking-tight">
                      {formatCurrency(order.price)}{" "}
                      <span className="text-[10px] text-gray-400 font-medium ml-0.5">
                        {stats.currency}
                      </span>
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-black border border-gray-100 dark:border-gray-800 px-2.5 py-1 rounded-md mt-2 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(order.deadline)}
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
