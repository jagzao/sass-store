"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import DraggableQueue from "../DraggableQueue";

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

interface QueuePost {
  id: string;
  title?: string;
  content: string;
  status: keyof typeof STATUS_CONFIG;
  scheduledAt?: Date;
  platforms: string[];
  createdAt: Date;
}

interface QueueViewProps {
  tenant: string;
  onPostClick: (postId: string, data?: any) => void;
  variant?: "default" | "tech";
}

export default function QueueView({
  tenant,
  onPostClick,
  variant = "default",
}: QueueViewProps) {
  const [posts, setPosts] = useState<QueuePost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "drag">("table");
  const [filters, setFilters] = useState({
    status: "",
    platform: "",
    dateRange: {
      start: format(new Date(), "yyyy-MM-dd"),
      end: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    },
  });

  const fetchQueuePosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        tenant,
        start_date: filters.dateRange.start,
        end_date: filters.dateRange.end,
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.platform) params.append("platform", filters.platform);

      const response = await fetch(`/api/v1/social/queue?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch queue posts");
      }

      const result = await response.json();
      setPosts(result.data || []);
    } catch (error) {
      // Error fetching queue posts - showing demo data
      // Datos de demostración en caso de error
      const demoPosts: QueuePost[] = [];
      const statuses: Array<keyof typeof STATUS_CONFIG> = [
        "draft",
        "scheduled",
        "published",
        "failed",
      ];
      const platforms = Object.keys(PLATFORM_CONFIG);

      for (let i = 0; i < 15; i++) {
        const randomDate = new Date();
        randomDate.setDate(
          randomDate.getDate() + Math.floor(Math.random() * 7),
        );

        demoPosts.push({
          id: `queue-post-${i}`,
          title: `Publicación ${i + 1}`,
          content: `Este es el contenido de la publicación ${i + 1} para la cola de gestión diaria...`,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          scheduledAt: randomDate,
          platforms: platforms.slice(0, Math.floor(Math.random() * 3) + 1),
          createdAt: new Date(
            Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
          ),
        });
      }

      setPosts(demoPosts);
    } finally {
      setIsLoading(false);
    }
  }, [tenant, filters]);

  useEffect(() => {
    fetchQueuePosts();
  }, [fetchQueuePosts]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(posts.map((post) => post.id));
      setSelectedPosts(allIds);
    } else {
      setSelectedPosts(new Set());
    }
  };

  const handleSelectPost = (postId: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  const handleBulkAction = async (
    action: "approve" | "reschedule" | "delete",
  ) => {
    if (selectedPosts.size === 0) return;

    try {
      switch (action) {
        case "approve":
          // TODO: Implement API call to update status
          setPosts((prev) =>
            prev.map((post) =>
              selectedPosts.has(post.id)
                ? { ...post, status: "published" as const }
                : post,
            ),
          );
          break;
        case "reschedule":
          // TODO: Implement API call to reschedule
          const newDate = new Date();
          newDate.setDate(newDate.getDate() + 1);
          setPosts((prev) =>
            prev.map((post) =>
              selectedPosts.has(post.id)
                ? { ...post, scheduledAt: newDate }
                : post,
            ),
          );
          break;
        case "delete":
          // Delete posts via API
          const postIds = Array.from(selectedPosts).join(",");
          const response = await fetch(
            `/api/v1/social/queue?ids=${postIds}&tenant=${tenant}`,
            {
              method: "DELETE",
            },
          );

          if (response.ok) {
            setPosts((prev) =>
              prev.filter((post) => !selectedPosts.has(post.id)),
            );
          } else {
            throw new Error("Failed to delete posts");
          }
          break;
      }

      setSelectedPosts(new Set());
    } catch (error) {
      // Error performing bulk action
      alert(`Error al realizar la acción ${action}`);
    }
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handleReorder = async (reorderedPosts: any[]) => {
    try {
      const postIds = reorderedPosts.map((p) => p.id);

      const response = await fetch("/api/v1/social/queue/reorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant,
          postIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder posts");
      }

      await response.json();
      // Posts reordered successfully

      // Refresh the posts list to reflect new order
      await fetchQueuePosts();
    } catch (error) {
      // Error reordering posts
      alert("Error al reordenar las publicaciones");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Cola de Publicaciones
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Gestión rápida de publicaciones pendientes o fallidas
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📋 Tabla
            </button>
            <button
              onClick={() => setViewMode("drag")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === "drag"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              🔀 Reordenar
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <option key={status} value={status}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plataforma
            </label>
            <select
              value={filters.platform}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, platform: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las plataformas</option>
              {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => (
                <option key={platform} value={platform}>
                  {config.emoji} {config.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desde
            </label>
            <input
              type="date"
              value={filters.dateRange.start}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hasta
            </label>
            <input
              type="date"
              value={filters.dateRange.end}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value },
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPosts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedPosts.size} publicación
              {selectedPosts.size !== 1 ? "es" : ""} seleccionada
              {selectedPosts.size !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction("approve")}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                Aprobar
              </button>
              <button
                onClick={() => handleBulkAction("reschedule")}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                Reprogramar
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
              <button
                onClick={() => setSelectedPosts(new Set())}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area - Toggle between Table and Drag View */}
      {viewMode === "drag" ? (
        /* Drag & Drop View */
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando cola de publicaciones...</p>
            </div>
          ) : (
            <>
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Modo Reordenar:</strong> Arrastra y suelta las
                  publicaciones para cambiar su orden de programación. Los
                  cambios se guardarán automáticamente.
                </p>
              </div>
              <DraggableQueue
                posts={posts.map((post) => ({
                  id: post.id,
                  title: post.title || "Sin título",
                  baseText: post.content,
                  scheduledAt: post.scheduledAt || new Date(),
                  status: post.status,
                  platforms: post.platforms,
                }))}
                onPostClick={(postId) => {
                  const post = posts.find((p) => p.id === postId);
                  if (post) {
                    onPostClick(postId, {
                      title: post.title,
                      baseContent: post.content,
                    });
                  }
                }}
                onReorder={handleReorder}
              />
            </>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando cola de publicaciones...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-600 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay publicaciones en la cola
              </h3>
              <p className="text-gray-600">
                No se encontraron publicaciones con los filtros aplicados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedPosts.size === posts.length &&
                          posts.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contenido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plataformas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedPosts.has(post.id)}
                          onChange={() => handleSelectPost(post.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-600">
                          {truncateText(post.content)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {post.platforms.map((platform) => (
                            <span
                              key={platform}
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG].color}`}
                            >
                              {
                                PLATFORM_CONFIG[
                                  platform as keyof typeof PLATFORM_CONFIG
                                ].emoji
                              }
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.scheduledAt
                          ? format(post.scheduledAt, "dd/MM/yyyy HH:mm", {
                              locale: es,
                            })
                          : "No programado"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[post.status].color}`}
                        >
                          {STATUS_CONFIG[post.status].icon}
                          <span className="ml-1">
                            {STATUS_CONFIG[post.status].label}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() =>
                            onPostClick(post.id, {
                              title: post.title,
                              baseContent: post.content,
                            })
                          }
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            setPosts((prev) =>
                              prev.filter((p) => p.id !== post.id),
                            );
                            setSelectedPosts((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(post.id);
                              return newSet;
                            });
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
