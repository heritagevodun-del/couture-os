"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();

  // 1. Charger le catalogue SÉCURISÉ (User Only)
  useEffect(() => {
    const fetchModels = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 🔐 SÉCURITÉ : On filtre par user_id
      const { data, error } = await supabase
        .from("models") // Assure-toi que la table s'appelle bien 'models' ou 'catalog' (on avait dit 'catalog' dans le SQL V2, vérifie !)
        .select("*") // Si tu as gardé 'models' dans ton Supabase, laisse 'models'. Si c'est 'catalog', change ici.
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) console.error("Erreur fetch:", error);
      else setModels(data || []);
    };

    fetchModels();
  }, [router]);

  // --- VERIFICATION TAILLE IMAGE ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Limite 4 Mo pour être large
      if (selectedFile.size > 4 * 1024 * 1024) {
        alert("⚠️ Image trop lourde ! Max 4 Mo.");
        e.target.value = "";
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  // 2. Fonction pour envoyer une photo SÉCURISÉE
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    if (models.length >= MAX_PHOTOS)
      return alert(`⚠️ Limite de ${MAX_PHOTOS} photos atteinte.`);
    if (!file || !newTitle)
      return alert("Veuillez choisir une image et un titre !");

    setUploading(true);

    try {
      // 1. Upload Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("catalogue") // Vérifie que le bucket s'appelle bien 'catalogue' dans Supabase Storage
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("catalogue").getPublicUrl(filePath);

      // 3. Insert Database
      const { error: dbError } = await supabase.from("models").insert([
        {
          title: newTitle,
          image_url: publicUrl,
          category: "Général",
          user_id: user.id,
        },
      ]);

      if (dbError) throw dbError;

      // Reset
      setFile(null);
      setNewTitle("");
      const fileInput = document.getElementById(
        "model-file",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh local
      const { data } = await supabase
        .from("models")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setModels(data || []);
    } catch (error) {
      console.error("Erreur upload:", error);
      alert("Erreur lors de l'envoi ! Vérifiez votre connexion.");
    } finally {
      setUploading(false);
    }
  };

  // Fonction suppression
  const handleDelete = async (
    e: React.MouseEvent,
    id: string,
    imageUrl: string,
  ) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment supprimer ce modèle ?")) return;

    // Supprimer de la base
    const { error } = await supabase.from("models").delete().eq("id", id);
    if (error) {
      alert("Erreur lors de la suppression DB");
      return;
    }

    // Supprimer du storage (Optionnel mais propre)
    const fileName = imageUrl.split("/").pop();
    if (fileName) {
      await supabase.storage.from("catalogue").remove([fileName]);
    }

    // Mise à jour locale
    setModels((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-6 md:p-8 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Link
               href="/dashboard"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition flex items-center gap-1 font-medium"
            >
              <ArrowLeft size={16} /> Retour à l&apos;atelier
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2 flex items-center gap-2">
              Catalogue & Modèles <ImageIcon className="text-[#D4AF37]" />
            </h1>
          </div>

          <div className="bg-white dark:bg-neutral-900 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
            <div
              className={`text-2xl font-bold ${
                models.length >= MAX_PHOTOS
                  ? "text-red-500"
                  : "text-black dark:text-white"
              }`}
            >
              {models.length}
              <span className="text-gray-300 dark:text-gray-600 text-lg mx-1">
                /
              </span>
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
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-10 transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
              <Upload size={20} /> Ajouter un nouveau modèle
            </h2>

            <form
              onSubmit={handleUpload}
              className="flex flex-col md:flex-row gap-6 items-stretch"
            >
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Titre du modèle
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Robe soirée rouge"
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-black dark:text-white placeholder-gray-400"
                />
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-300 dark:border-gray-700 group-hover:border-gray-400 dark:group-hover:border-gray-500 bg-gray-50 dark:bg-gray-800"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full ${
                        file
                          ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <Camera size={20} />
                    </div>
                    <span
                      className={`text-sm font-medium truncate max-w-[200px] ${
                        file
                          ? "text-green-700 dark:text-green-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {file ? file.name : "Cliquez pour choisir"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full md:w-auto bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gray-200 dark:shadow-none"
                >
                  {uploading ? <Loader2 className="animate-spin" /> : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 p-6 rounded-2xl mb-10 text-center">
            <p className="text-red-600 dark:text-red-400 font-bold text-lg flex items-center justify-center gap-2">
              🚨 Galerie pleine !
            </p>
            <p className="text-sm text-red-500 dark:text-red-300 mt-1">
              Supprimez une ancienne photo pour faire de la place.
            </p>
          </div>
        )}

        {/* --- GALERIE PHOTO --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {models.map((model) => (
            <div
              key={model.id}
              onClick={() => setSelectedImage(model.image_url)}
              className="group relative bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden cursor-zoom-in hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-[3/4] w-full bg-gray-100 dark:bg-gray-800 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={model.image_url}
                  alt={model.title}
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </div>
              <div className="p-4 relative">
                <h3 className="font-bold text-gray-900 dark:text-white truncate pr-8">
                  {model.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                  {model.category}
                </p>
                <button
                  onClick={(e) => handleDelete(e, model.id, model.image_url)}
                  className="absolute top-4 right-3 text-white/50 hover:text-red-500 bg-black/20 hover:bg-white p-1.5 rounded-full transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100"
                  title="Supprimer"
                  aria-label="Supprimer le modèle"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {models.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <ImageIcon
                  size={32}
                  className="text-gray-300 dark:text-gray-600"
                />
              </div>
              <p>Votre catalogue est vide.</p>
              <p className="text-sm">
                Ajoutez votre première création ci-dessus !
              </p>
            </div>
          )}
        </div>
      </div>

      {/* --- LIGHTBOX --- */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            onClick={() => setSelectedImage(null)}
            aria-label="Fermer"
          >
            <X size={32} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage}
            alt="Zoom"
            className="max-h-[90vh] max-w-[95vw] rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
