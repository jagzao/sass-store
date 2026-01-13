"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { SearchableSelectSingle } from "@/components/ui/forms/SearchableSelectSingle";
import { SelectOption } from "@/components/ui/forms/SearchableSelect";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  postCount: number;
  statuses: string[];
  platforms: string[];
}

interface CalendarData {
  [dateKey: string]: {
    post_count: number;
    statuses: string[];
    platforms: string[];
    draft_count: number;
    scheduled_count: number;
    published_count: number;
    failed_count: number;
  };
}

interface CalendarViewProps {
  tenant: string;
  onPostClick: (postId: string) => void;
  variant?: "default" | "tech";
}

const VIEW_TYPES = [
  { id: "month", label: "Mes" },
  { id: "week", label: "Semana" },
  { id: "list", label: "Lista" },
];

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

const STATUS_CONFIG = {
  draft: {
    label: "Borrador",
    color: "bg-yellow-100 text-yellow-800",
    icon: "📝",
  },
  scheduled: {
    label: "Programado",
    color: "bg-blue-100 text-blue-800",
    icon: "⏰",
  },
  published: {
    label: "Publicado",
    color: "bg-green-100 text-green-800",
    icon: "✅",
  },
  failed: { label: "Fallido", color: "bg-red-100 text-red-800", icon: "❌" },
  canceled: {
    label: "Cancelado",
    color: "bg-gray-100 text-gray-800",
    icon: "🚫",
  },
};

