"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client"; // ✅ Correction Import
import Link from "next/link";
import {
  Search,
  UserPlus,
  MoreHorizontal,
  Phone,
  MapPin,
  Loader2,
  Users,
  ArrowLeft,
} from "lucide-react";

// Type pour nos clients
type Client = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  created_at: string;
};

export default function ClientsPage() {
  const supabase = createClient(); // ✅ Initialisation correcte
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Récupération des données
  useEffect(() => {
    const fetchClients = async () => {
      // On récupère l'utilisateur courant
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // On récupère tous les clients de l'utilisateur, triés par les plus récents
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

  // 2. Filtrage (Recherche)
  const filteredClients = clients.filter(
    (client) =>
      (client.full_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (client.phone || "").includes(searchTerm) ||
      (client.city || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4 md:p-6 transition-colors duration-300 pb-20">
      <div className="max-w-5xl mx-auto">
        {/* --- HEADER NAV --- */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft size={18} /> Retour au tableau de bord
          </Link>
        </div>

        {/* --- TITRE ET ACTIONS (Mobile Friendly) --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Mes Clients
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Gérez votre carnet d&apos;adresses et accédez aux mesures.
            </p>
          </div>

          <Link
            href="/clients/new"
            className="flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-gray-200 dark:shadow-none w-full md:w-auto"
          >
            <UserPlus size={18} />
            <span>Nouveau Client</span>
          </Link>
        </div>

        {/* --- BARRE DE RECHERCHE --- */}
        <div className="relative mb-6 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone ou ville..."
            aria-label="Rechercher un client"
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-gray-800 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white shadow-sm transition-all text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* --- LISTE DES CLIENTS --- */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-gray-400" size={40} />
          </div>
        ) : filteredClients.length === 0 ? (
          // CAS LISTE VIDE
          <div className="text-center py-16 px-4 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {searchTerm ? "Aucun résultat trouvé" : "Votre carnet est vide"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto text-sm">
              {searchTerm
                ? "Essayez une autre recherche."
                : "Commencez par ajouter votre premier client pour enregistrer ses mesures."}
            </p>
            {!searchTerm && (
              <Link
                href="/clients/new"
                className="text-[#D4AF37] font-bold hover:underline text-sm"
              >
                Ajouter un client maintenant
              </Link>
            )}
          </div>
        ) : (
          // TABLEAU / LISTE
          <div className="grid gap-3">
            {filteredClients.map((client) => (
              <Link
                href={`/clients/${client.id}`}
                key={client.id}
                className="group block bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-black dark:hover:border-white transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 overflow-hidden">
                    {/* Avatar Initiale (Sécurisé) */}
                    <div className="flex-shrink-0 w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 group-hover:bg-black group-hover:text-[#D4AF37] dark:group-hover:bg-white dark:group-hover:text-black transition-colors border border-gray-200 dark:border-gray-700">
                      {(client.full_name || "?").charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg truncate">
                        {client.full_name || "Nom Inconnu"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {client.phone || "---"}
                        </span>
                        {client.city && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {client.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-gray-300 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white transition-colors pl-2">
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
