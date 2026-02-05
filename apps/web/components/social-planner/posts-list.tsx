"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import FormSelect from "@/components/ui/forms/FormSelect";

const PLATFORM_CONFIG = {
  facebook: { emoji: "📘", name: "Facebook", color: "text-blue-600" },
  instagram: { emoji: "📷", name: "Instagram", color: "text-pink-600" },
  linkedin: { emoji: "💼", name: "LinkedIn", color: "text-blue-700" },
  x: { emoji: "🐦", name: "X", color: "text-black" },
  tiktok: { emoji: "🎵", name: "TikTok", color: "text-black" },
  gbp: { emoji: "🏢", name: "Google Business", color: "text-green-600" },
  threads: { emoji: "🧵", name: "Threads", color: "text-gray-900" },
};

const STATUS_CONFIG = {
  draft: { label: "Borrador", color: "bg-yellow-100 text-yellow-800" },
  scheduled: { label: "Programado", color: "bg-blue-100 text-blue-800" },
  published: { label: "Publicado", color: "bg-green-100 text-green-800" },
  failed: { label: "Fallido", color: "bg-red-100 text-red-800" },
  canceled: { label: "Cancelado", color: "bg-gray-100 text-gray-800" },
};

interface PostsListProps {
  onEditPost: (postId: string) => void;
}

interface PostTarget {
  platform: string;
  status: string;
  accountId?: string;
  platformPostId?: string;
  publishedAt?: string;
}

interface SocialPost {
  id: string;
  title?: string;
  baseText: string;
  status: keyof typeof STATUS_CONFIG;
  scheduledAtUtc?: string;
  timezone: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

const PostsListComponent = ({ onEditPost }: PostsListProps) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [targets, setTargets] = useState<Record<string, PostTarget[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
    page: 1,
  });
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: "20",
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.startDate) params.append("start_date", filters.startDate);
      if (filters.endDate) params.append("end_date", filters.endDate);

      const response = await fetch(`/api/v1/social/posts?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const result = await response.json();
      setPosts(result.data || []);
      setTotalPages(result.meta?.totalPages || 1);

      // Fetch targets for each post
      const targetsData: Record<string, PostTarget[]> = {};
      await Promise.all(
        (result.data || []).map(async (post: SocialPost) => {
          try {
            const targetsResponse = await fetch(
              `/api/v1/social/posts/${post.id}/targets`,
            );
            if (targetsResponse.ok) {
              const targetsResult = await targetsResponse.json();
              targetsData[post.id] = targetsResult.data || [];
            }
          } catch (error) {
            console.error(`Error fetching targets for post ${post.id}:`, error);
            targetsData[post.id] = [];
          }
        }),
      );

      setTargets(targetsData);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPosts();
  }, [filters, fetchPosts]);

  const handleDeletePost = async (postId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este post?")) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/social/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      // Refresh the list
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Error al eliminar el post");
    }
  };

  const truncateText = useCallback((text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }, []);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Estado
            </label>
            <FormSelect
              id="status-filter"
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                  page: 1,
                }))
              }
              selectClassName="w-full text-sm"
              options={[
                { value: "", label: "Todos los estados" },
                ...Object.entries(STATUS_CONFIG).map(([status, config]) => ({
                  value: status,
                  label: config.label,
                })),
              ]}
            />
          </div>

          <div>
            <label
              htmlFor="start-date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Desde
            </label>
            <input
              type="date"
              id="start-date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                  page: 1,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="end-date"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Hasta
            </label>
            <input
              type="date"
              id="end-date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                  page: 1,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({ status: "", startDate: "", endDate: "", page: 1 })
              }
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <div className="text-gray-600 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay posts
            </h3>
            <p className="text-gray-600">
              No se encontraron posts con los filtros aplicados.
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[post.status].color}`}
                    >
                      {STATUS_CONFIG[post.status].label}
                    </span>

                    {post.scheduledAtUtc && (
                      <span className="text-sm text-gray-500">
                        📅{" "}
                        {format(
                          new Date(post.scheduledAtUtc),
                          "dd/MM/yyyy HH:mm",
                          { locale: es },
                        )}
                      </span>
                    )}
                  </div>

                  {post.title && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h3>
                  )}

                  <p className="text-gray-700 mb-4">
                    {truncateText(post.baseText)}
                  </p>

                  {/* Platforms */}
                  {targets[post.id] && targets[post.id].length > 0 && (
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-sm font-medium text-gray-600">
                        Plataformas:
                      </span>
                      <div className="flex items-center space-x-2">
                        {targets[post.id].map((target, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1"
                          >
                            <span>
                              {PLATFORM_CONFIG[
                                target.platform as keyof typeof PLATFORM_CONFIG
                              ]?.emoji || "📱"}
                            </span>
                            <span className="text-xs font-medium">
                              {PLATFORM_CONFIG[
                                target.platform as keyof typeof PLATFORM_CONFIG
                              ]?.name || target.platform}
                            </span>
                            <span
                              className={`text-xs px-1 py-0.5 rounded ${STATUS_CONFIG[target.status as keyof typeof STATUS_CONFIG]?.color || "bg-gray-100 text-gray-800"}`}
                            >
                              {STATUS_CONFIG[
                                target.status as keyof typeof STATUS_CONFIG
                              ]?.label || target.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-500">
                    Creado{" "}
                    {format(new Date(post.createdAt), "dd/MM/yyyy HH:mm", {
                      locale: es,
                    })}
                    {post.createdBy && ` por ${post.createdBy}`}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onEditPost(post.id)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar post"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar post"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página {filters.page} de {totalPages}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={filters.page === 1}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>

              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    page: Math.min(totalPages, prev.page + 1),
                  }))
                }
                disabled={filters.page === totalPages}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

PostsListComponent.displayName = "PostsList";

export const PostsList = memo(PostsListComponent);
