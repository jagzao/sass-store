"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";

const PLATFORM_CONFIG = {
  facebook: {
    emoji: "📘",
    name: "Facebook",
    color: "bg-blue-100 text-blue-800",
  },
  instagram: {
    emoji: "📷",
    name: "Instagram",
    color: "bg-pink-100 text-pink-800",
  },
  linkedin: {
    emoji: "💼",
    name: "LinkedIn",
    color: "bg-blue-100 text-blue-700",
  },
  x: { emoji: "🐦", name: "X", color: "bg-gray-100 text-gray-800" },
  tiktok: { emoji: "🎵", name: "TikTok", color: "bg-gray-100 text-gray-900" },
  gbp: {
    emoji: "🏢",
    name: "Google Business",
    color: "bg-green-100 text-green-800",
  },
  threads: { emoji: "🧵", name: "Threads", color: "bg-gray-100 text-gray-900" },
};

const CONTENT_TYPES = [
  { id: "promotions", label: "Promociones", icon: "🏷️" },
  { id: "before_after", label: "Antes/Después", icon: "🔄" },
  { id: "trends", label: "Tendencias", icon: "📈" },
  { id: "tips", label: "Tips", icon: "💡" },
];

const OBJECTIVES = [
  {
    id: "sales",
    label: "Ventas",
    description: "Aumentar conversiones y promocionar productos",
  },
  {
    id: "brand",
    label: "Marca",
    description: "Fortalecer imagen y reconocimiento de marca",
  },
  {
    id: "educational",
    label: "Educativo",
    description: "Compartir conocimiento y tutoriales",
  },
];

interface GenerateConfig {
  objective: string;
  platforms: string[];
  dateRange: {
    start: string;
    end: string;
  };
  frequency: {
    postsPerWeek: number;
    reelsPerWeek: number;
    storiesPerWeek: number;
  };
  contentMix: {
    promotions: number;
    beforeAfter: number;
    trends: number;
    tips: number;
  };
}

interface GeneratedPost {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  suggestedDate: Date;
  contentType: string;
  status: "draft";
}

