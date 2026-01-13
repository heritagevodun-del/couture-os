"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Settings, Search, UserPlus, Image as ImageIcon } from "lucide-react";

type Client = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
};

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // État pour la recherche
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --- 1. CHARGEMENT SÉCURISÉ ---
  useEffect(() => {
    const checkUserAndFetch = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
      } else {
        const { data, error } = await supabase.from("clients").select("*");
        if (error) {
          console.error("Erreur chargement :", error);
        } else {
          // On affiche les plus récents en premier
          setClients((data || []).reverse());
        }
        setLoading(false);
      }
    };

    checkUserAndFetch();
  }, [router]);

  // --- 2. FILTRAGE (Recherche) ---
  const filteredClients = clients.filter(
    (client) =>
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone && client.phone.includes(searchTerm)) ||
      (client.city &&
        client.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- 3. RENDU DE L'INTERFACE PRO ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 animate-pulse">
          Chargement de l&lsquo;atelier...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24">
      <div className="max-w-5xl mx-auto">
        {/* --- EN-TÊTE --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            {/* LOGO */}
            <div className="logo-bouton-bg relative w-14 h-14 bg-[#1a1a1a] rounded-full border-2 border-[#D4AF37] shadow-lg flex items-center justify-center flex-shrink-0">
              <div className="absolute w-[140%] h-[3px] bg-gradient-to-r from-gray-200 to-gray-400 -rotate-45 rounded-full shadow-sm flex items-center justify-end pr-[3px]">
                <div className="w-[5px] h-[1.5px] bg-[#1a1a1a] rounded-full"></div>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                CoutureOS
              </h1>
              <p className="text-sm text-gray-500">Tableau de bord</p>
            </div>
          </div>

          {/* ACTIONS PRINCIPALES */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              href="/catalogue"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition shadow-sm font-medium"
            >
              <ImageIcon size={18} />
              Catalogue
            </Link>

            {/* BOUTON PARAMÈTRES (Engrenage) */}
            <Link
              href="/settings"
              className="p-2.5 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 hover:text-black transition shadow-sm"
              title="Paramètres"
            >
              <Settings size={22} />
            </Link>
          </div>
        </div>

        {/* --- BARRE DE RECHERCHE + AJOUT --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Rechercher un client (nom, ville...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none shadow-sm transition-all"
            />
          </div>

          <Link
            href="/clients/new"
            className="bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition flex items-center justify-center gap-2"
          >
            <UserPlus size={20} />
            Nouveau Client
          </Link>
        </div>

        {/* --- LISTE DES CLIENTS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => (
            <Link
              href={`/clients/${client.id}`}
              key={client.id}
              className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-black/10 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center text-lg font-bold text-gray-700 group-hover:bg-black group-hover:text-white transition-colors">
                    {client.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 truncate pr-2 max-w-[140px]">
                      {client.full_name}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded-full inline-block mt-1">
                      {client.city || "Ville inconnue"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  📞 {client.phone || "---"}
                </span>
                <span className="text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
                  Voir →
                </span>
              </div>
            </Link>
          ))}

          {/* EMPTY STATE (Si recherche vide ou pas de clients) */}
          {filteredClients.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <UserPlus size={32} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">
                {searchTerm
                  ? "Aucun résultat trouvé."
                  : "Votre carnet d'adresses est vide."}
              </p>
              {!searchTerm && (
                <p className="text-sm text-gray-400 mt-1">
                  Commencez par ajouter votre premier client !
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
