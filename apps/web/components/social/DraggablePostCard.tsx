"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Post {
  id: string;
  title: string;
  baseText: string;
  scheduledAt: Date;
  status: string;
  platforms: string[];
}

interface DraggablePostCardProps {
  post: Post;
  onClick: (postId: string) => void;
}

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

export default function DraggablePostCard({
  post,
  onClick,
}: DraggablePostCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusConfig =
    STATUS_CONFIG[post.status as keyof typeof STATUS_CONFIG] ||
    STATUS_CONFIG.draft;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border p-4 hover:shadow-md transition-all cursor-move ${
        isDragging ? "shadow-lg" : ""
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1" onClick={() => onClick(post.id)}>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
            >
              {statusConfig.icon} {statusConfig.label}
            </span>
            <span className="text-xs text-gray-500">
              {format(new Date(post.scheduledAt), "dd/MM/yyyy HH:mm", {
                locale: es,
              })}
            </span>
          </div>

          <h3 className="font-medium text-gray-900 mb-2">
            {post.title || "Sin título"}
          </h3>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {post.baseText}
          </p>

          <div className="flex flex-wrap gap-2">
            {post.platforms.map((platform) => (
              <span
                key={platform}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]
                    ?.color || "bg-gray-100 text-gray-800"
                }`}
              >
                {PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]
                  ?.emoji || "📱"}{" "}
                {PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]
                  ?.name || platform}
              </span>
            ))}
          </div>
        </div>

        <div className="ml-4 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(post.id);
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
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>

          <div className="cursor-move text-gray-400">
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
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
