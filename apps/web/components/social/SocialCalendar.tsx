"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";

interface Post {
  id: string;
  platform:
    | "facebook"
    | "instagram"
    | "twitter"
    | "tiktok"
    | "youtube"
    | "linkedin";
  content: string;
  date: Date;
  status: "published" | "scheduled" | "failed";
}

const PLATFORM_ICONS: Record<string, string> = {
  facebook: "📘",
  instagram: "📷",
  twitter: "🐦",
  tiktok: "🎵",
  youtube: "▶️",
  linkedin: "💼",
};

const STATUS_COLORS: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700",
};

export default function SocialCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newPost, setNewPost] = useState({
    platform: "facebook" as Post["platform"],
    content: "",
  });

  // Mock Data
  const posts: Post[] = [
    {
      id: "1",
      platform: "facebook",
      content: "¡Nuevo servicio disponible!",
      date: new Date(),
      status: "published",
    },
    {
      id: "2",
      platform: "instagram",
      content: "Antes y después",
      date: new Date(),
      status: "published",
    },
    {
      id: "3",
      platform: "facebook",
      content: "Promoción especial 20%",
      date: new Date(new Date().setDate(new Date().getDate() + 1)), // Mañana
      status: "scheduled",
    },
    {
      id: "4",
      platform: "tiktok",
      content: "Tendencias de uñas 2026",
      date: new Date(new Date().setDate(new Date().getDate() + 3)),
      status: "scheduled",
    },
    {
      id: "5",
      platform: "linkedin",
      content: "Buscamos manicurista experta",
      date: new Date(new Date().setDate(new Date().getDate() - 2)),
      status: "published",
    },
  ];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const handleAddPost = (date: Date) => {
    setSelectedDate(date);
    setNewPost({ platform: "facebook", content: "" });
    setIsModalOpen(true);
  };

  const handleEditPost = (post: Post) => {
    setSelectedDate(post.date);
    setNewPost({ platform: post.platform, content: post.content });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setNewPost({ platform: "facebook", content: "" });
  };

  const handleSavePost = () => {
    // TODO: Implement save to backend
    console.log("Saving post:", {
      date: selectedDate,
      ...newPost,
    });
    handleCloseModal();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800 capitalize">
          {format(currentDate, "MMMM yyyy", { locale: es })}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
          >
            ←
          </button>
          <button
            onClick={today}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 font-medium"
          >
            Hoy
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
          >
            →
          </button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-semibold text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day, dayIdx) => {
          const dayPosts = posts.filter((post) => isSameDay(post.date, day));
          return (
            <div
              key={day.toString()}
              className={`min-h-[120px] p-2 border-b border-r relative group ${
                !isSameMonth(day, monthStart)
                  ? "bg-gray-50 text-gray-400"
                  : "bg-white"
              } ${isSameDay(day, new Date()) ? "bg-blue-50/30" : ""}`}
            >
              <div className="flex justify-between items-start">
                <span
                  className={`text-sm font-medium ${
                    isSameDay(day, new Date())
                      ? "bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center"
                      : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="mt-1 space-y-1">
                {dayPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handleEditPost(post)}
                    className={`text-xs p-1 rounded border truncate cursor-pointer transition-transform hover:scale-105 ${
                      STATUS_COLORS[post.status]
                    }`}
                  >
                    <span className="mr-1">
                      {PLATFORM_ICONS[post.platform]}
                    </span>
                    {post.content}
                  </div>
                ))}
              </div>

              {/* Add Button on Hover */}
              <button
                onClick={() => handleAddPost(day)}
                className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-opacity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
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
          );
        })}
      </div>

      {/* Modal for Add/Edit Post */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedDate
                  ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })
                  : "Nueva Publicación"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plataforma
                </label>
                <select
                  value={newPost.platform}
                  onChange={(e) =>
                    setNewPost({
                      ...newPost,
                      platform: e.target.value as Post["platform"],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="facebook">📘 Facebook</option>
                  <option value="instagram">📷 Instagram</option>
                  <option value="twitter">🐦 Twitter</option>
                  <option value="tiktok">🎵 TikTok</option>
                  <option value="youtube">▶️ YouTube</option>
                  <option value="linkedin">💼 LinkedIn</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) =>
                    setNewPost({ ...newPost, content: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
                  placeholder="Escribe tu publicación aquí..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePost}
                  disabled={!newPost.content.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
