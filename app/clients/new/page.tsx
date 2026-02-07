"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
// On importe nos modèles de mesures
import { MEASUREMENT_TEMPLATES } from "../../constants/measurements";
// On importe la vérification des quotas
import { canAddClient } from "@/lib/check-limits";
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
  Lock,
} from "lucide-react";

export default function NewClient() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [quotaError, setQuotaError] = useState<string | null>(null);
  const [canAdd, setCanAdd] = useState(true); // Nouvel état pour bloquer l'interface

  // --- ÉTATS ---
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    city: "",
    notes: "",
  });

  // Gestion des Mesures
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

  // 1. SÉCURITÉ & VÉRIFICATION DES QUOTAS AU CHARGEMENT
  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 🛑 VÉRIFICATION SÉCURISÉE
      // On vérifie si l'utilisateur a le droit d'ajouter un client
      const allowed = await canAddClient();
      setCanAdd(allowed);

      if (!allowed) {
        setQuotaError(
          "⚠️ Vous avez atteint la limite de clients pour votre plan actuel.",
        );
      }
    };
    checkAccess();
  }, [router, supabase]);

  // 2. LOGIQUE MESURES
  const currentTemplate =
    MEASUREMENT_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
    MEASUREMENT_TEMPLATES[0];

  const handleMeasureChange = (id: string, value: string) => {
    setMeasureValues((prev) => ({ ...prev, [id]: value }));
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

  // 3. ENVOI DU FORMULAIRE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setQuotaError(null);

    // Double vérification au moment de l'envoi (pour éviter les malins qui inspectent le code)
    const allowed = await canAddClient();
    if (!allowed) {
      setQuotaError(
        "⛔ Limite atteinte. Veuillez mettre à jour votre abonnement.",
      );
      setCanAdd(false);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    // Préparation du JSON des mesures
    const measurementsJSON = {
      _template_id: selectedTemplateId,
      _template_name: currentTemplate.label,
      ...measureValues,
    };

    // On insère
    const { error } = await supabase.from("clients").insert([
      {
        full_name: formData.full_name,
        phone: formData.phone,
        city: formData.city || "Non renseigné",
        notes: formData.notes,
        measurements: measurementsJSON,
        user_id: user.id,
      },
    ]);

    if (error) {
      // Gestion intelligente des erreurs
      if (error.code === "23505") {
        setQuotaError("Ce client existe déjà.");
      } else if (error.message.includes("policy")) {
        setQuotaError("⚠️ Erreur de permissions (RLS).");
      } else {
        setQuotaError("Erreur : " + error.message);
      }
      setLoading(false);
    } else {
      router.push("/clients");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4 md:p-6 transition-colors duration-300 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* --- HEADER --- */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/clients"
            className="p-2 bg-white dark:bg-neutral-900 rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white transition shadow-sm"
            aria-label="Retour à la liste"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nouveau Client
          </h1>
        </div>

        {/* --- BANNIÈRE BLOQUANTE SI QUOTA ATTEINT --- */}
        {!canAdd && (
          <div className="mb-6 p-6 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl flex flex-col md:flex-row items-center gap-4 text-center md:text-left shadow-sm">
            <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-full text-red-600 dark:text-red-400">
              <Lock size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Limite atteinte
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                Vous avez atteint le nombre maximum de clients pour votre plan
                gratuit. Passez à la version Pro pour un accès illimité.
              </p>
            </div>
            <Link
              href="/pricing"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-200 dark:shadow-none whitespace-nowrap"
            >
              Voir les offres
            </Link>
          </div>
        )}

        {/* --- MESSAGE D'ERREUR --- */}
        {quotaError && canAdd && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in slide-in-from-top-2">
            <AlertCircle size={24} className="flex-shrink-0" />
            <div>
              <p className="font-bold">Attention</p>
              <p className="text-sm">{quotaError}</p>
            </div>
          </div>
        )}

        {/* ON BLOQUE LE FORMULAIRE VISUELLEMENT SI QUOTA ATTEINT */}
        <form
          onSubmit={handleSubmit}
          className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity ${!canAdd ? "opacity-50 pointer-events-none filter grayscale" : ""}`}
        >
          {/* ... (LE RESTE DU FORMULAIRE EST IDENTIQUE À AVANT) ... */}
          {/* COLONNE GAUCHE : IDENTITÉ (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <User size={14} /> Identité
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white text-base"
                    placeholder="Ex: Fatou Diop"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white text-base"
                    placeholder="Ex: 77 123 45 67"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white text-base"
                    placeholder="Ex: Dakar"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <FileText size={14} /> Notes
              </h2>
              <textarea
                rows={4}
                className="w-full px-3 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none resize-none dark:text-white text-sm"
                placeholder="Allergies, préférences tissu, etc."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>

          {/* COLONNE DROITE : MESURES INTELLIGENTES (2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                  <Ruler size={14} /> Prise de Mesures
                </h2>

                {/* SÉLECTEUR DE GABARIT */}
                <div className="relative w-full sm:w-auto">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    aria-label="Sélectionner un modèle"
                    className="w-full sm:w-auto appearance-none bg-black dark:bg-white text-white dark:text-black font-bold pl-10 pr-10 py-3 rounded-xl text-sm cursor-pointer hover:opacity-90 transition shadow-md"
                  >
                    {MEASUREMENT_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <Shirt className="absolute left-3 top-1/2 -translate-y-1/2 text-white dark:text-black w-4 h-4 pointer-events-none" />
                </div>
              </div>

              {/* GRILLE DES MESURES */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {currentTemplate.fields.map((field) => (
                  <div
                    key={field.id}
                    className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white transition-all"
                  >
                    <label
                      className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1 truncate"
                      title={field.label}
                    >
                      {field.label}
                    </label>
                    <div className="flex items-end gap-1">
                      <input
                        type="number"
                        inputMode="decimal" // Clavier numérique mobile
                        className="w-full bg-transparent border-none outline-none text-xl font-bold text-gray-900 dark:text-white p-0 placeholder-gray-300"
                        placeholder="0"
                        value={measureValues[field.id] || ""}
                        onChange={(e) =>
                          handleMeasureChange(field.id, e.target.value)
                        }
                      />
                      <span className="text-xs text-gray-400 mb-1 font-medium">
                        cm
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* CHAMPS PERSONNALISÉS */}
              {customFields.length > 0 && (
                <div className="mb-6 animate-in fade-in">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">
                    Mesures Spécifiques
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {customFields.map((field) => (
                      <div
                        key={field.id}
                        className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/30 relative group"
                      >
                        <button
                          type="button"
                          onClick={() => removeCustomField(field.id)}
                          aria-label={`Supprimer ${field.label}`}
                          className="absolute top-1 right-1 text-red-400 hover:text-red-600 md:opacity-0 md:group-hover:opacity-100 transition p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                        <label className="block text-[10px] uppercase font-bold text-yellow-700 dark:text-yellow-500 mb-1 truncate">
                          {field.label}
                        </label>
                        <div className="flex items-end gap-1">
                          <input
                            type="number"
                            inputMode="decimal"
                            className="w-full bg-transparent border-none outline-none text-xl font-bold text-gray-900 dark:text-white p-0 placeholder-yellow-300"
                            placeholder="0"
                            value={measureValues[field.id] || ""}
                            onChange={(e) =>
                              handleMeasureChange(field.id, e.target.value)
                            }
                          />
                          <span className="text-xs text-yellow-600 mb-1">
                            cm
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AJOUTER UNE MESURE */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
                <div className="relative flex-1">
                  <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Ajouter (ex: Tour de biceps)"
                    className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white transition-all"
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
                  className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* BOUTON SAVE */}
            <div className="mt-6 flex justify-end pb-8 lg:pb-0">
              <button
                type="submit"
                disabled={loading || !canAdd} // 🔒 DÉSACTIVÉ SI QUOTA ATTEINT
                className="w-full md:w-auto px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-gray-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Save size={20} /> Enregistrer le Client
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
