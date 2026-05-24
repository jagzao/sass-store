"use client";

import { useState, useRef, useCallback } from "react";
import {
  Camera,
  FileText,
  ImagePlus,
  Sparkles,
  X,
  ChevronRight,
  Package,
  Scissors,
  CheckCircle2,
  ArrowRight,
  Plus,
  Edit3,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ItemType = "product" | "service";
type InputMode = "photo" | "text" | "both";
type Step = "type-price" | "capture" | "generating" | "review" | "success";

interface AiResult {
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  suggestedSku: string;
  fallback?: boolean;
}

interface SavedItem {
  id: string;
  name: string;
  type: ItemType;
}

interface Props {
  tenantSlug: string;
  onSuccess?: (item: SavedItem) => void;
  onClose: () => void;
}

// ─── Generating messages ──────────────────────────────────────────────────────

const GENERATING_MESSAGES = [
  "Analizando tu trabajo con IA...",
  "Creando la descripción perfecta...",
  "Pensando en cómo presentarlo mejor...",
  "Escribiendo un copy que vende...",
  "Casi listo...",
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function SmartPublishWizard({ tenantSlug, onSuccess, onClose }: Props) {
  // Wizard state
  const [step, setStep] = useState<Step>("type-price");

  // Step 1
  const [itemType, setItemType] = useState<ItemType>("product");
  const [price, setPrice] = useState("");

  // Step 2
  const [inputMode, setInputMode] = useState<InputMode>("both");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textDescription, setTextDescription] = useState("");

  // Step 3 / 4
  const [generatingMsgIdx, setGeneratingMsgIdx] = useState(0);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Step 4 — editable fields
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSku, setEditSku] = useState("");

  // Step 5
  const [savedItem, setSavedItem] = useState<SavedItem | null>(null);

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    },
    [],
  );

  const clearImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const canProceedStep1 = itemType && price && parseFloat(price) > 0;

  const canProceedStep2 = (() => {
    if (inputMode === "photo") return !!imageFile;
    if (inputMode === "text") return textDescription.trim().length > 5;
    return !!imageFile || textDescription.trim().length > 5;
  })();

  const startGenerating = useCallback(async () => {
    setStep("generating");
    setGeneratingMsgIdx(0);

    // Rotate messages
    msgIntervalRef.current = setInterval(() => {
      setGeneratingMsgIdx((i) => (i + 1) % GENERATING_MESSAGES.length);
    }, 2500);

    try {
      const fd = new FormData();
      fd.append("type", itemType);
      fd.append("price", price);
      if (textDescription.trim())
        fd.append("textDescription", textDescription.trim());
      if (imageFile) fd.append("image", imageFile);

      const res = await fetch("/api/smart-publish/generate", {
        method: "POST",
        body: fd,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Error al generar");
      }

      const ai: AiResult = json.ai;
      setAiResult(ai);
      setUploadedImageUrl(json.imageUrl || null);

      // Pre-fill editable fields
      setEditName(ai.name);
      setEditDescription(ai.description);
      setEditCategory(ai.category);
      setEditSku(ai.suggestedSku);

      if (ai.fallback) {
        toast.warning(
          "No se pudo conectar con la IA. Revisa y edita el contenido manualmente.",
        );
      }

      setStep("review");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Error: ${msg}`);
      setStep("capture");
    } finally {
      if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
    }
  }, [itemType, price, textDescription, imageFile]);

  const handleSave = useCallback(async () => {
    if (!editName.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setSaving(true);
    try {
      const body = {
        tenant: tenantSlug,
        type: itemType,
        name: editName.trim(),
        description: editDescription.trim(),
        category: editCategory.trim() || "General",
        price: parseFloat(price),
        imageUrl: uploadedImageUrl,
        sku: editSku.trim() || undefined,
        shortDescription: aiResult?.shortDescription || "",
        ...(itemType === "service" && { duration: 1 }),
      };

      const res = await fetch("/api/smart-publish/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Error al guardar");
      }

      const created: SavedItem = {
        id: json.data.id,
        name: json.data.name,
        type: itemType,
      };

      setSavedItem(created);
      onSuccess?.(created);
      setStep("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(`Error al guardar: ${msg}`);
    } finally {
      setSaving(false);
    }
  }, [
    tenantSlug,
    itemType,
    editName,
    editDescription,
    editCategory,
    editSku,
    price,
    uploadedImageUrl,
    aiResult,
    onSuccess,
  ]);

  const handleAddAnother = useCallback(() => {
    setStep("type-price");
    setItemType("product");
    setPrice("");
    setInputMode("both");
    setImageFile(null);
    setImagePreview(null);
    setTextDescription("");
    setAiResult(null);
    setUploadedImageUrl(null);
    setEditName("");
    setEditDescription("");
    setEditCategory("");
    setEditSku("");
    setSavedItem(null);
  }, []);

  const viewItemUrl =
    savedItem &&
    (savedItem.type === "product"
      ? `/t/${tenantSlug}/admin/products`
      : `/t/${tenantSlug}/admin/services`);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div
        data-testid="smart-publish-wizard"
        className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto"
      >
        {/* Close button */}
        {step !== "generating" && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        )}

        {/* ── STEP 1: Type + Price ── */}
        {step === "type-price" && (
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={20} className="text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                  Publicar con IA
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                ¿Qué vas a publicar?
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                La IA generará el nombre y descripción por ti
              </p>
            </div>

            {/* Type selector */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setItemType("product")}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                  itemType === "product"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Package size={32} strokeWidth={1.5} />
                <span className="font-semibold text-base">Producto</span>
                <span className="text-xs text-center opacity-70">
                  Artículo físico o digital
                </span>
              </button>
              <button
                onClick={() => setItemType("service")}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                  itemType === "service"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Scissors size={32} strokeWidth={1.5} />
                <span className="font-semibold text-base">Servicio</span>
                <span className="text-xs text-center opacity-70">
                  Tratamiento, consulta, etc.
                </span>
              </button>
            </div>

            {/* Price */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Precio (MXN)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-8 pr-4 py-4 text-xl font-semibold border-2 border-gray-200 rounded-2xl focus:border-indigo-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              onClick={() => setStep("capture")}
              disabled={!canProceedStep1}
              className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              Continuar <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* ── STEP 2: Capture ── */}
        {step === "capture" && (
          <div className="p-6 sm:p-8">
            <button
              onClick={() => setStep("type-price")}
              className="text-gray-400 hover:text-gray-600 text-sm mb-4 flex items-center gap-1 transition-colors"
            >
              ← Atrás
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Cuéntanos sobre tu{" "}
                {itemType === "product" ? "producto" : "servicio"}
              </h2>
              <p className="text-gray-500 text-sm">
                Añade una foto, describe con tus palabras, o ambas. La IA hará
                el resto.
              </p>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-2 mb-5 bg-gray-100 p-1 rounded-xl">
              {(
                [
                  { mode: "photo" as InputMode, icon: Camera, label: "Foto" },
                  {
                    mode: "text" as InputMode,
                    icon: FileText,
                    label: "Texto",
                  },
                  {
                    mode: "both" as InputMode,
                    icon: ImagePlus,
                    label: "Ambos",
                  },
                ] as const
              ).map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setInputMode(mode)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    inputMode === mode
                      ? "bg-white shadow text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            {/* Photo area */}
            {(inputMode === "photo" || inputMode === "both") && (
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                {imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden bg-gray-100">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 px-3 py-1.5 bg-white/90 rounded-full shadow text-xs font-semibold text-gray-700 hover:bg-white transition-colors"
                    >
                      Cambiar foto
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-36 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-indigo-400 hover:text-indigo-400 transition-colors"
                  >
                    <Camera size={32} strokeWidth={1.5} />
                    <span className="text-sm font-medium">
                      Tomar foto o seleccionar
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Text area */}
            {(inputMode === "text" || inputMode === "both") && (
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción con tus palabras
                </label>
                <textarea
                  value={textDescription}
                  onChange={(e) => setTextDescription(e.target.value)}
                  placeholder={
                    itemType === "product"
                      ? "Ej: Es una bolsa tejida a mano, de lana merino, colores azul y blanco, sirve para el diario..."
                      : "Ej: Es un tratamiento facial de 1 hora con limpieza profunda, hidratación y mascarilla de vitamina C..."
                  }
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-indigo-400 focus:outline-none transition-colors resize-none text-sm leading-relaxed"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Cuanto más detallado, mejor resultado de la IA
                </p>
              </div>
            )}

            <button
              onClick={startGenerating}
              disabled={!canProceedStep2}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              <Sparkles size={20} />
              Generar con IA
            </button>
          </div>
        )}

        {/* ── STEP 3: Generating ── */}
        {step === "generating" && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[340px] text-center">
            {/* Pulsing orb */}
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center animate-pulse">
                <Sparkles size={40} className="text-white" />
              </div>
              <div className="absolute inset-0 rounded-full bg-indigo-400/30 animate-ping" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              IA trabajando...
            </h2>
            <p className="text-gray-500 text-base min-h-[24px] transition-all">
              {GENERATING_MESSAGES[generatingMsgIdx]}
            </p>

            <div className="mt-8 flex gap-1.5">
              {GENERATING_MESSAGES.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === generatingMsgIdx
                      ? "w-6 bg-indigo-500"
                      : "w-1.5 bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 4: Review ── */}
        {step === "review" && aiResult && (
          <div className="p-6 sm:p-8">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wide">
                  IA generó esto para ti
                </span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Revisa y edita si quieres
              </h2>
              {aiResult.fallback && (
                <div className="mt-2 flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl px-3 py-2 text-sm">
                  <AlertCircle size={15} />
                  <span>IA no disponible — edita el contenido manualmente</span>
                </div>
              )}
            </div>

            {/* Image preview */}
            {uploadedImageUrl && (
              <div className="mb-4 rounded-xl overflow-hidden">
                <img
                  src={uploadedImageUrl}
                  alt="Imagen del producto"
                  className="w-full h-36 object-cover"
                />
              </div>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Nombre
                </label>
                <div className="relative">
                  <input
                    data-testid="wizard-name-input"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={200}
                    className="w-full px-4 py-3 pr-9 border border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none font-semibold text-gray-900 transition-colors"
                  />
                  <Edit3
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Descripción
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none text-sm leading-relaxed text-gray-700 resize-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none text-sm transition-colors"
                  />
                </div>

                {/* SKU (products only) */}
                {itemType === "product" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Código (SKU)
                    </label>
                    <input
                      type="text"
                      value={editSku}
                      onChange={(e) => setEditSku(e.target.value.toUpperCase())}
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:border-indigo-400 focus:outline-none text-sm font-mono transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Price display */}
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">Precio</span>
                <span className="font-bold text-gray-900 text-lg">
                  ${parseFloat(price).toFixed(2)} MXN
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep("capture")}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 transition-colors"
              >
                Cambiar info
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editName.trim()}
                className="flex-[2] py-3 rounded-xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Publicar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Success ── */}
        {step === "success" && savedItem && (
          <div className="p-8 flex flex-col items-center text-center">
            {/* Success animation */}
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle2
                size={52}
                className="text-green-500"
                strokeWidth={1.5}
              />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Publicado con éxito!
            </h2>
            <p className="text-gray-500 text-base mb-2">
              <span className="font-semibold text-gray-700">
                &ldquo;{savedItem.name}&rdquo;
              </span>{" "}
              ya está en tu catálogo
            </p>
            <p className="text-sm text-gray-400 mb-8">
              ¿Qué quieres hacer ahora?
            </p>

            <div className="w-full flex flex-col gap-3">
              {viewItemUrl && (
                <a
                  href={viewItemUrl}
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                  Ver {savedItem.type === "product" ? "producto" : "servicio"}{" "}
                  creado
                  <ArrowRight size={18} />
                </a>
              )}
              <button
                onClick={handleAddAnother}
                className="w-full py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold text-base flex items-center justify-center gap-2 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                <Plus size={18} />
                Agregar otro
              </button>
            </div>
          </div>
        )}

        {/* Step indicator (dots) */}
        {step !== "generating" && step !== "success" && (
          <div className="flex justify-center gap-2 pb-6">
            {(["type-price", "capture", "review"] as Step[]).map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? "w-6 bg-indigo-500" : "w-1.5 bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
