"use client"; // Indique que cette page fonctionne sur le navigateur (pour pouvoir cliquer, charger, etc.)

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

// On définit à quoi ressemble un Client (pour aider l'ordinateur à comprendre)
type Client = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
};

export default function Home() {
  // 1. L'état : C'est la mémoire de la page. Au début, la liste est vide [].
  const [clients, setClients] = useState<Client[]>([]);

  // 2. L'effet : Ce code se lance une seule fois quand la page s'ouvre.
  useEffect(() => {
    const fetchClients = async () => {
      // On demande à Supabase : "Donne-moi tout (*) depuis la table 'clients'"
      const { data, error } = await supabase.from("clients").select("*");

      if (error) {
        console.error("Erreur lors du chargement :", error);
      } else {
        // Si ça marche, on met les données dans la mémoire de la page
        setClients(data || []);
      }
    };

    fetchClients();
  }, []);

  // 3. L'affichage : Ce que voit l'utilisateur
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* En-tête de la page */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Atelier CoutureOS 🧵
          </h1>
          <button className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition">
            + Nouveau Client
          </button>
        </div>

        {/* Grille des clients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* On fait une boucle : Pour chaque client, on dessine une carte */}
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {client.full_name.charAt(0)} {/* Première lettre du nom */}
                </div>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                  {client.city}
                </span>
              </div>

              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                {client.full_name}
              </h2>

              <p className="mt-1 text-sm text-gray-500 flex items-center gap-2">
                📞 {client.phone || "Pas de numéro"}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                <button className="text-sm text-blue-600 font-medium hover:underline">
                  Voir mesures
                </button>
              </div>
            </div>
          ))}

          {/* Si la liste est vide, on affiche un message */}
          {clients.length === 0 && (
            <p className="col-span-3 text-center text-gray-400 py-10">
              Chargement des clients...
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