export default function GenerateView() {
  const [config, setConfig] = useState<GenerateConfig>({
    objective: "brand",
    platforms: ["facebook", "instagram"],
    dateRange: {
      start: format(new Date(), "yyyy-MM-dd"),
      end: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    },
    frequency: {
      postsPerWeek: 3,
      reelsPerWeek: 1,
      storiesPerWeek: 2,
    },
    contentMix: {
      promotions: 40,
      beforeAfter: 30,
      trends: 20,
      tips: 10,
    },
  });

  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handlePlatformToggle = (platformId: string) => {
    setConfig((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter((id) => id !== platformId)
        : [...prev.platforms, platformId],
    }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // Simular llamada a API de generación de contenido
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Generar posts de ejemplo
      const posts: GeneratedPost[] = [];
      const totalPosts = Math.floor(
        (config.frequency.postsPerWeek +
          config.frequency.reelsPerWeek +
          config.frequency.storiesPerWeek) *
          4,
      );

      const contentTypes = Object.entries(config.contentMix)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => ({ type: key, weight: value }));

      for (let i = 0; i < Math.min(totalPosts, 25); i++) {
        const randomDate = new Date(
          Date.now() +
            Math.random() *
              (new Date(config.dateRange.end).getTime() -
                new Date(config.dateRange.start).getTime()),
        );

        const contentType =
          contentTypes[Math.floor(Math.random() * contentTypes.length)];
        const contentTypeLabel =
          CONTENT_TYPES.find((ct) => ct.id === contentType.type)?.label ||
          "General";

        const templates = {
          promotions: [
            `✨ Oferta especial en nuestros servicios de uñas. ¡No te la pierdas! #WonderNails #Oferta`,
            `🎁 Esta semana tenemos promociones exclusivas para ti. Agenda tu cita hoy. #Promocion`,
            `💅 Descubre nuestros nuevos diseños de uñas con descuento especial. #Novedades`,
          ],
          before_after: [
            `🔄 Transformación increíble en nuestro salón. Antes y después de nuestro servicio. #BeforeAfter`,
            `💖 Mira el cambio espectacular de nuestra clienta. ¡Resultados profesionales! #Transformacion`,
            `✨ El poder de un buen servicio de uñas. Compara el antes y el después. #Magia`,
          ],
          trends: [
            `🔥 Las últimas tendencias en uñas para esta temporada. ¡Sé la primera en lucirlas! #Tendencias`,
            `📈 Descubre los diseños de uñas que están arrasando en las redes. #Fashion`,
            `✨ Mantente al día con las últimas tendencias en arte de uñas. #Estilo`,
          ],
          tips: [
            `💡 ¿Sabías que...? Consejos profesionales para el cuidado de tus uñas. #Tips`,
            `🔍 Tip del día: Cómo mantener tus uñas impecables por más tiempo. #Consejos`,
            `✨ Secretos profesionales para tener uñas saludables y hermosas. #Cuidado`,
          ],
        };

        const platformTemplates =
          templates[contentType.type as keyof typeof templates];
        const content =
          platformTemplates[
            Math.floor(Math.random() * platformTemplates.length)
          ];

        posts.push({
          id: `generated-${i}`,
          title: `${contentTypeLabel} - ${format(randomDate, "dd/MM")}`,
          content,
          platforms: config.platforms.slice(
            0,
            Math.floor(Math.random() * config.platforms.length) + 1,
          ),
          suggestedDate: randomDate,
          contentType: contentType.type,
          status: "draft",
        });
      }

      setGeneratedPosts(posts);
      setShowPreview(true);
    } catch (error) {
      console.error("Error generating content:", error);
      alert("Error al generar contenido. Por favor, intenta de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToCalendar = () => {
    // Aquí se guardarían los posts generados en el calendario y la cola
    alert(
      `${generatedPosts.length} publicaciones guardadas en el calendario y la cola`,
    );
    setShowPreview(false);
    setGeneratedPosts([]);
  };

  const totalPercentage = Object.values(config.contentMix).reduce(
    (sum, val) => sum + val,
    0,
  );
  const isValidMix = totalPercentage === 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Generar Contenido con IA
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Crea mucho contenido en poco tiempo para tus redes sociales
            </p>
          </div>
        </div>

        {/* Configuration Form */}
        <div className="space-y-6">
          {/* Objective */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Objetivo
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {OBJECTIVES.map((objective) => (
                <button
                  key={objective.id}
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, objective: objective.id }))
                  }
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    config.objective === objective.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <h3 className="font-medium text-gray-900">
                    {objective.label}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {objective.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Plataformas
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(PLATFORM_CONFIG).map(([key, platform]) => (
                <button
                  key={key}
                  onClick={() => handlePlatformToggle(key)}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    config.platforms.includes(key)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{platform.emoji}</div>
                    <div className="text-sm font-medium">{platform.name}</div>
                  </div>
                  {config.platforms.includes(key) && (
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

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Rango de fechas
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={config.dateRange.start}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, start: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={config.dateRange.end}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, end: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Frecuencia semanal
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Posts
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={config.frequency.postsPerWeek}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      frequency: {
                        ...prev.frequency,
                        postsPerWeek: parseInt(e.target.value) || 0,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Reels
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={config.frequency.reelsPerWeek}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      frequency: {
                        ...prev.frequency,
                        reelsPerWeek: parseInt(e.target.value) || 0,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Stories
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={config.frequency.storiesPerWeek}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      frequency: {
                        ...prev.frequency,
                        storiesPerWeek: parseInt(e.target.value) || 0,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Content Mix */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Mix de contenido{" "}
              <span className="text-xs text-gray-500">
                (Total: {totalPercentage}%)
              </span>
            </label>
            <div className="space-y-3">
              {CONTENT_TYPES.map((contentType) => (
                <div
                  key={contentType.id}
                  className="flex items-center space-x-4"
                >
                  <div className="flex items-center space-x-2 w-32">
                    <span>{contentType.icon}</span>
                    <span className="text-sm font-medium">
                      {contentType.label}
                    </span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={
                        config.contentMix[
                          contentType.id as keyof typeof config.contentMix
                        ]
                      }
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          contentMix: {
                            ...prev.contentMix,
                            [contentType.id]: parseInt(e.target.value) || 0,
                          },
                        }))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm font-medium">
                      {
                        config.contentMix[
                          contentType.id as keyof typeof config.contentMix
                        ]
                      }
                      %
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {!isValidMix && (
              <p className="text-sm text-red-600 mt-2">
                El total debe sumar 100%. Actual: {totalPercentage}%
              </p>
            )}
          </div>

          {/* Generate Button */}
          <div className="pt-4 border-t">
            <button
              onClick={handleGenerate}
              disabled={
                isGenerating || !isValidMix || config.platforms.length === 0
              }
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generando contenido...
                </span>
              ) : (
                `Generar ${Math.floor(
                  (config.frequency.postsPerWeek +
                    config.frequency.reelsPerWeek +
                    config.frequency.storiesPerWeek) *
                    4,
                )} publicaciones`
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowPreview(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Vista previa ({generatedPosts.length} publicaciones
                    generadas)
                  </h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-600"
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

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="space-y-4">
                  {generatedPosts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {post.title}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {format(post.suggestedDate, "dd/MM/yyyy")} •{" "}
                            {post.platforms
                              .map(
                                (p) =>
                                  PLATFORM_CONFIG[
                                    p as keyof typeof PLATFORM_CONFIG
                                  ].name,
                              )
                              .join(", ")}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            post.contentType === "promotions"
                              ? "bg-purple-100 text-purple-800"
                              : post.contentType === "before_after"
                                ? "bg-blue-100 text-blue-800"
                                : post.contentType === "trends"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {
                            CONTENT_TYPES.find(
                              (ct) => ct.id === post.contentType,
                            )?.icon
                          }
                          <span className="ml-1">
                            {
                              CONTENT_TYPES.find(
                                (ct) => ct.id === post.contentType,
                              )?.label
                            }
                          </span>
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm">{post.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveToCalendar}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Guardar en Calendario y Cola
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
