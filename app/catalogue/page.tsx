"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import {
  Trash2,
  Upload,
  X,
  Camera,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
} from "lucide-react";

type Model = {
  id: string;
  title: string;
  category: string;
  image_url: string;
};

// 🔒 CONFIGURATION : LIMITE DE PHOTOS
const MAX_PHOTOS = 12;

export default function Catalogue() {
  const [models, setModels] = useState<Model[]>([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [newTitle, setNewTitle] = useState("");

  // 🔍 État pour gérer l'image ouverte en grand (Lightbox)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  // --- VERIFICATION TAILLE IMAGE ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Limite : 2 Mo
      if (selectedFile.size > 2 * 1024 * 1024) {
        alert(
          "⚠️ Image trop lourde ! Merci de choisir une photo de moins de 2 Mo."
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

    if (models.length >= MAX_PHOTOS) {
      return alert(`⚠️ Limite de ${MAX_PHOTOS} photos atteinte.`);
    }

    if (!file || !newTitle)
      return alert("Veuillez choisir une image et un titre !");

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("catalogue")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("catalogue").getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("models").insert([
        {
          title: newTitle,
          image_url: publicUrl,
          category: "Général",
        },
      ]);

      if (dbError) throw dbError;

      setFile(null);
      setNewTitle("");

      // Reset visuel de l'input
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

  // Fonction suppression
  const handleDelete = async (
    e: React.MouseEvent,
    id: string,
    imageUrl: string
  ) => {
    e.stopPropagation(); // Empêche d'ouvrir la photo quand on clique sur la poubelle

    if (!confirm("Voulez-vous vraiment supprimer ce modèle ?")) return;

    const { error } = await supabase.from("models").delete().eq("id", id);
    if (error) {
      alert("Erreur lors de la suppression");
      return;
    }

    const fileName = imageUrl.split("/").pop();
    if (fileName) {
      await supabase.storage.from("catalogue").remove([fileName]);
    }

    fetchModels();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-black transition flex items-center gap-1"
            >
              <ArrowLeft size={16} /> Retour à l&apos;atelier
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2 flex items-center gap-2">
              Catalogue & Modèles <ImageIcon className="text-[#D4AF37]" />
            </h1>
          </div>

          <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div
              className={`text-2xl font-bold ${
                models.length >= MAX_PHOTOS ? "text-red-500" : "text-black"
              }`}
            >
              {models.length}
              <span className="text-gray-300 text-lg">/</span>
              {MAX_PHOTOS}
            </div>
            <p className="text-xs text-gray-400 font-medium uppercase leading-tight">
              Photos
              <br />
              Stockées
            </p>
          </div>
        </div>

        {/* --- ZONE D'AJOUT --- */}
        {models.length < MAX_PHOTOS ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10 transition-all hover:shadow-md">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Upload size={20} /> Ajouter un nouveau modèle
            </h2>

            <form
              onSubmit={handleUpload}
              className="flex flex-col md:flex-row gap-6 items-stretch"
            >
              {/* INPUT 1 : TITRE */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du modèle
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Robe soirée rouge"
                  className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-black transition-all bg-gray-50 focus:bg-white"
                />
              </div>

              {/* INPUT 2 : FICHIER (STYLE DRAG & DROP) */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo du vêtement
                </label>
                <div className="relative group">
                  <input
                    id="model-file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    aria-label="Choisir une photo"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className={`border-2 border-dashed rounded-xl p-3 flex items-center justify-center gap-3 transition-colors ${
                      file
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 group-hover:border-gray-400 bg-gray-50"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        file
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <Camera size={20} />
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        file ? "text-green-700" : "text-gray-500"
                      }`}
                    >
                      {file ? file.name : "Cliquez pour choisir une photo"}
                    </span>
                  </div>
                </div>
              </div>

              {/* BOUTON D'ENVOI */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full md:w-auto bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gray-200"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Ajouter au catalogue"
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-100 p-6 rounded-2xl mb-10 text-center">
            <p className="text-red-600 font-bold text-lg flex items-center justify-center gap-2">
              🚨 Galerie pleine !
            </p>
            <p className="text-sm text-red-500 mt-1">
              Supprimez une ancienne photo pour faire de la place.
            </p>
          </div>
        )}

        {/* --- GALERIE PHOTO --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {models.map((model) => (
            <div
              key={model.id}
              onClick={() => setSelectedImage(model.image_url)} // Ouvre la Lightbox
              className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-zoom-in hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* IMAGE */}
              <div className="aspect-[3/4] w-full bg-gray-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={model.image_url}
                  alt={model.title}
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                />
                {/* Overlay sombre au survol */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>

              {/* INFORMATIONS */}
              <div className="p-4 relative">
                <h3 className="font-bold text-gray-900 truncate pr-8">
                  {model.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                  {model.category}
                </p>

                {/* BOUTON SUPPRIMER */}
                <button
                  onClick={(e) => handleDelete(e, model.id, model.image_url)}
                  className="absolute top-4 right-3 text-gray-300 hover:text-red-500 transition-colors p-1"
                  title="Supprimer"
                  aria-label="Supprimer le modèle"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {/* EMPTY STATE */}
          {models.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <ImageIcon size={32} className="text-gray-300" />
              </div>
              <p>Votre catalogue est vide.</p>
              <p className="text-sm">
                Ajoutez votre première création ci-dessus !
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- LIGHTBOX (MODALE PLEIN ÉCRAN) --- */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          {/* Bouton Fermer */}
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            onClick={() => setSelectedImage(null)}
            aria-label="Fermer"
          >
            <X size={32} />
          </button>

          {/* Image en grand */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage}
            alt="Zoom"
            className="max-h-[90vh] max-w-[95vw] rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()} // Évite de fermer si on clique sur l'image
          />
        </div>
      )}
    </div>
  );
}
