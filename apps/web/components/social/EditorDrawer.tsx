"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import MediaUploader from "./MediaUploader";

interface Platform {
  id: string;
  name: string;
  emoji: string;
  color: string;
  maxLength: number;
}

const PLATFORMS: Platform[] = [
  {
    id: "facebook",
    name: "Facebook",
    emoji: "📘",
    color: "bg-blue-600",
    maxLength: 63206,
  },
  {
    id: "instagram",
    name: "Instagram",
    emoji: "📷",
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    maxLength: 2200,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    emoji: "💼",
    color: "bg-blue-700",
    maxLength: 3000,
  },
  {
    id: "x",
    name: "X (Twitter)",
    emoji: "🐦",
    color: "bg-black",
    maxLength: 280,
  },
  {
    id: "tiktok",
    name: "TikTok",
    emoji: "🎵",
    color: "bg-black",
    maxLength: 2200,
  },
  {
    id: "gbp",
    name: "Google Business",
    emoji: "🏢",
    color: "bg-green-600",
    maxLength: 1500,
  },
  {
    id: "threads",
    name: "Threads",
    emoji: "🧵",
    color: "bg-gray-900",
    maxLength: 500,
  },
];

interface PostVariant {
  platform: string;
  content: string;
  mediaUrl?: string;
}

export interface InitialData {
  title?: string;
  baseContent?: string;
  variants?: PostVariant[];
  scheduledDate?: string; // Format: yyyy-MM-dd
  mediaUrls?: string[];
  mediaIds?: string[];
}

interface EditorDrawerProps {
  tenant: string;
  isOpen: boolean;
  onClose: () => void;
  postId?: string | null;
  initialData?: InitialData;
  variant?: "default" | "tech";
}

