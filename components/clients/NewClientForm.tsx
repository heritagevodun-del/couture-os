"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MEASUREMENT_TEMPLATES } from "@/app/constants/measurements";
import {
  ArrowLeft,
  User,
  FileText,
  Loader2,
  Ruler,
  Plus,
  Trash2,
  Save,
  Shirt,
  AlertCircle,
} from "lucide-react";

export default function NewClientForm() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    city: "",
    notes: "",
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState(
    MEASUREMENT_TEMPLATES[0].id,
  );
  const [measureValues, setMeasureValues] = useState<Record<string, string>>(
    {},
  );
  const [customFields, setCustomFields] = useState<
    { id: string; label: string }[]
  >([]);
  const [newCustomLabel, setNewCustomLabel] = useState("");

  const currentTemplate =
    MEASUREMENT_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
    MEASUREMENT_TEMPLATES[0];

  // 🛡️ UX PRO : Gestion du changement de modèle sans laisser de données fantômes
  const handleTemplateChange = (newTemplateId: string) => {
    // Si des mesures ont déjà été saisies, on demande confirmation avant d'effacer
    const hasMeasurements = Object.keys(measureValues).length > 0;

    if (hasMeasurements) {
      const confirmReset = window.confirm(
        "Changer de modèle effacera les mesures actuellement saisies. Continuer ?",
      );
      if (!confirmReset) return;
    }

    setSelectedTemplateId(newTemplateId);
    setMeasureValues({}); // On purge les données de l'ancien modèle
    setCustomFields([]); // On purge aussi les champs personnalisés liés à l'ancien modèle
  };

  // 🛡️ UX PRO : Accepte la virgule et le point comme séparateur décimal sur mobile
  const handleMeasureChange = (id: string, rawValue: string) => {
    // On remplace la virgule par un point pour que le format JSON/Number soit standard
    const sanitizedValue = rawValue.replace(",", ".");
    setMeasureValues((prev) => ({ ...prev, [id]: sanitizedValue }));
  };

  const addCustomField = () => {
    if (!newCustomLabel.trim()) return;
    const newId = `custom_${Date.now()}`;
    setCustomFields([...customFields, { id: newId, label: newCustomLabel }]);
    setNewCustomLabel("");
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
    const newValues = { ...measureValues };
    delete newValues[id];
    setMeasureValues(newValues);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Nettoyage final : on enlève les champs vides avant de sauvegarder en base de données
      const cleanedMeasures: Record<string, string> = {};
      for (const [key, value] of Object.entries(measureValues)) {
        if (value && value.trim() !== "") {
          cleanedMeasures[key] = value;
        }
      }

      const measurementsJSON = {
        _template_id: selectedTemplateId,
        _template_name: currentTemplate.label,
        _custom_fields_def: customFields,
        ...cleanedMeasures, // 👈 On enregistre uniquement les mesures réellement saisies
      };

      const { error: dbError } = await supabase.from("clients").insert([
        {
          full_name: formData.full_name,
          phone: formData.phone,
          city: formData.city || "Non renseigné",
          notes: formData.notes,
          measurements: measurementsJSON,
          user_id: user.id,
        },
      ]);

      if (dbError) throw dbError;

      router.push("/clients");
      router.refresh();
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      if (errorObj.code === "23505") {
        setError("Ce client existe déjà dans votre base de données.");
      } else if (errorObj.message?.includes("policy")) {
        setError(
          "⚠️ Erreur de permissions. Déconnectez-vous puis reconnectez-vous.",
        );
      } else {
        setError(errorObj.message || "Une erreur inattendue est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/clients"
          className="p-2 bg-white dark:bg-[#111] rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/30 transition shadow-sm"
          aria-label="Retour à la liste des clients"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-serif tracking-tight">
          Nouveau Client
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 animate-in slide-in-from-top-2">
          <AlertCircle size={20} className="flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* COLONNE GAUCHE : IDENTITÉ */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-[#111] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
              <User size={14} className="text-[#D4AF37]" /> Fiche
              d&apos;identité
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37]/50 outline-none dark:text-white text-sm transition-all placeholder:text-gray-400"
                  placeholder="Ex: Jean DOSSOU"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 outline-none dark:text-white text-sm transition-all placeholder:text-gray-400"
                  placeholder="Ex: +229 90 12 34 56"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">
                  Ville
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 outline-none dark:text-white text-sm transition-all placeholder:text-gray-400"
                  placeholder="Ex: Cotonou"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText size={14} className="text-[#D4AF37]" /> Notes &
              Préférences
            </h2>
            <textarea
              rows={4}
              className="w-full px-4 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-[#D4AF37]/50 outline-none resize-none dark:text-white text-sm transition-all placeholder:text-gray-400"
              placeholder="Allergies, préférences de tissu, habitudes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>
        </div>

        {/* COLONNE DROITE : MESURES */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#111] p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col relative overflow-hidden">
            {/* Décoration subtile en arrière-plan */}
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Ruler size={120} className="rotate-45" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 relative z-10">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Ruler size={14} className="text-[#D4AF37]" /> Mensurations
              </h2>
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  aria-label="Sélectionner un gabarit de mesure"
                  className="w-full sm:w-auto appearance-none bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold pl-11 pr-10 py-3 rounded-xl text-sm cursor-pointer hover:opacity-90 transition shadow-md outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  {MEASUREMENT_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      Modèle : {t.label}
                    </option>
                  ))}
                </select>
                <Shirt className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 dark:text-black/50 w-4 h-4 pointer-events-none" />
              </div>
            </div>

            {/* GRILLE DES MESURES STANDARD */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8 relative z-10">
              {currentTemplate.fields.map((field) => (
                <div
                  key={field.id}
                  className="bg-gray-50 dark:bg-black p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 focus-within:ring-2 focus-within:ring-[#D4AF37]/50 focus-within:border-transparent transition-all group"
                >
                  <label
                    className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-500 mb-1.5 truncate group-focus-within:text-[#D4AF37] transition-colors"
                    title={field.label}
                  >
                    {field.label}
                  </label>
                  <div className="flex items-baseline gap-1">
                    <input
                      type="text" // 👈 Changé en 'text' pour mieux gérer les virgules natives sur mobile
                      inputMode="decimal"
                      className="w-full bg-transparent border-none outline-none text-xl sm:text-2xl font-bold text-gray-900 dark:text-white p-0 placeholder-gray-300 dark:placeholder-gray-700"
                      placeholder="0"
                      value={measureValues[field.id] || ""}
                      onChange={(e) =>
                        handleMeasureChange(field.id, e.target.value)
                      }
                    />
                    <span className="text-xs text-gray-400 font-medium">
                      cm
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* MESURES PERSONNALISÉES */}
            {customFields.length > 0 && (
              <div className="mb-6 animate-in fade-in relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
                  <h3 className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                    Mesures Spécifiques
                  </h3>
                  <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  {customFields.map((field) => (
                    <div
                      key={field.id}
                      className="bg-[#D4AF37]/5 dark:bg-[#D4AF37]/10 p-3.5 rounded-xl border border-[#D4AF37]/20 relative group focus-within:ring-2 focus-within:ring-[#D4AF37]/50 transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => removeCustomField(field.id)}
                        aria-label={`Supprimer ${field.label}`}
                        className="absolute top-2 right-2 text-[#D4AF37]/50 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 size={14} />
                      </button>
                      <label className="block text-[10px] uppercase font-bold text-[#D4AF37] mb-1.5 truncate pr-6">
                        {field.label}
                      </label>
                      <div className="flex items-baseline gap-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-full bg-transparent border-none outline-none text-xl sm:text-2xl font-bold text-gray-900 dark:text-white p-0 placeholder-[#D4AF37]/30"
                          placeholder="0"
                          value={measureValues[field.id] || ""}
                          onChange={(e) =>
                            handleMeasureChange(field.id, e.target.value)
                          }
                        />
                        <span className="text-xs text-[#D4AF37]/70 font-medium">
                          cm
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AJOUT DE MESURE PERSONNALISÉE */}
            <div className="flex items-center gap-3 pt-5 border-t border-gray-100 dark:border-gray-800 mt-auto relative z-10">
              <div className="relative flex-1">
                <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Ajouter une mesure spécifique (ex: Biceps)"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-[#D4AF37]/50 outline-none dark:text-white transition-all placeholder:text-gray-400"
                  value={newCustomLabel}
                  onChange={(e) => setNewCustomLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomField();
                    }
                  }}
                />
              </div>
              <button
                type="button"
                onClick={addCustomField}
                disabled={!newCustomLabel.trim()}
                className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-5 py-3.5 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50 shadow-sm"
              >
                Ajouter
              </button>
            </div>
          </div>

          {/* BOUTON DE SOUMISSION */}
          <div className="mt-8 flex justify-end pb-8 lg:pb-0">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-10 py-4 bg-[#D4AF37] hover:bg-[#b5952f] text-black font-bold text-base rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-3 shadow-[0_4px_14px_0_rgba(212,175,55,0.39)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.23)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Save size={20} /> Enregistrer le Profil
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
