"use client";

import { useState } from "react";

interface SocialNavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
  onCreateNew: () => void;
}

const TABS = [
  { id: "calendar", label: "Calendario", icon: "📅" },
  { id: "queue", label: "Cola", icon: "📋" },
  { id: "generate", label: "Generar", icon: "🤖" },
  { id: "library", label: "Biblioteca", icon: "📚" },
  { id: "analytics", label: "Analytics", icon: "📊" },
];

export default function SocialNavigation({
  activeView,
  onViewChange,
  onCreateNew,
}: SocialNavigationProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Navigation Tabs */}
          <nav className="flex space-x-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={`
                  inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors
                  ${
                    activeView === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Create Button */}
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg
              className="mr-2 h-5 w-5"
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
            Crear
          </button>
        </div>
      </div>
    </div>
  );
}
