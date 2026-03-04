"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image"; // 👈 L'arme secrète de Next.js
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

  // 🛡️ NOUVEAU : État pour le chargement initial (évite le glitch du vide)
  const [initialLoading, setInitialLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

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

      if (error) {
        console.error("Erreur fetch:", error);
      } else {
        setModels(data || []);
      }
      setInitialLoading(false); // 👈 Fin du chargement
    };

    fetchModels();
  }, [router, supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 4 * 1024 * 1024) {
        setErrorMsg("⚠️ Image trop lourde ! Maximum 4 Mo.");
        e.target.value = "";
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return router.push("/login");

    if (models.length >= MAX_PHOTOS) {
      setErrorMsg(
        `⚠️ Limite de ${MAX_PHOTOS} photos atteinte. Veuillez en supprimer pour faire de la place.`,
      );
      return;
    }
    if (!file || !newTitle) {
      setErrorMsg("Veuillez choisir une image et définir un titre.");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

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
          user_id: user.id,
        },
      ]);

      if (dbError) throw dbError;

      setFile(null);
      setNewTitle("");
      const fileInput = document.getElementById(
        "model-file",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Rafraîchissement direct
      const { data } = await supabase
        .from("models")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setModels(data || []);
    } catch (error) {
      console.error("Erreur upload:", error);
      setErrorMsg(
        "Erreur lors de l'envoi de l'image. Vérifiez votre connexion.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (
    e: React.MouseEvent,
    id: string,
    imageUrl: string,
  ) => {
    e.stopPropagation();
    if (
      !confirm("Voulez-vous vraiment supprimer ce modèle de votre catalogue ?")
    )
      return;

    // Suppression en base de données d'abord
    const { error } = await supabase.from("models").delete().eq("id", id);
    if (error) {
      setErrorMsg("Erreur lors de la suppression de l'image.");
      return;
    }

    // Extraction robuste du chemin de l'image pour Supabase Storage
    try {
      const urlObj = new URL(imageUrl);
      // Les URL publiques Supabase finissent par /object/public/bucket_name/chemin/fichier.jpg
      const pathMatches = urlObj.pathname.match(/\/catalogue\/(.+)$/);
      if (pathMatches && pathMatches[1]) {
        await supabase.storage.from("catalogue").remove([pathMatches[1]]);
      }
    } catch (e) {
      console.warn("L'image physique n'a pas pu être supprimée du bucket:", e);
    }

    // Mise à jour de l'UI
    setModels((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] dark:bg-[#050505] p-4 md:p-8 transition-colors duration-300 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Link
              href="/dashboard"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#D4AF37] dark:hover:text-[#D4AF37] transition-colors flex items-center gap-1.5 font-bold uppercase tracking-wider mb-3"
            >
              <ArrowLeft size={14} /> Retour au tableau de bord
            </Link>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3 font-serif tracking-tight">
              Catalogue <ImageIcon className="text-[#D4AF37]" size={28} />
            </h1>
          </div>

          <div className="bg-white dark:bg-[#111] px-5 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-tight">
              Capacité du
              <br />
              Stockage
            </span>
            <div
              className={`text-2xl font-black ${models.length >= MAX_PHOTOS ? "text-red-500" : "text-gray-900 dark:text-white"}`}
            >
              {models.length}
              <span className="text-gray-300 dark:text-gray-700 text-lg mx-1.5 font-normal">
                /
              </span>
              {MAX_PHOTOS}
            </div>
          </div>
        </div>

        {/* --- MESSAGE D'ERREUR --- */}
        {errorMsg && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2 shadow-sm">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
            <button
              onClick={() => setErrorMsg(null)}
              className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
              aria-label="Fermer le message d'erreur"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* --- ZONE D'AJOUT --- */}
        {models.length < MAX_PHOTOS ? (
          <div className="bg-white dark:bg-[#111] p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 mb-10 transition-all">
            <h2 className="font-bold text-sm text-gray-900 dark:text-white mb-5 flex items-center gap-2 uppercase tracking-wide">
              <Upload size={16} className="text-[#D4AF37]" /> Ajouter une
              nouvelle création
            </h2>

            <form
              onSubmit={handleUpload}
              className="flex flex-col md:flex-row gap-5 items-stretch"
            >
              <div className="flex-1">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nom du modèle (ex: Robe de soirée perlée)"
                  className="w-full px-5 py-4 border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all bg-gray-50 dark:bg-black text-gray-900 dark:text-white placeholder-gray-400 text-sm font-medium"
                />
              </div>

              <div className="flex-1 relative group">
                <input
                  id="model-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  aria-label="Choisir une photo"
                />
                <div
                  className={`border-2 border-dashed rounded-2xl p-4 flex items-center justify-center gap-3 transition-colors h-full ${
                    file
                      ? "border-[#D4AF37] bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10"
                      : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black group-hover:border-[#D4AF37]/50"
                  }`}
                >
                  <Camera
                    size={20}
                    className={file ? "text-[#D4AF37]" : "text-gray-400"}
                  />
                  <span
                    className={`text-sm font-bold truncate max-w-[200px] ${
                      file
                        ? "text-[#D4AF37]"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {file ? file.name : "Prendre ou choisir une photo"}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full md:w-auto bg-[#D4AF37] hover:bg-[#b5952f] text-black px-8 py-4 rounded-2xl font-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 text-sm shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.23)]"
              >
                {uploading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Sauvegarder"
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 p-6 rounded-3xl mb-10 text-center shadow-sm">
            <p className="text-orange-700 dark:text-orange-400 font-bold text-sm flex items-center justify-center gap-2">
              🚨 Votre galerie est pleine ({MAX_PHOTOS}/{MAX_PHOTOS}). Supprimez
              d&apos;anciennes créations pour en ajouter de nouvelles.
            </p>
          </div>
        )}

        {/* --- GALERIE PHOTO RESPONSIVE --- */}
        {initialLoading ? (
          // SQUELETTE DE CHARGEMENT
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse"
              ></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {models.map((model) => (
              <div
                key={model.id}
                onClick={() => setSelectedImage(model.image_url)}
                className="group relative bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden cursor-pointer hover:shadow-lg transition-all"
              >
                <div className="aspect-[3/4] w-full bg-gray-100 dark:bg-black relative overflow-hidden">
                  {/* 🛡️ OPTIMISATION SEO/PERFORMANCE : Composant Image natif */}
                  <Image
                    src={model.image_url}
                    alt={`Création : ${model.title}`}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />
                  {/* Overlay subtil au survol pour améliorer le contraste du bouton poubelle */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="p-4 relative z-10 bg-white dark:bg-[#111]">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm group-hover:text-[#D4AF37] transition-colors">
                    {model.title}
                  </h3>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest font-bold">
                    {model.category}
                  </p>
                </div>

                <button
                  onClick={(e) => handleDelete(e, model.id, model.image_url)}
                  className="absolute top-3 right-3 text-white bg-black/50 hover:bg-red-500 p-2 rounded-full transition-all backdrop-blur-md opacity-100 md:opacity-0 md:group-hover:opacity-100 shadow-sm"
                  aria-label="Supprimer le modèle"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {models.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-[#111] rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 shadow-sm">
                <ImageIcon
                  size={48}
                  className="text-gray-300 dark:text-gray-700 mb-4"
                  strokeWidth={1}
                />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Votre vitrine est vide.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  Ajoutez votre première création ci-dessus.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- LIGHTBOX (ZOOM) --- */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all"
            onClick={() => setSelectedImage(null)}
            aria-label="Fermer l'aperçu"
          >
            <X size={24} />
          </button>

          <div
            className="relative w-full max-w-4xl h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* L'image dans la lightbox utilise object-contain pour ne pas être coupée */}
            <Image
              src={selectedImage}
              alt="Aperçu de la création"
              fill
              sizes="100vw"
              className="object-contain drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      )}
    </div>
  );
}
