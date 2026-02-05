"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Post {
  id: string;
  title: string;
  content: string;
  status: string;
  scheduledAt: string;
  platforms: string[];
}

interface DayDetailsModalProps {
  tenant: string;
  date: Date;
  isOpen: boolean;
  onClose: () => void;
  onEditPost: (postId: string) => void;
  onCreatePost: (date: Date) => void;
  variant?: "default" | "tech";
}

const PLATFORM_ICONS: Record<string, string> = {
  facebook: "📘",
  instagram: "📷",
  twitter: "🐦",
  tiktok: "🎵",
  youtube: "▶️",
  linkedin: "💼",
  gbp: "🏢",
  threads: "🧵",
  x: "🐦",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  scheduled: "Programado",
  published: "Publicado",
  failed: "Fallido",
  canceled: "Cancelado",
};

export default function DayDetailsModal({
  tenant,
  date,
  isOpen,
  onClose,
  onEditPost,
  onCreatePost,
  variant = "default",
}: DayDetailsModalProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && date) {
      const fetchPosts = async () => {
        setIsLoading(true);
        try {
          // Construct start and end of day in UTC roughly, or just pass date to filter
          // Ideally backend handles timezone, but for now we filter by day range locally or via params
          // Using yyyy-MM-dd params as seen in other API calls
          const dateStr = format(date, "yyyy-MM-dd");
          const params = new URLSearchParams({
            tenant,
            start_date: `${dateStr}T00:00:00`,
            end_date: `${dateStr}T23:59:59`,
          });

          const response = await fetch(`/api/v1/social/queue?${params}`);
          if (!response.ok) throw new Error("Failed to fetch posts");

          const result = await response.json();
          setPosts(result.data || []);
        } catch (error) {
          console.error("Error fetching posts for day:", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchPosts();
    }
  }, [isOpen, date, tenant]);

  if (!isOpen) return null;

  const isTech = variant === "tech";

  const styles = {
    overlay: "bg-black bg-opacity-50",
    modal: isTech ? "bg-[#111111] border border-gray-800" : "bg-white",
    text: isTech ? "text-gray-200" : "text-gray-900",
    textSecondary: isTech ? "text-gray-400" : "text-gray-500",
    headerBorder: isTech
      ? "border-b border-gray-800"
      : "border-b border-gray-200",
    closeBtn: isTech
      ? "text-gray-400 hover:text-white"
      : "text-gray-400 hover:text-gray-600",
    emptyState: isTech ? "bg-white/5" : "bg-gray-50",
    postItem: isTech
      ? "bg-[#1a1a1a] border-gray-800 hover:border-[#FF8000]/50 hover:bg-[#FF8000]/5"
      : "bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50",
    statusBadge: (status: string) => {
      if (isTech) {
        switch (status) {
          case "published":
            return "bg-green-900/30 text-green-400 border border-green-900";
          case "scheduled":
            return "bg-blue-900/30 text-blue-400 border border-blue-900";
          case "failed":
            return "bg-red-900/30 text-red-400 border border-red-900";
          default:
            return "bg-yellow-900/30 text-yellow-400 border border-yellow-900";
        }
      }
      switch (status) {
        case "published":
          return "bg-green-100 text-green-800";
        case "scheduled":
          return "bg-blue-100 text-blue-800";
        case "failed":
          return "bg-red-100 text-red-800";
        default:
          return "bg-yellow-100 text-yellow-800";
      }
    },
    addButton: isTech
      ? "bg-[#FF8000] hover:bg-[#FF8000]/90 text-black"
      : "bg-blue-600 hover:bg-blue-700 text-white",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className={`absolute inset-0 ${styles.overlay}`} onClick={onClose} />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-lg rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh] ${styles.modal}`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between ${styles.headerBorder}`}
        >
          <div>
            <h3 className={`text-lg font-semibold ${styles.text}`}>
              {format(date, "EEEE, d 'de' MMMM", { locale: es })}
            </h3>
            <p className={`text-sm ${styles.textSecondary}`}>
              {posts.length} publicación{posts.length !== 1 ? "es" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full hover:bg-white/10 ${styles.closeBtn}`}
          >
            <svg
              className="w-6 h-6"
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div
                className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isTech ? "border-[#FF8000]" : "border-blue-600"}`}
              ></div>
            </div>
          ) : posts.length === 0 ? (
            <div
              className={`text-center py-10 rounded-lg ${styles.emptyState}`}
            >
              <p className={styles.textSecondary}>
                No hay publicaciones programadas para este día
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                onClick={() => onEditPost(post.id)}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${styles.postItem}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex space-x-1">
                    {post.platforms.map((p) => (
                      <span key={p} title={p} className="text-lg">
                        {PLATFORM_ICONS[p] || "📱"}
                      </span>
                    ))}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${styles.statusBadge(post.status)}`}
                  >
                    {STATUS_LABELS[post.status] || post.status}
                  </span>
                </div>

                <h4 className={`font-medium mb-1 line-clamp-1 ${styles.text}`}>
                  {post.title || "Sin título"}
                </h4>
                <p className={`text-sm line-clamp-2 ${styles.textSecondary}`}>
                  {post.content}
                </p>

                <div className={`mt-2 text-xs ${styles.textSecondary}`}>
                  {post.scheduledAt
                    ? format(new Date(post.scheduledAt), "HH:mm")
                    : "Hora no definida"}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 ${styles.headerBorder} border-t`}>
          <button
            onClick={() => onCreatePost(date)}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${styles.addButton}`}
          >
            Crear nueva publicación
          </button>
        </div>
      </div>
    </div>
  );
}
