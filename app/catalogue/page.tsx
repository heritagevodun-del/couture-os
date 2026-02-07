"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
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
  AlertCircle,
} from "lucide-react";

type Model = {
  id: string;
  title: string;
  category: string;
  image_url: string;
};

// 🔒 CONFIGURATION : LIMITE DE PHOTOS (20)
const MAX_PHOTOS = 20;

export default function Catalogue() {
  const supabase = createClient();
  const [models, setModels] = useState<Model[]>([]);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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

      const { data, error } = await supabase
        .from("models")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) console.error("Erreur fetch:", error);
      else setModels(data || []);
    };

    fetchModels();
  }, [router, supabase]);

  // --- VERIFICATION TAILLE IMAGE ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Limite 4 Mo pour être large
      if (selectedFile.size > 4 * 1024 * 1024) {
        setErrorMsg("⚠️ Image trop lourde ! Max 4 Mo.");
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
    setErrorMsg(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    if (models.length >= MAX_PHOTOS) {
      setErrorMsg(`⚠️ Limite de ${MAX_PHOTOS} photos atteinte.`);
      return;
    }
    if (!file || !newTitle) {
      setErrorMsg("Veuillez choisir une image et un titre !");
      return;
    }

    setUploading(true);

    try {
      // 1. Upload Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("catalogue")
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
      setErrorMsg("Erreur lors de l'envoi ! Vérifiez votre connexion.");
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

    const { error } = await supabase.from("models").delete().eq("id", id);
    if (error) {
      setErrorMsg("Erreur lors de la suppression DB");
      return;
    }

    try {
      const urlObj = new URL(imageUrl);
      const pathParts = urlObj.pathname.split("/catalogue/");
      if (pathParts.length > 1) {
        await supabase.storage.from("catalogue").remove([pathParts[1]]);
      }
    } catch (e) {
      console.warn("Impossible de supprimer l'image du storage", e);
    }

    setModels((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4 md:p-8 transition-colors duration-300 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition flex items-center gap-1 font-medium mb-2"
            >
              <ArrowLeft size={16} /> Retour
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Catalogue <ImageIcon className="text-[#D4AF37]" size={24} />
            </h1>
          </div>

          <div className="bg-white dark:bg-neutral-900 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <span className="text-xs text-gray-400 font-medium uppercase leading-tight">
              Capacité
              <br />
              Stockage
            </span>
            <div
              className={`text-xl font-bold ${
                models.length >= MAX_PHOTOS
                  ? "text-red-500"
                  : "text-black dark:text-white"
              }`}
            >
              {models.length}
              <span className="text-gray-300 dark:text-gray-600 text-base mx-1">
                /
              </span>
              {MAX_PHOTOS}
            </div>
          </div>
        </div>

        {/* --- MESSAGE D'ERREUR --- */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2">
            <AlertCircle size={20} />
            <p className="text-sm font-medium">{errorMsg}</p>
            {/* 🛠️ FIX A11Y : Ajout de aria-label */}
            <button
              onClick={() => setErrorMsg(null)}
              className="ml-auto"
              aria-label="Fermer le message d'erreur"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* --- ZONE D'AJOUT --- */}
        {models.length < MAX_PHOTOS ? (
          <div className="bg-white dark:bg-neutral-900 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-8 transition-all">
            <h2 className="font-bold text-base md:text-lg mb-4 flex items-center gap-2 dark:text-white">
              <Upload size={18} /> Ajouter un modèle
            </h2>

            <form
              onSubmit={handleUpload}
              className="flex flex-col md:flex-row gap-4 items-stretch"
            >
              <div className="flex-1">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Titre (ex: Robe Rouge)"
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-black dark:text-white placeholder-gray-400 text-sm md:text-base"
                />
              </div>

              <div className="flex-1 relative group">
                {/* 🛠️ FIX A11Y : Ajout de aria-label */}
                <input
                  id="model-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  aria-label="Choisir une photo"
                />
                <div
                  className={`border-2 border-dashed rounded-xl p-3 flex items-center justify-center gap-3 transition-colors h-full ${
                    file
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  }`}
                >
                  <Camera
                    size={20}
                    className={file ? "text-green-600" : "text-gray-400"}
                  />
                  <span
                    className={`text-sm font-medium truncate max-w-[150px] ${
                      file
                        ? "text-green-700 dark:text-green-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {file ? file.name : "Prendre/Choisir photo"}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full md:w-auto bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {uploading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Ajouter"
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50 p-4 rounded-xl mb-8 text-center">
            <p className="text-orange-600 dark:text-orange-400 font-bold text-sm flex items-center justify-center gap-2">
              🚨 Galerie pleine ({MAX_PHOTOS}/{MAX_PHOTOS})
            </p>
          </div>
        )}

        {/* --- GALERIE PHOTO RESPONSIVE --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {models.map((model) => (
            <div
              key={model.id}
              onClick={() => setSelectedImage(model.image_url)}
              className="group relative bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden cursor-pointer"
            >
              <div className="aspect-[3/4] w-full bg-gray-100 dark:bg-gray-800 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={model.image_url}
                  alt={model.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-3">
                <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm">
                  {model.title}
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">
                  {model.category}
                </p>
                {/* 🛠️ FIX A11Y : Ajout de aria-label */}
                <button
                  onClick={(e) => handleDelete(e, model.id, model.image_url)}
                  className="absolute top-2 right-2 text-white bg-black/40 hover:bg-red-500 p-1.5 rounded-full transition-all backdrop-blur-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Supprimer le modèle"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {models.length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-neutral-900 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800">
              <ImageIcon
                size={32}
                className="text-gray-300 dark:text-gray-600 mb-2"
              />
              <p className="text-sm">Votre catalogue est vide.</p>
            </div>
          )}
        </div>
      </div>

      {/* --- LIGHTBOX --- */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          {/* 🛠️ FIX A11Y : Ajout de aria-label */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-all"
            onClick={() => setSelectedImage(null)}
            aria-label="Fermer l'aperçu"
          >
            <X size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage}
            alt="Zoom"
            className="max-h-[85vh] max-w-full rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
