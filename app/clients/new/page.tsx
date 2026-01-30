"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
// On importe nos modèles de mesures
import { MEASUREMENT_TEMPLATES } from "../../constants/measurements";
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
} from "lucide-react";

export default function NewClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
  // Stocke les valeurs : { "epaule": "45", "taille": "80" }
  const [measureValues, setMeasureValues] = useState<Record<string, string>>(
    {},
  );
  // Stocke les champs personnalisés ajoutés manuellement : [{ id: 'custom_1', label: 'Tour de cheville' }]
  const [customFields, setCustomFields] = useState<
    { id: string; label: string }[]
  >([]);
  // État pour le petit champ d'ajout
  const [newCustomLabel, setNewCustomLabel] = useState("");

  // 1. SÉCURITÉ
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) router.push("/login");
    };
    checkUser();
  }, [router]);

  // 2. LOGIQUE MESURES
  // Quand on change de modèle (Femme -> Homme -> Afrique...)
  const currentTemplate =
    MEASUREMENT_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
    MEASUREMENT_TEMPLATES[0];

  const handleMeasureChange = (id: string, value: string) => {
    setMeasureValues((prev) => ({ ...prev, [id]: value }));
  };

  const addCustomField = () => {
    if (!newCustomLabel.trim()) return;
    const newId = `custom_${Date.now()}`; // ID unique
    setCustomFields([...customFields, { id: newId, label: newCustomLabel }]);
    setNewCustomLabel(""); // Reset champ
  };

  const removeCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
    // On nettoie aussi la valeur stockée
    const newValues = { ...measureValues };
    delete newValues[id];
    setMeasureValues(newValues);
  };

  // 3. ENVOI DU FORMULAIRE
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }

    // On prépare le JSON des mesures
    // On inclut l'ID du template pour savoir quel modèle a été utilisé
    const measurementsJSON = {
      _template_id: selectedTemplateId,
      _template_name: currentTemplate.label,
      ...measureValues,
    };

    const { error } = await supabase.from("clients").insert([
      {
        full_name: formData.full_name,
        phone: formData.phone,
        city: formData.city || "Non renseigné",
        notes: formData.notes,
        measurements: measurementsJSON, // Le cœur de la V2
        user_id: session.user.id,
      },
    ]);

    if (error) {
      alert("Erreur : " + error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 p-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        {/* --- HEADER --- */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/dashboard"
            className="p-2 bg-white dark:bg-neutral-900 rounded-full border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white transition shadow-sm"
            aria-label="Retour au tableau de bord"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Nouveau Client
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* COLONNE GAUCHE : IDENTITÉ (1/3) */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <User size={16} /> Identité
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
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
                    type="text"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
                    placeholder="Ex: +221 77..."
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
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
                    placeholder="Ex: Dakar"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4 flex items-center gap-2">
                <FileText size={16} /> Notes
              </h2>
              <textarea
                rows={4}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none resize-none dark:text-white"
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
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                  <Ruler size={16} /> Prise de Mesures
                </h2>

                {/* SÉLECTEUR DE GABARIT (Avec correction accessibilité) */}
                <div className="relative">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    aria-label="Sélectionner un modèle de mesures"
                    className="appearance-none bg-black dark:bg-white text-white dark:text-black font-bold pl-10 pr-8 py-2 rounded-lg text-sm cursor-pointer hover:opacity-90 transition"
                  >
                    {MEASUREMENT_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                  <Shirt className="absolute left-3 top-1/2 -translate-y-1/2 text-white dark:text-black w-4 h-4 pointer-events-none" />
                </div>
              </div>

              {/* GRILLE DES MESURES (Champs du Template) */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {currentTemplate.fields.map((field) => (
                  <div
                    key={field.id}
                    className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800"
                  >
                    <label
                      className="block text-xs text-gray-500 dark:text-gray-400 mb-1 truncate"
                      title={field.label}
                    >
                      {field.label}
                    </label>
                    <div className="flex items-end gap-1">
                      <input
                        type="number"
                        className="w-full bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white outline-none text-lg font-bold text-gray-900 dark:text-white p-0"
                        placeholder="0"
                        value={measureValues[field.id] || ""}
                        onChange={(e) =>
                          handleMeasureChange(field.id, e.target.value)
                        }
                      />
                      <span className="text-xs text-gray-400 mb-1">cm</span>
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
                        {/* Bouton de suppression avec correction accessibilité */}
                        <button
                          type="button"
                          onClick={() => removeCustomField(field.id)}
                          aria-label={`Supprimer la mesure ${field.label}`}
                          className="absolute top-1 right-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                        <label className="block text-xs text-yellow-700 dark:text-yellow-500 mb-1 truncate">
                          {field.label}
                        </label>
                        <div className="flex items-end gap-1">
                          <input
                            type="number"
                            className="w-full bg-transparent border-b border-yellow-300 dark:border-yellow-700 focus:border-yellow-600 outline-none text-lg font-bold text-gray-900 dark:text-white p-0"
                            placeholder="0"
                            value={measureValues[field.id] || ""}
                            onChange={(e) =>
                              handleMeasureChange(field.id, e.target.value)
                            }
                          />
                          <span className="text-xs text-yellow-600">cm</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AJOUTER UNE MESURE */}
              <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="relative flex-1">
                  <Plus className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Ajouter une mesure (ex: Tour de biceps)"
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-black dark:focus:ring-white outline-none dark:text-white"
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
                  className="bg-gray-100 dark:bg-gray-800 text-black dark:text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* BOUTON SAVE */}
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-bold text-lg rounded-full hover:scale-105 transition-transform flex items-center justify-center gap-2 shadow-xl shadow-gray-200 dark:shadow-none"
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
