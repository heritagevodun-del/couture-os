"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Client = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
};

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const router = useRouter();

  // --- 1. CHARGEMENT DES DONNÉES ET SÉCURITÉ ---
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
          console.error("Erreur lors du chargement :", error);
        } else {
          // On inverse pour voir les derniers ajoutés en premier
          setClients((data || []).reverse());
        }
      }
    };

    checkUserAndFetch();
  }, [router]);

  // --- 2. FONCTION DE SUPPRESSION ---
  const deleteClient = async (clientId: string) => {
    // A. Sécurité : On demande confirmation
    const isConfirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible."
    );

    if (!isConfirmed) return; // Si on annule, on arrête tout.

    // B. Suppression dans Supabase
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId);

    if (error) {
      alert("Erreur lors de la suppression : " + error.message);
    } else {
      // C. Mise à jour visuelle immédiate (sans recharger la page)
      setClients((currentClients) =>
        currentClients.filter((client) => client.id !== clientId)
      );
    }
  };

  // --- 3. FONCTION DE DÉCONNEXION (Nouveau) ---
  const handleLogout = async () => {
    const isConfirmed = window.confirm(
      "Voulez-vous vraiment vous déconnecter ?"
    );
    if (isConfirmed) {
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* --- EN-TÊTE RESPONSIVE --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          {/* LOGO BOUTON + TITRE */}
          <div className="flex items-center gap-4">
            <div className="logo-bouton-bg relative w-12 h-12 bg-[#1a1a1a] rounded-full border-2 border-[#D4AF37] shadow-md flex items-center justify-center flex-shrink-0">
              <div className="absolute w-[140%] h-[3px] bg-gradient-to-r from-gray-200 to-gray-400 -rotate-45 rounded-full shadow-sm flex items-center justify-end pr-[3px]">
                <div className="w-[5px] h-[1.5px] bg-[#1a1a1a] rounded-full"></div>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">CoutureOS</h1>
          </div>

          {/* BOUTONS */}
          <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
            {/* Bouton Déconnexion (Rouge) */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 font-medium hover:bg-red-100 transition text-sm flex items-center gap-2"
            >
              🚪 Sortir
            </button>

            <Link
              href="/catalogue"
              className="flex-1 md:flex-none text-center bg-white text-black border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              📸 Catalogue
            </Link>

            <Link
              href="/clients/new"
              className="flex-1 md:flex-none text-center bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition whitespace-nowrap"
            >
              + Nouveau Client
            </Link>
          </div>
        </div>

        {/* Grille des clients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="relative bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              {/* --- BOUTON SUPPRIMER (POUBELLE) --- */}
              <button
                onClick={() => deleteClient(client.id)}
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-1"
                title="Supprimer ce client"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>

              <div className="flex items-start justify-between pr-8">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {client.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                  {client.city || "Ville ?"}
                </span>
              </div>

              <h2 className="mt-4 text-lg font-semibold text-gray-900 truncate">
                {client.full_name}
              </h2>

              <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                📞 {client.phone || "Pas de numéro"}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                <Link
                  href={`/clients/${client.id}`}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  Voir mesures
                </Link>
              </div>
            </div>
          ))}

          {/* Message si vide */}
          {clients.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-400">Aucun client pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
