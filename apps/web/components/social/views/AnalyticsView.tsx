"use client";

import { useState, useEffect } from "react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

interface AnalyticsData {
  totalReach: number;
  totalInteractions: number;
  newFollowers: number;
  engagementRate: number;
  platformBreakdown: {
    platform: string;
    reach: number;
    interactions: number;
    followers: number;
  }[];
  topPosts: {
    id: string;
    title: string;
    content: string;
    platform: string;
    reach: number;
    interactions: number;
    engagementRate: number;
    publishedAt: Date;
  }[];
  timeSeriesData: {
    date: string;
    reach: number;
    interactions: number;
  }[];
}

interface AnalyticsViewProps {
  tenant: string;
  onPostClick: (postId: string) => void;
}

const DATE_RANGES = [
  { id: "7d", label: "Últimos 7 días", days: 7 },
  { id: "30d", label: "Últimos 30 días", days: 30 },
  { id: "90d", label: "Últimos 90 días", days: 90 },
  { id: "1y", label: "Último año", days: 365 },
];

export default function AnalyticsView({
  tenant,
  onPostClick,
}: AnalyticsViewProps) {
  const [dateRange, setDateRange] = useState("30d");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, selectedPlatforms]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const selectedRange = DATE_RANGES.find((range) => range.id === dateRange);
      const endDate = new Date();
      const startDate = subDays(endDate, selectedRange?.days || 30);

      const params = new URLSearchParams({
        tenant,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
      });

      if (selectedPlatforms.length > 0) {
        params.append("platforms", selectedPlatforms.join(","));
      }

      // Call analytics API
      const response = await fetch(`/api/v1/social/analytics?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const result = await response.json();
      setAnalyticsData(result.data);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      // Datos de demostración en caso de error
      const demoData: AnalyticsData = {
        totalReach: 15420,
        totalInteractions: 892,
        newFollowers: 156,
        engagementRate: 5.8,
        platformBreakdown: [
          {
            platform: "facebook",
            reach: 8200,
            interactions: 420,
            followers: 89,
          },
          {
            platform: "instagram",
            reach: 6400,
            interactions: 380,
            followers: 67,
          },
          { platform: "tiktok", reach: 3200, interactions: 92, followers: 0 },
        ],
        topPosts: [
          {
            id: "post-1",
            title: "Transformación increíble",
            content:
              "Mira el cambio espectacular de nuestra clienta. ¡Resultados profesionales!",
            platform: "instagram",
            reach: 2400,
            interactions: 156,
            engagementRate: 6.5,
            publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
          {
            id: "post-2",
            title: "Promoción especial",
            content:
              "✨ Oferta especial en nuestros servicios de uñas. ¡No te la pierdas!",
            platform: "facebook",
            reach: 1800,
            interactions: 98,
            engagementRate: 5.4,
            publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          },
          {
            id: "post-3",
            title: "Tip del día",
            content:
              "💡 ¿Sabías que...? Consejos profesionales para el cuidado de tus uñas.",
            platform: "tiktok",
            reach: 3200,
            interactions: 280,
            engagementRate: 8.8,
            publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        ],
        timeSeriesData: [],
      };

      // Generar datos de series temporales
      const currentRange = DATE_RANGES.find((range) => range.id === dateRange);
      const days = currentRange?.days || 30;
      for (let i = days; i >= 0; i--) {
        const date = subDays(new Date(), i);
        demoData.timeSeriesData.push({
          date: format(date, "yyyy-MM-dd"),
          reach: Math.floor(Math.random() * 500) + 200,
          interactions: Math.floor(Math.random() * 50) + 10,
        });
      }

      setAnalyticsData(demoData);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId],
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 text-6xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay datos disponibles
        </h3>
        <p className="text-gray-600">
          No se encontraron datos de analytics para el período seleccionado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
            <p className="text-gray-600 text-sm mt-1">
              Métricas de rendimiento de tus publicaciones
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              {DATE_RANGES.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id)}
                  className={`
                    px-3 py-1 text-sm font-medium rounded-md transition-colors
                    ${
                      dateRange === range.id
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }
                  `}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plataformas
            </label>
            <div className="flex items-center space-x-2">
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
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">👥</div>
            <div>
              <p className="text-sm text-gray-600">Alcance Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analyticsData.totalReach)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">💬</div>
            <div>
              <p className="text-sm text-gray-600">Interacciones</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(analyticsData.totalInteractions)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📈</div>
            <div>
              <p className="text-sm text-gray-600">Nuevos Seguidores</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.newFollowers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📊</div>
            <div>
              <p className="text-sm text-gray-600">Engagement %</p>
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.engagementRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Tendencias de Alcance e Interacciones
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={analyticsData.timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), "dd/MM")}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(date) =>
                format(new Date(date), "dd/MM/yyyy", { locale: es })
              }
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="reach"
              name="Alcance"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="interactions"
              name="Interacciones"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Platform Performance Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Rendimiento por Plataforma
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData.platformBreakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="platform"
              tickFormatter={(platform) =>
                PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]
                  ?.name || platform
              }
            />
            <YAxis />
            <Tooltip
              labelFormatter={(platform) =>
                PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]
                  ?.name || platform
              }
            />
            <Legend />
            <Bar dataKey="reach" name="Alcance" fill="#3b82f6" />
            <Bar dataKey="interactions" name="Interacciones" fill="#10b981" />
            <Bar dataKey="followers" name="Nuevos Seguidores" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Posts */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Top Publicaciones
        </h3>
        <div className="space-y-4">
          {analyticsData.topPosts.map((post) => (
            <div
              key={post.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onPostClick(post.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        PLATFORM_CONFIG[
                          post.platform as keyof typeof PLATFORM_CONFIG
                        ].color
                      } text-white`}
                    >
                      {
                        PLATFORM_CONFIG[
                          post.platform as keyof typeof PLATFORM_CONFIG
                        ]?.emoji
                      }
                      {
                        PLATFORM_CONFIG[
                          post.platform as keyof typeof PLATFORM_CONFIG
                        ]?.name
                      }
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(post.publishedAt, "dd/MM/yyyy HH:mm", {
                        locale: es,
                      })}
                    </span>
                  </div>

                  <h4 className="font-medium text-gray-900 mb-2">
                    {post.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">{post.content}</p>

                  <div className="flex items-center space-x-4 text-sm">
                    <div>
                      <span className="text-gray-600">Alcance: </span>
                      <span className="font-medium">
                        {formatNumber(post.reach)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Interacciones: </span>
                      <span className="font-medium">
                        {formatNumber(post.interactions)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Engagement: </span>
                      <span className="font-medium">
                        {post.engagementRate}%
                      </span>
                    </div>
                  </div>
                </div>

                <button className="ml-4 p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
