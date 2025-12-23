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
              <button className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-opacity">
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
    </div>
  );
}