export default function EditorDrawer({
  tenant,
  isOpen,
  onClose,
  postId,
  initialData,
  variant = "default",
}: EditorDrawerProps) {
  const [title, setTitle] = useState("");
  const [baseContent, setBaseContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "facebook",
  ]);
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [scheduledDate, setScheduledDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [status, setStatus] = useState<"draft" | "ready">("draft");
  const [isScheduled, setIsScheduled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaIds, setMediaIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchPostDetails = async () => {
      if (postId && !initialData?.baseContent) {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/v1/social/queue?tenant=${tenant}&id=${postId}`,
          );
          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.length > 0) {
              const post = data.data[0];
              setTitle(post.title || "");
              setBaseContent(post.content || "");
              setStatus(post.status);

              if (post.scheduledAt) {
                const date = new Date(post.scheduledAt);
                setScheduledDate(format(date, "yyyy-MM-dd"));
                setScheduledTime(format(date, "HH:mm"));
                setIsScheduled(true);
              }

              if (post.targets) {
                const loadedVariants: Record<string, string> = {};
                post.targets.forEach((target: any) => {
                  loadedVariants[target.platform] = target.variantText;
                });
                setVariants(loadedVariants);
                setSelectedPlatforms(post.platforms || []);
              }

              if (post.metadata?.mediaUrls) {
                setMediaUrls(post.metadata.mediaUrls);
              }

              if (post.mediaIds) {
                setMediaIds(post.mediaIds);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching post details:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchPostDetails();
  }, [postId, tenant, initialData]);

  useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.baseContent) setBaseContent(initialData.baseContent);

      if (initialData.variants) {
        const initialVariants: Record<string, string> = {};
        initialData.variants.forEach((variant) => {
          initialVariants[variant.platform] = variant.content;
        });
        setVariants(initialVariants);
      }

      if (initialData.scheduledDate) {
        setScheduledDate(initialData.scheduledDate);
        setIsScheduled(true);
      }

      if (initialData.mediaUrls) {
        setMediaUrls(initialData.mediaUrls);
      }

      if (initialData.mediaIds) {
        setMediaIds(initialData.mediaIds);
      }
    }
  }, [initialData]);

  const handleMediaChange = (urls: string[], ids: string[]) => {
    setMediaUrls(urls);
    setMediaIds(ids);
  };

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId],
    );
  };

  const handleVariantChange = (platformId: string, content: string) => {
    setVariants((prev) => ({
      ...prev,
      [platformId]: content,
    }));
  };

  const getCharacterCount = (platformId: string) => {
    const text = variants[platformId] || baseContent;
    const platform = PLATFORMS.find((p) => p.id === platformId);
    return {
      current: text.length,
      max: platform?.maxLength || 0,
    };
  };

  const handleGenerateWithAI = async () => {
    // Placeholder para generación con IA
    setIsLoading(true);
    try {
      // Simular llamada a API de IA
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Contenido generado de ejemplo
      const generatedContent = `¡Descubre nuestros últimos servicios! ✨ 
Calidad profesional con un toque personal. 
Agenda tu cita hoy. #WonderNails #Belleza`;

      setBaseContent(generatedContent);

      // Actualizar variantes para las plataformas seleccionadas
      const updatedVariants = { ...variants };
      selectedPlatforms.forEach((platform) => {
        if (!updatedVariants[platform]) {
          updatedVariants[platform] = generatedContent;
        }
      });
      setVariants(updatedVariants);
    } catch (error) {
      console.error("Error generating content with AI:", error);
      alert("Error al generar contenido con IA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const scheduledAtUtc = isScheduled
        ? new Date(`${scheduledDate}T${scheduledTime}`)
        : null;

      const postData = {
        id: postId || undefined,
        tenant,
        title,
        baseText: baseContent,
        status,
        scheduledAtUtc,
        mediaIds,
        metadata: {
          mediaUrls,
        },
        platforms: selectedPlatforms.map((platform) => ({
          platform,
          variantText: variants[platform] || baseContent,
          status,
          assetIds: mediaIds,
        })),
      };

      const response = await fetch(`/api/v1/social/queue?tenant=${tenant}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save post");
      }

      // Success - close drawer
      alert("✅ Post saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving post:", error);
      alert(
        `Error al guardar el post: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isTech = variant === "tech";

  // Estilos base según variante
  const styles = {
    bg: isTech ? "bg-[#111111]" : "bg-white",
    text: isTech ? "text-gray-200" : "text-gray-900",
    textSecondary: isTech ? "text-gray-400" : "text-gray-500",
    border: isTech ? "border-gray-800" : "border-gray-200",
    inputBg: isTech ? "bg-[#1a1a1a]" : "bg-white",
    inputBorder: isTech ? "border-gray-700" : "border-gray-300",
    activeItemBg: isTech ? "bg-[#FF8000]/10" : "bg-blue-50",
    activeItemBorder: isTech ? "border-[#FF8000]" : "border-blue-500",
    hoverBg: isTech ? "hover:bg-gray-800" : "hover:bg-gray-50",
    primaryButton: isTech
      ? "bg-[#FF8000] hover:bg-[#FF8000]/90 text-black"
      : "bg-blue-600 hover:bg-blue-700 text-white",
    secondaryButton: isTech
      ? "bg-gray-800 text-gray-200 hover:bg-gray-700 border-gray-700"
      : "bg-gray-200 text-gray-800 hover:bg-gray-300 border-gray-300",
    accentText: isTech ? "text-[#FF8000]" : "text-blue-600",
    headerBorder: isTech
      ? "border-b border-gray-800"
      : "border-b border-gray-200",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <div className="relative w-screen max-w-2xl">
          <div className={`h-full flex flex-col shadow-xl ${styles.bg}`}>
            {/* Header */}
            <div className={`px-6 py-4 ${styles.headerBorder}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-medium ${styles.text}`}>
                  {postId ? "Editar Publicación" : "Nueva Publicación"}
                </h2>
                <button
                  onClick={onClose}
                  className={`rounded-md ${styles.textSecondary} hover:${styles.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 space-y-6">
                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className={`block text-sm font-medium ${styles.textSecondary} mb-2`}
                  >
                    Título interno
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${styles.inputBg} ${styles.inputBorder} ${styles.text}`}
                    placeholder="Título para organización interna..."
                    maxLength={200}
                  />
                  <p className={`text-xs ${styles.textSecondary} mt-1`}>
                    {title.length}/200 caracteres
                  </p>
                </div>

                {/* Base Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="content"
                      className={`block text-sm font-medium ${styles.textSecondary}`}
                    >
                      Contenido base
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateWithAI}
                      disabled={isLoading}
                      className={`text-sm ${styles.accentText} disabled:opacity-50`}
                    >
                      {isLoading ? "Generando..." : "Generar con IA ✨"}
                    </button>
                  </div>
                  <textarea
                    id="content"
                    value={baseContent}
                    onChange={(e) => setBaseContent(e.target.value)}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${styles.inputBg} ${styles.inputBorder} ${styles.text}`}
                    placeholder="Escribe el contenido base..."
                    required
                  />
                  <p className={`text-xs ${styles.textSecondary} mt-1`}>
                    {baseContent.length}/2000 caracteres
                  </p>
                </div>

                {/* Media */}
                <div>
                  <label
                    className={`block text-sm font-medium ${styles.textSecondary} mb-2`}
                  >
                    Media (imágenes o video)
                  </label>
                  <MediaUploader
                    tenant={tenant}
                    mediaUrls={mediaUrls}
                    mediaIds={mediaIds}
                    onMediaChange={handleMediaChange}
                    maxFiles={10}
                    variant={variant}
                    disabled={isLoading}
                  />
                  <p className={`text-xs ${styles.textSecondary} mt-2`}>
                    Añade hasta 10 archivos para caruseles. Se publicará el
                    orden seleccionado.
                  </p>
                </div>

                {/* Scheduling */}
                <div
                  className={`border rounded-lg p-4 ${styles.border} ${isTech ? "bg-white/5" : "bg-gray-50"}`}
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <label className={`flex items-center ${styles.text}`}>
                      <input
                        type="radio"
                        name="schedule-type"
                        checked={!isScheduled}
                        onChange={() => setIsScheduled(false)}
                        className="mr-2"
                      />
                      Borrador
                    </label>
                    <label className={`flex items-center ${styles.text}`}>
                      <input
                        type="radio"
                        name="schedule-type"
                        checked={isScheduled}
                        onChange={() => setIsScheduled(true)}
                        className="mr-2"
                      />
                      Programar
                    </label>
                  </div>

                  {isScheduled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="date"
                          className={`block text-sm font-medium ${styles.textSecondary} mb-2`}
                        >
                          Fecha
                        </label>
                        <input
                          type="date"
                          id="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={format(new Date(), "yyyy-MM-dd")}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${styles.inputBg} ${styles.inputBorder} ${styles.text}`}
                          required={isScheduled}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="time"
                          className={`block text-sm font-medium ${styles.textSecondary} mb-2`}
                        >
                          Hora
                        </label>
                        <input
                          type="time"
                          id="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${styles.inputBg} ${styles.inputBorder} ${styles.text}`}
                          required={isScheduled}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Platform Selection */}
                <div>
                  <label
                    className={`block text-sm font-medium ${styles.textSecondary} mb-3`}
                  >
                    Plataformas
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {PLATFORMS.map((platform) => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => handlePlatformToggle(platform.id)}
                        className={`relative p-3 rounded-lg border-2 transition-all ${
                          selectedPlatforms.includes(platform.id)
                            ? `${styles.activeItemBorder} ${styles.activeItemBg}`
                            : `${styles.border} ${styles.hoverBg} ${styles.textSecondary}`
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{platform.emoji}</div>
                          <div
                            className={`text-sm font-medium ${selectedPlatforms.includes(platform.id) ? styles.text : ""}`}
                          >
                            {platform.name}
                          </div>
                        </div>
                        {selectedPlatforms.includes(platform.id) && (
                          <div
                            className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center ${isTech ? "bg-[#FF8000]" : "bg-blue-500"}`}
                          >
                            <svg
                              className={`w-2 h-2 ${isTech ? "text-black" : "text-white"}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform-specific variants */}
                {selectedPlatforms.length > 0 && (
                  <div className="space-y-4">
                    <h3 className={`text-lg font-medium ${styles.text}`}>
                      Personalización por Plataforma
                    </h3>
                    {selectedPlatforms.map((platformId) => {
                      const platform = PLATFORMS.find(
                        (p) => p.id === platformId,
                      )!;
                      const charCount = getCharacterCount(platformId);
                      const isOverLimit = charCount.current > charCount.max;

                      return (
                        <div
                          key={platformId}
                          className={`border rounded-lg p-4 ${styles.border}`}
                        >
                          <div className="flex items-center mb-3">
                            <span className="text-lg mr-2">
                              {platform.emoji}
                            </span>
                            <span className={`font-medium ${styles.text}`}>
                              {platform.name}
                            </span>
                            <span
                              className={`ml-auto text-sm ${isOverLimit ? "text-red-500" : styles.textSecondary}`}
                            >
                              {charCount.current}/{charCount.max}
                            </span>
                          </div>
                          <textarea
                            value={variants[platformId] || baseContent}
                            onChange={(e) =>
                              handleVariantChange(platformId, e.target.value)
                            }
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${styles.inputBg} ${styles.text} ${
                              isOverLimit
                                ? "border-red-300"
                                : styles.inputBorder
                            }`}
                            placeholder={`Personaliza el contenido para ${platform.name}...`}
                          />
                          {isOverLimit && (
                            <p className="text-red-500 text-sm mt-1">
                              Excede el límite de caracteres para{" "}
                              {platform.name}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Status */}
                <div>
                  <label
                    className={`block text-sm font-medium ${styles.textSecondary} mb-2`}
                  >
                    Estado
                  </label>
                  <div className="flex space-x-4">
                    <label className={`flex items-center ${styles.text}`}>
                      <input
                        type="radio"
                        name="status"
                        value="draft"
                        checked={status === "draft"}
                        onChange={() => setStatus("draft")}
                        className="mr-2"
                      />
                      Borrador
                    </label>
                    <label className={`flex items-center ${styles.text}`}>
                      <input
                        type="radio"
                        name="status"
                        value="ready"
                        checked={status === "ready"}
                        onChange={() => setStatus("ready")}
                        className="mr-2"
                      />
                      Listo para publicar
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div
                className={`px-6 py-4 border-t ${isTech ? "border-gray-800" : "border-gray-200"}`}
              >
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className={`px-4 py-2 border rounded-md ${styles.secondaryButton}`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      selectedPlatforms.length === 0 || !baseContent.trim()
                    }
                    className={`px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${styles.primaryButton}`}
                  >
                    {isScheduled ? "Programar" : "Guardar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
