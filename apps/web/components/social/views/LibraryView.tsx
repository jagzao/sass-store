"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const PLATFORM_CONFIG = {
  facebook: { emoji: "📘", name: "Facebook", color: "bg-blue-600" },
  instagram: {
    emoji: "📷",
    name: "Instagram",
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
  },
  linkedin: { emoji: "💼", name: "LinkedIn", color: "bg-blue-700" },
  x: { emoji: "🐦", name: "X", color: "bg-black" },
  tiktok: { emoji: "🎵", name: "TikTok", color: "bg-black" },
  gbp: { emoji: "🏢", name: "Google Business", color: "bg-green-600" },
  threads: { emoji: "🧵", name: "Threads", color: "bg-gray-900" },
};

const CONTENT_FORMATS = [
  { id: "post", name: "Post", emoji: "📝" },
  { id: "reel", name: "Reel", emoji: "🎬" },
  { id: "story", name: "Story", emoji: "📱" },
  { id: "video", name: "Video", emoji: "📹" },
];

interface LibraryContent {
  id: string;
  title: string;
  content: string;
  format: string;
  platforms: string[];
  mediaUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

interface LibraryViewProps {
  onContentSelect: (contentId: string, data?: any) => void;
  onCreateNew: () => void;
}

export default function LibraryView({
  onContentSelect,
  onCreateNew,
}: LibraryViewProps) {
  const [contentItems, setContentItems] = useState<LibraryContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"recent" | "name" | "usage">("recent");

  useEffect(() => {
    fetchLibraryContent();
  }, []);

  const fetchLibraryContent = async () => {
    setIsLoading(true);
    try {
      // Simular llamada a API
      const response = await fetch("/api/v1/social/library");
      if (!response.ok) {
        throw new Error("Failed to fetch library content");
      }

      const result = await response.json();
      setContentItems(result.data);
    } catch (error) {
      console.error("Error fetching library content:", error);
      // Datos de demostración en caso de error
      setContentItems([
        {
          id: "lib-1",
          title: "Promoción de servicios",
          content:
            "✨ Oferta especial en nuestros servicios de uñas. ¡Resultados profesionales que te harán brillar! Agenda tu cita hoy. #WonderNails #Belleza",
          format: "post",
          platforms: ["facebook", "instagram"],
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          usageCount: 8,
        },
        {
          id: "lib-2",
          title: "Transformación increíble",
          content:
            "Mira el cambio espectacular de nuestra clienta. ¡De simple a espectacular en una sola sesión! 💅✨ #Transformación #BeforeAfter",
          format: "reel",
          platforms: ["instagram", "tiktok"],
          mediaUrl: "/placeholder-video.jpg",
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          usageCount: 12,
        },
        {
          id: "lib-3",
          title: "Tip del día",
          content:
            "💡 ¿Sabías que...? El uso de base coat antes del esmalte protege tus uñas y ayuda a que el color dure más tiempo.",
          format: "story",
          platforms: ["instagram", "facebook"],
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          usageCount: 5,
        },
        {
          id: "lib-4",
          title: "Tutorial de uñas",
          content:
            "Aprende a conseguir el acabado perfecto en casa con nuestros consejos profesionales. En este video te mostramos paso a paso.",
          format: "video",
          platforms: ["instagram", "tiktok", "youtube"],
          mediaUrl: "/placeholder-video.jpg",
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          usageCount: 15,
        },
        {
          id: "lib-5",
          title: "Nuevos colores",
          content:
            "¡Llegaron los nuevos colores de temporada! 🌈 Tonos vibrantes y elegantes para que elijas tu próximo look. #NuevosColores #Tendencias",
          format: "post",
          platforms: ["facebook", "instagram", "tiktok"],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          usageCount: 6,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormatToggle = (formatId: string) => {
    setSelectedFormats((prev) =>
      prev.includes(formatId)
        ? prev.filter((id) => id !== formatId)
        : [...prev, formatId],
    );
  };

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId],
    );
  };

  const filteredContent = contentItems
    .filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFormat =
        selectedFormats.length === 0 || selectedFormats.includes(item.format);

      const matchesPlatform =
        selectedPlatforms.length === 0 ||
        item.platforms.some((platform) => selectedPlatforms.includes(platform));

      return matchesSearch && matchesFormat && matchesPlatform;
    })
    .sort((a, b) => {
      if (sortBy === "name") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "usage") {
        return b.usageCount - a.usageCount;
      } else {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
    });

  const getFormatConfig = (formatId: string) => {
    return (
      CONTENT_FORMATS.find((format) => format.id === formatId) ||
      CONTENT_FORMATS[0]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Biblioteca de Contenido
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Gestiona y reutiliza tu contenido guardado
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nuevo Contenido
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar contenido
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por título o contenido..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Formato
              </label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_FORMATS.map((format) => (
                  <button
                    key={format.id}
                    onClick={() => handleFormatToggle(format.id)}
                    className={`
                      px-3 py-1 text-sm font-medium rounded-full transition-colors
                      ${
                        selectedFormats.includes(format.id)
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    `}
                  >
                    {format.emoji} {format.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plataformas
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PLATFORM_CONFIG).map(([key, platform]) => (
                  <button
                    key={key}
                    onClick={() => handlePlatformToggle(key)}
                    className={`
                      px-3 py-1 text-sm font-medium rounded-full transition-colors
                      ${
                        selectedPlatforms.includes(key)
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }
                    `}
                  >
                    {platform.emoji} {platform.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setSortBy("recent")}
                  className={`
                    px-3 py-1 text-sm font-medium rounded-md transition-colors
                    ${
                      sortBy === "recent"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }
                  `}
                >
                  Reciente
                </button>
                <button
                  onClick={() => setSortBy("name")}
                  className={`
                    px-3 py-1 text-sm font-medium rounded-md transition-colors
                    ${
                      sortBy === "name"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }
                  `}
                >
                  Nombre
                </button>
                <button
                  onClick={() => setSortBy("usage")}
                  className={`
                    px-3 py-1 text-sm font-medium rounded-md transition-colors
                    ${
                      sortBy === "usage"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }
                  `}
                >
                  Más usado
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay contenido
          </h3>
          <p className="text-gray-600 mb-4">
            No se encontró contenido que coincida con tus filtros.
          </p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Crear nuevo contenido
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContent.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                onContentSelect(item.id, {
                  title: item.title,
                  baseContent: item.content,
                })
              }
            >
              {/* Media Preview */}
              {item.mediaUrl && (
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  <div className="text-gray-400 text-4xl">
                    {getFormatConfig(item.format).emoji}
                  </div>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.format === "post"
                        ? "bg-blue-100 text-blue-800"
                        : item.format === "reel"
                          ? "bg-purple-100 text-purple-800"
                          : item.format === "story"
                            ? "bg-pink-100 text-pink-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {getFormatConfig(item.format).emoji}{" "}
                    {getFormatConfig(item.format).name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.usageCount} {item.usageCount === 1 ? "uso" : "usos"}
                  </span>
                </div>

                <h3 className="font-medium text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {item.content}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {item.platforms.map((platform) => (
                      <span key={platform} className="text-lg">
                        {
                          PLATFORM_CONFIG[
                            platform as keyof typeof PLATFORM_CONFIG
                          ]?.emoji
                        }
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(item.updatedAt, "dd/MM/yyyy", { locale: es })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
