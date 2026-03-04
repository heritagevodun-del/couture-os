"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import {
  Search,
  UserPlus,
  MoreHorizontal,
  Phone,
  MapPin,
  Users,
  ArrowLeft,
} from "lucide-react";

type Client = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  created_at: string;
};

export default function ClientsPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setClients(data);
      }
      setLoading(false);
    };

    fetchClients();
  }, [supabase]);

  // 🛡️ UX PRO : Fonction pour ignorer les accents lors de la recherche
  const normalizeString = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  const filteredClients = clients.filter((client) => {
    const normalizedSearch = normalizeString(searchTerm);
    return (
      normalizeString(client.full_name || "").includes(normalizedSearch) ||
      (client.phone || "").includes(searchTerm) ||
      normalizeString(client.city || "").includes(normalizedSearch)
    );
  });

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] dark:bg-[#050505] p-4 md:p-6 transition-colors duration-300 pb-20 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* --- HEADER NAV --- */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#D4AF37] dark:text-gray-400 dark:hover:text-[#D4AF37] transition-colors font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={14} /> Retour au tableau de bord
          </Link>
        </div>

        {/* --- TITRE ET ACTIONS --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-2 font-serif tracking-tight">
              Mes Clients
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Gérez votre carnet d&apos;adresses et accédez aux mensurations.
            </p>
          </div>

          <Link
            href="/clients/new"
            className="flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#b5952f] text-black px-6 py-3.5 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.23)] w-full md:w-auto"
          >
            <UserPlus size={18} />
            <span>Nouveau Client</span>
          </Link>
        </div>

        {/* --- BARRE DE RECHERCHE --- */}
        <div className="relative mb-8 group animate-in fade-in slide-in-from-bottom-3 duration-500">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#D4AF37] transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Rechercher un nom, un numéro ou une ville..."
            aria-label="Rechercher un client"
            className="w-full pl-14 pr-5 py-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]/50 outline-none dark:text-white shadow-sm transition-all text-sm font-medium placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* --- LISTE DES CLIENTS --- */}
        {loading ? (
          // 🛡️ UX PRO : Skeleton Loader (Remplace le spinner clignotant)
          <div className="grid gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-[#111] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center gap-4 animate-pulse"
              >
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-20 px-4 bg-white dark:bg-[#111] rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 shadow-sm animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <Users size={32} className="text-[#D4AF37]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 font-serif">
              {searchTerm ? "Aucun résultat trouvé" : "Votre carnet est vide"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto text-sm">
              {searchTerm
                ? "Vérifiez l'orthographe ou essayez un autre mot-clé."
                : "Commencez par ajouter votre premier client pour enregistrer ses mensurations de manière sécurisée."}
            </p>
            {!searchTerm && (
              <Link
                href="/clients/new"
                className="text-[#D4AF37] font-bold hover:underline text-sm uppercase tracking-wide"
              >
                + Ajouter un client
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-3 animate-in fade-in duration-500">
            {filteredClients.map((client) => (
              <Link
                href={`/clients/${client.id}`}
                key={client.id}
                className="group block bg-white dark:bg-[#111] p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-[#D4AF37]/50 dark:hover:border-[#D4AF37]/30 transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center text-lg font-black text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-colors border border-[#D4AF37]/20">
                      {(client.full_name || "?").charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg truncate group-hover:text-[#D4AF37] transition-colors">
                        {client.full_name || "Nom Inconnu"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                        {client.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone size={12} className="text-gray-400" />{" "}
                            {client.phone}
                          </span>
                        )}
                        {client.city && (
                          <span className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-gray-400" />{" "}
                            {client.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-300 dark:text-gray-700 group-hover:text-[#D4AF37] transition-colors pl-2">
                    <MoreHorizontal />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
