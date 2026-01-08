"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Link from "next/link"; // Import indispensable pour la navigation

type Client = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
};

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase.from("clients").select("*");

      if (error) {
        console.error("Erreur lors du chargement :", error);
      } else {
        setClients(data || []);
      }
    };

    fetchClients();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* En-tête de la page */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Atelier CoutureOS 🧵
          </h1>
          <Link
            href="/clients/new"
            className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            + Nouveau Client
          </Link>
        </div>

        {/* Grille des clients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {client.full_name.charAt(0)}
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
                {/* --- MODIFICATION ICI --- */}
                {/* On utilise les `backticks` pour insérer l'ID dynamiquement */}
                <Link
                  href={`/clients/${client.id}`}
                  className="text-sm text-blue-600 font-medium hover:underline"
                >
                  Voir mesures
                </Link>
                {/* ------------------------ */}
              </div>
            </div>
          ))}

          {/* Message si vide */}
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