export default function CalendarView({
  tenant,
  onPostClick,
  variant = "default",
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [viewType, setViewType] = useState<"month" | "week" | "list">("month");
  const [filters, setFilters] = useState({
    platforms: [] as string[],
    statuses: [] as string[],
    formats: [] as string[],
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Memoize platform options
  const platformOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: "Todas las plataformas" },
      ...Object.entries(PLATFORM_CONFIG).map(([key, config]) => ({
        value: key,
        label: `${config.emoji} ${config.name}`,
      })),
    ],
    [],
  );

  // Memoize status options
  const statusOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: "Todos los estados" },
      ...Object.entries(STATUS_CONFIG).map(([key, config]) => ({
        value: key,
        label: config.label,
      })),
    ],
    [],
  );

  // Memoize format options
  const formatOptions = useMemo<SelectOption[]>(
    () => [
      { value: "", label: "Todos los formatos" },
      { value: "post", label: "Post" },
      { value: "reel", label: "Reel" },
      { value: "story", label: "Story" },
      { value: "video", label: "Video" },
    ],
    [],
  );

  // Generate calendar grid based on view type
  const getCalendarDays = () => {
    if (viewType === "month") {
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    } else if (viewType === "week") {
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
    return [];
  };

  const calendarDays = getCalendarDays();

  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = format(
        viewType === "month" ? monthStart : startOfWeek(selectedDate),
        "yyyy-MM-dd",
      );
      const endDate = format(
        viewType === "month" ? monthEnd : endOfWeek(selectedDate),
        "yyyy-MM-dd",
      );

      const params = new URLSearchParams({
        tenant,
        view: viewType,
        start_date: startDate,
        end_date: endDate,
      });

      if (filters.platforms.length > 0) {
        params.append("platforms", filters.platforms.join(","));
      }
      if (filters.statuses.length > 0) {
        params.append("statuses", filters.statuses.join(","));
      }
      if (filters.formats.length > 0) {
        params.append("formats", filters.formats.join(","));
      }

      const response = await fetch(`/api/v1/social/calendar?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch calendar data");
      }

      const result = await response.json();
      const dataLookup: CalendarData = {};

      if (result.data && result.data.summary) {
        result.data.summary.forEach((day: any) => {
          dataLookup[day.date] = day;
        });
      }

      setCalendarData(dataLookup);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      // Datos de demostración en caso de error
      const demoData: CalendarData = {};
      calendarDays.forEach((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        if (Math.random() > 0.7) {
          demoData[dateKey] = {
            post_count: Math.floor(Math.random() * 3) + 1,
            statuses: ["draft", "scheduled", "published"].filter(
              () => Math.random() > 0.5,
            ),
            platforms: ["facebook", "instagram", "tiktok"].filter(
              () => Math.random() > 0.6,
            ),
            draft_count: Math.random() > 0.7 ? 1 : 0,
            scheduled_count: Math.random() > 0.5 ? 1 : 0,
            published_count: Math.random() > 0.6 ? 1 : 0,
            failed_count: 0,
          };
        }
      });
      setCalendarData(demoData);
    } finally {
      setIsLoading(false);
    }
  }, [viewType, currentMonth, selectedDate, filters]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const getDayData = (date: Date): CalendarDay => {
    const dateKey = format(date, "yyyy-MM-dd");
    const data = calendarData[dateKey];

    return {
      date,
      isCurrentMonth:
        viewType === "month" ? isSameMonth(date, currentMonth) : true,
      postCount: data?.post_count || 0,
      statuses: data?.statuses || [],
      platforms: data?.platforms || [],
    };
  };

  const getStatusColor = (dayData: CalendarDay) => {
    if (variant === "tech") {
      if (dayData.postCount === 0) return "bg-white/5 hover:bg-white/10";
      // Tech variant status colors (neon)
      const data = calendarData[format(dayData.date, "yyyy-MM-dd")];
      if (!data) return "bg-white/5";

      if (data.failed_count > 0) return "bg-red-900/20 border-red-500/50";
      if (data.scheduled_count > 0)
        return "bg-[#FF8000]/20 border-[#FF8000]/50";
      if (data.published_count > 0)
        return "bg-green-900/20 border-green-500/50";
      if (data.draft_count > 0) return "bg-yellow-900/20 border-yellow-500/50";
      return "bg-white/5";
    }

    if (dayData.postCount === 0) return "bg-gray-50";

    const data = calendarData[format(dayData.date, "yyyy-MM-dd")];
    if (!data) return "bg-gray-50";

    if (data.failed_count > 0) return "bg-red-50";
    if (data.scheduled_count > 0) return "bg-blue-50";
    if (data.published_count > 0) return "bg-green-50";
    if (data.draft_count > 0) return "bg-yellow-50";

    return "bg-gray-50";
  };

  const getPlatformEmojis = (platforms: string[]) => {
    return platforms
      .slice(0, 3)
      .map(
        (platform) =>
          PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]?.emoji ||
          "📱",
      )
      .join("");
  };

  const renderMonthView = () => (
    <div className="space-y-4">
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((date) => {
          const dayData = getDayData(date);
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());

          return (
            <button
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className={`
                relative p-2 min-h-[80px] text-left rounded-lg border transition-all hover:shadow-sm
                ${
                  variant === "tech"
                    ? dayData.isCurrentMonth
                      ? "text-gray-200"
                      : "text-gray-600"
                    : dayData.isCurrentMonth
                      ? "text-gray-900"
                      : "text-gray-400"
                }
                ${
                  isSelected
                    ? variant === "tech"
                      ? "ring-1 ring-[#FF8000] border-[#FF8000]/50"
                      : "ring-2 ring-blue-500 border-blue-200"
                    : variant === "tech"
                      ? "border-white/10"
                      : "border-gray-200 hover:border-gray-300"
                }
                ${
                  isToday
                    ? variant === "tech"
                      ? "bg-[#FF8000]/10"
                      : "bg-blue-50"
                    : getStatusColor(dayData)
                }
              `}
            >
              {/* Date number */}
              <div
                className={`text-sm font-medium ${isToday ? (variant === "tech" ? "text-[#FF8000]" : "text-blue-600") : ""}`}
              >
                {format(date, "d")}
              </div>

              {/* Post indicators */}
              {dayData.postCount > 0 && (
                <div className="mt-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">
                      {dayData.postCount} post
                      {dayData.postCount !== 1 ? "s" : ""}
                    </span>
                    <div className="text-xs">
                      {getPlatformEmojis(dayData.platforms)}
                    </div>
                  </div>

                  {/* Status indicators */}
                  <div className="flex space-x-1">
                    {calendarData[format(date, "yyyy-MM-dd")]?.draft_count >
                      0 && (
                      <div
                        className="w-2 h-2 bg-yellow-400 rounded-full"
                        title="Borradores"
                      />
                    )}
                    {calendarData[format(date, "yyyy-MM-dd")]?.scheduled_count >
                      0 && (
                      <div
                        className="w-2 h-2 bg-blue-400 rounded-full"
                        title="Programados"
                      />
                    )}
                    {calendarData[format(date, "yyyy-MM-dd")]?.published_count >
                      0 && (
                      <div
                        className="w-2 h-2 bg-green-400 rounded-full"
                        title="Publicados"
                      />
                    )}
                    {calendarData[format(date, "yyyy-MM-dd")]?.failed_count >
                      0 && (
                      <div
                        className="w-2 h-2 bg-red-400 rounded-full"
                        title="Fallidos"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Today indicator */}
              {isToday && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="space-y-4">
      {calendarDays.map((date) => {
        const dayData = getDayData(date);
        const isSelected = isSameDay(date, selectedDate);
        const isToday = isSameDay(date, new Date());

        return (
          <div
            key={date.toISOString()}
            onClick={() => setSelectedDate(date)}
            className={`
              p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm
              ${isSelected ? "ring-2 ring-blue-500 border-blue-200" : "border-gray-200"}
              ${isToday ? "bg-blue-50" : getStatusColor(dayData)}
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={`text-lg font-medium ${isToday ? "text-blue-600" : ""}`}
                >
                  {format(date, "EEEE, d MMMM", { locale: es })}
                </div>
                {dayData.postCount > 0 && (
                  <div className="mt-2 flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {dayData.postCount} publicación
                      {dayData.postCount !== 1 ? "es" : ""}
                    </span>
                    <div className="flex space-x-1">
                      {dayData.platforms.map((platform) => (
                        <span key={platform} className="text-lg">
                          {
                            PLATFORM_CONFIG[
                              platform as keyof typeof PLATFORM_CONFIG
                            ]?.emoji
                          }
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPostClick("new-post");
                }}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
              >
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => {
    // Generar datos de demostración para la vista de lista
    const listData = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() + Math.floor(Math.random() * 30));

      const platforms = ["facebook", "instagram", "tiktok"].filter(
        () => Math.random() > 0.5,
      );
      const status = ["draft", "scheduled", "published"][
        Math.floor(Math.random() * 3)
      ];

      listData.push({
        id: `post-${i}`,
        date,
        title: `Publicación de ejemplo ${i + 1}`,
        content:
          "Este es un contenido de ejemplo para la vista de lista del calendario...",
        platforms,
        status,
      });
    }

    return (
      <div className="space-y-4">
        {listData.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG].color}`}
                  >
                    {
                      STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG]
                        .label
                    }
                  </span>
                  <span className="text-sm text-gray-500">
                    📅 {format(item.date, "dd/MM/yyyy HH:mm", { locale: es })}
                  </span>
                </div>

                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">{item.content}</p>

                <div className="flex items-center space-x-2">
                  {item.platforms.map((platform) => (
                    <span
                      key={platform}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG].color}`}
                    >
                      <span className="mr-1">
                        {
                          PLATFORM_CONFIG[
                            platform as keyof typeof PLATFORM_CONFIG
                          ].emoji
                        }
                      </span>
                      {
                        PLATFORM_CONFIG[
                          platform as keyof typeof PLATFORM_CONFIG
                        ].name
                      }
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onPostClick(item.id)}
                className="ml-4 p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
              >
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div
        className={`${variant === "tech" ? "bg-white/5 backdrop-blur-md border-white/10" : "bg-white"} rounded-lg shadow-sm border p-6`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className={`text-xl font-semibold ${variant === "tech" ? "text-white font-[family-name:var(--font-rajdhani)] uppercase tracking-wide" : "text-gray-900"}`}
            >
              {viewType === "month"
                ? format(currentMonth, "MMMM yyyy", { locale: es })
                : viewType === "week"
                  ? `Semana del ${format(startOfWeek(selectedDate), "d MMM", { locale: es })}`
                  : "Lista de Publicaciones"}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {viewType === "month" &&
                "Haz clic en un día para ver los posts programados"}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Type Selector */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              {VIEW_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() =>
                    setViewType(type.id as "month" | "week" | "list")
                  }
                  className={`
                    px-3 py-1 text-sm font-medium rounded-md transition-colors
                    ${
                      viewType === type.id
                        ? variant === "tech"
                          ? "bg-[#FF8000] text-black shadow-sm font-bold"
                          : "bg-white text-blue-600 shadow-sm"
                        : variant === "tech"
                          ? "text-gray-400 hover:text-white"
                          : "text-gray-600 hover:text-gray-900"
                    }
                  `}
                >
                  {type.label}
                </button>
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Hoy
              </button>

              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${variant === "tech" ? "text-gray-300" : "text-gray-700"}`}
            >
              Plataformas
            </label>
            <SearchableSelectSingle
              options={platformOptions}
              value={filters.platforms[0] || ""}
              onChange={(option: SelectOption | null) => {
                setFilters((prev) => ({
                  ...prev,
                  platforms: option?.value ? [option.value] : [],
                }));
              }}
              placeholder="Seleccionar plataforma"
              isSearchable={true}
              isDisabled={isLoading}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${variant === "tech" ? "text-gray-300" : "text-gray-700"}`}
            >
              Estado
            </label>
            <SearchableSelectSingle
              options={statusOptions}
              value={filters.statuses[0] || ""}
              onChange={(option: SelectOption | null) => {
                setFilters((prev) => ({
                  ...prev,
                  statuses: option?.value ? [option.value] : [],
                }));
              }}
              placeholder="Seleccionar estado"
              isSearchable={false}
              isDisabled={isLoading}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${variant === "tech" ? "text-gray-300" : "text-gray-700"}`}
            >
              Formato
            </label>
            <SearchableSelectSingle
              options={formatOptions}
              value={filters.formats[0] || ""}
              onChange={(option: SelectOption | null) => {
                setFilters((prev) => ({
                  ...prev,
                  formats: option?.value ? [option.value] : [],
                }));
              }}
              placeholder="Seleccionar formato"
              isSearchable={false}
              isDisabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div
        className={`${variant === "tech" ? "bg-white/5 backdrop-blur-md border-white/10" : "bg-white"} rounded-lg shadow-sm border p-6`}
      >
        {viewType === "month" && renderMonthView()}
        {viewType === "week" && renderWeekView()}
        {viewType === "list" && renderListView()}
      </div>

      {/* Legend */}
      {viewType !== "list" && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                <span className="text-gray-600">Borrador</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-400 rounded-full" />
                <span className="text-gray-600">Programado</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-400 rounded-full" />
                <span className="text-gray-600">Publicado</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-400 rounded-full" />
                <span className="text-gray-600">Fallido</span>
              </div>
            </div>

            <div className="text-gray-500">
              Doble clic en un día para crear un post
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
