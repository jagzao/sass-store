"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

interface EditorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  postId?: string | null;
}

export default function EditorDrawer({
  isOpen,
  onClose,
  postId,
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

  useEffect(() => {
    if (initialData?.variants) {
      const initialVariants: Record<string, string> = {};
      initialData.variants.forEach((variant) => {
        initialVariants[variant.platform] = variant.content;
      });
      setVariants(initialVariants);
    }
  }, [initialData]);

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

    // Aquí se implementaría el guardado del post
    console.log("Guardando post:", {
      id: postId,
      title,
      content: baseContent,
      platforms: selectedPlatforms,
      variants: selectedPlatforms.map((platform) => ({
        platform,
        content: variants[platform] || baseContent,
      })),
      scheduledAt: isScheduled
        ? new Date(`${scheduledDate}T${scheduledTime}`)
        : null,
      status,
    });

    // Cerrar el drawer después de guardar
    onClose();
  };

  if (!isOpen) return null;

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
          <div className="h-full flex flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  {postId ? "Editar Publicación" : "Nueva Publicación"}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Título interno
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Título para organización interna..."
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {title.length}/200 caracteres
                  </p>
                </div>

                {/* Base Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="content"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Contenido base
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateWithAI}
                      disabled={isLoading}
                      className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      {isLoading ? "Generando..." : "Generar con IA ✨"}
                    </button>
                  </div>
                  <textarea
                    id="content"
                    value={baseContent}
                    onChange={(e) => setBaseContent(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Escribe el contenido base..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {baseContent.length}/2000 caracteres
                  </p>
                </div>

                {/* Scheduling */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center space-x-4 mb-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="schedule-type"
                        checked={!isScheduled}
                        onChange={() => setIsScheduled(false)}
                        className="mr-2"
                      />
                      Borrador
                    </label>
                    <label className="flex items-center">
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
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Fecha
                        </label>
                        <input
                          type="date"
                          id="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={format(new Date(), "yyyy-MM-dd")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={isScheduled}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="time"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Hora
                        </label>
                        <input
                          type="time"
                          id="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={isScheduled}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Platform Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
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
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">{platform.emoji}</div>
                          <div className="text-sm font-medium">
                            {platform.name}
                          </div>
                        </div>
                        {selectedPlatforms.includes(platform.id) && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg
                              className="w-2 h-2 text-white"
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
                    <h3 className="text-lg font-medium text-gray-900">
                      Personalización por Plataforma
                    </h3>
                    {selectedPlatforms.map((platformId) => {
                      const platform = PLATFORMS.find(
                        (p) => p.id === platformId,
                      )!;
                      const charCount = getCharacterCount(platformId);
                      const isOverLimit = charCount.current > charCount.max;

                      return (
                        <div key={platformId} className="border rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <span className="text-lg mr-2">
                              {platform.emoji}
                            </span>
                            <span className="font-medium">{platform.name}</span>
                            <span
                              className={`ml-auto text-sm ${isOverLimit ? "text-red-500" : "text-gray-500"}`}
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
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              isOverLimit ? "border-red-300" : "border-gray-300"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
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
                    <label className="flex items-center">
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
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      selectedPlatforms.length === 0 || !baseContent.trim()
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
