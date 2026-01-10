"use client";

import { useEffect, useState } from "react";
// CORRECTION 1 : Un seul "../" suffit pour revenir dans 'app' où se trouve 'lib'
import { supabase } from "../lib/supabase";
import Link from "next/link";

type Model = {
  id: string;
  title: string;
  category: string;
  image_url: string;
};

export default function Catalogue() {
  const [models, setModels] = useState<Model[]>([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [newTitle, setNewTitle] = useState("");

  // 1. Charger le catalogue au démarrage
  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setModels(data || []);
  };

  // 2. Fonction pour envoyer une photo
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !newTitle)
      return alert("Veuillez choisir une image et un titre !");

    setUploading(true);

    try {
      // A. Nom de fichier unique
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // B. Envoi de l'image dans le Storage "catalogue"
      const { error: uploadError } = await supabase.storage
        .from("catalogue")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // C. Récupération de l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from("catalogue").getPublicUrl(filePath);

      // D. Enregistrement dans la base de données
      const { error: dbError } = await supabase.from("models").insert([
        {
          title: newTitle,
          image_url: publicUrl,
          category: "Général",
        },
      ]);

      if (dbError) throw dbError;

      // E. Reset et rechargement
      alert("Modèle ajouté avec succès ! ✨");
      setFile(null);
      setNewTitle("");
      fetchModels();
    } catch (error) {
      console.error("Erreur upload:", error);
      alert("Erreur lors de l'envoi !");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-black transition"
            >
              ← Retour à l&apos;atelier
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              Catalogue & Modèles 📸
            </h1>
          </div>
        </div>

        {/* --- ZONE D'AJOUT (UPLOAD) --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-10">
          <h2 className="font-bold text-lg mb-4">Ajouter un nouveau modèle</h2>
          <form
            onSubmit={handleUpload}
            className="flex flex-col md:flex-row gap-4 items-end"
          >
            <div className="flex-1 w-full">
              {/* CORRECTION 2 : Ajout de htmlFor et id */}
              <label
                htmlFor="model-title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Titre du modèle
              </label>
              <input
                id="model-title"
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Robe soirée rouge"
                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex-1 w-full">
              {/* CORRECTION 2 : Ajout de htmlFor et id */}
              <label
                htmlFor="model-file"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Photo
              </label>
              <input
                id="model-file"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setFile(e.target.files ? e.target.files[0] : null)
                }
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 h-10"
            >
              {uploading ? "Envoi..." : "Ajouter au catalogue"}
            </button>
          </form>
        </div>

        {/* --- GALERIE PHOTO --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {models.map((model) => (
            <div
              key={model.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition group"
            >
              {/* Image */}
              <div className="relative h-64 w-full bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={model.image_url}
                  alt={model.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              {/* Infos */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900">{model.title}</h3>
                <p className="text-xs text-gray-400 mt-1 uppercase">
                  {model.category}
                </p>
              </div>
            </div>
          ))}

          {models.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400">
              Votre catalogue est vide. Ajoutez votre première photo !
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
