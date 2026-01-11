"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";

type Model = {
  id: string;
  title: string;
  category: string;
  image_url: string;
};

// 🔒 CONFIGURATION : LIMITE DE PHOTOS PAR UTILISATEUR
const MAX_PHOTOS = 12;

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
    // Supabase va filtrer automatiquement grâce aux règles RLS qu'on va ajouter après
    const { data, error } = await supabase
      .from("models")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setModels(data || []);
  };

  // --- VERIFICATION TAILLE IMAGE ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Limite : 1 Mo (1024 * 1024 octets)
      if (selectedFile.size > 1024 * 1024) {
        alert(
          "⚠️ Image trop lourde ! Merci de choisir une photo de moins de 1 Mo."
        );
        e.target.value = "";
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  // 2. Fonction pour envoyer une photo
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🛑 VERIFICATION DU QUOTA (Nouveau)
    if (models.length >= MAX_PHOTOS) {
      return alert(
        `⚠️ Vous avez atteint la limite de ${MAX_PHOTOS} photos. Supprimez-en une pour libérer de la place.`
      );
    }

    if (!file || !newTitle)
      return alert("Veuillez choisir une image et un titre !");

    setUploading(true);

    try {
      // A. Nom de fichier unique
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // B. Envoi de l'image
      const { error: uploadError } = await supabase.storage
        .from("catalogue")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // C. URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from("catalogue").getPublicUrl(filePath);

      // D. Enregistrement BDD
      const { error: dbError } = await supabase.from("models").insert([
        {
          title: newTitle,
          image_url: publicUrl,
          category: "Général",
        },
      ]);

      if (dbError) throw dbError;

      // E. Reset
      alert("Modèle ajouté avec succès ! ✨");
      setFile(null);
      setNewTitle("");

      const fileInput = document.getElementById(
        "model-file"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      fetchModels();
    } catch (error) {
      console.error("Erreur upload:", error);
      alert("Erreur lors de l'envoi !");
    } finally {
      setUploading(false);
    }
  };

  // 🗑️ NOUVEAU : Fonction pour supprimer une photo
  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce modèle ?")) return;

    // 1. Supprimer de la base de données
    const { error } = await supabase.from("models").delete().eq("id", id);

    if (error) {
      alert("Erreur lors de la suppression");
      return;
    }

    // 2. (Optionnel) Nettoyage du fichier dans le Storage
    // On essaie de récupérer le nom du fichier depuis l'URL
    const fileName = imageUrl.split("/").pop();
    if (fileName) {
      await supabase.storage.from("catalogue").remove([fileName]);
    }

    fetchModels(); // Rafraîchir la liste
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* En-tête avec Compteur */}
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

          {/* INDICATEUR DE QUOTA */}
          <div className="text-right bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
            <span
              className={`text-2xl font-bold ${
                models.length >= MAX_PHOTOS ? "text-red-500" : "text-black"
              }`}
            >
              {models.length} / {MAX_PHOTOS}
            </span>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              photos
            </p>
          </div>
        </div>

        {/* --- ZONE D'AJOUT (Masquée si quota atteint) --- */}
        {models.length < MAX_PHOTOS ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-10">
            <h2 className="font-bold text-lg mb-4">
              Ajouter un nouveau modèle
            </h2>
            <form
              onSubmit={handleUpload}
              className="flex flex-col md:flex-row gap-4 items-end"
            >
              <div className="flex-1 w-full">
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
                <label
                  htmlFor="model-file"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Photo{" "}
                  <span className="text-xs text-gray-400 font-normal">
                    (Max 1 Mo)
                  </span>
                </label>
                <input
                  id="model-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
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
        ) : (
          <div className="bg-red-50 border border-red-100 p-6 rounded-xl mb-10 text-center animate-pulse">
            <p className="text-red-600 font-bold text-lg">
              🚨 Limite atteinte !
            </p>
            <p className="text-sm text-red-500 mt-1">
              Vous avez utilisé vos 12 emplacements. Supprimez une ancienne
              photo pour en ajouter une nouvelle.
            </p>
          </div>
        )}

        {/* --- GALERIE PHOTO --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {models.map((model) => (
            <div
              key={model.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition group relative"
            >
              {/* Bouton SUPPRIMER (Croix rouge) */}
              <button
                onClick={() => handleDelete(model.id, model.image_url)}
                className="absolute top-2 right-2 bg-white text-red-500 w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-red-500 hover:text-white transition z-10 opacity-0 group-hover:opacity-100"
                title="Supprimer la photo"
              >
                🗑️
              </button>

              <div className="relative h-64 w-full bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={model.image_url}
                  alt={model.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900">{model.title}</h3>
                <p className="text-xs text-gray-400 mt-1 uppercase">
                  {model.category}
                </p>
              </div>
            </div>
          ))}

          {models.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
              Votre catalogue est vide. Ajoutez votre première photo !
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
