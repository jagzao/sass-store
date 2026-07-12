"use client";

import { useState } from "react";
import {
  Calendar,
  ListOrdered,
  Sparkles,
  Library,
  BarChart3,
  KeyRound,
  Plus,
} from "lucide-react";

interface SocialNavigationProps {
  activeView: string;
  onViewChange: (view: any) => void;
  onCreateNew: () => void;
  onManageTokens: () => void;
}

const TABS = [
  { id: "calendar", label: "Calendario", Icon: Calendar },
  { id: "queue", label: "Cola", Icon: ListOrdered },
  { id: "generate", label: "Generar", Icon: Sparkles },
  { id: "library", label: "Biblioteca", Icon: Library },
  { id: "analytics", label: "Analytics", Icon: BarChart3 },
];

export default function SocialNavigation({
  activeView,
  onViewChange,
  onCreateNew,
  onManageTokens,
}: SocialNavigationProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Navigation Tabs — scrollable on mobile */}
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  activeView === id
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onManageTokens}
              className="inline-flex items-center gap-1.5 px-2 sm:px-3 h-9 sm:h-10 text-xs sm:text-sm font-medium rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <KeyRound className="h-4 w-4" />
              <span className="hidden sm:inline">Cuentas</span>
            </button>

            <button
              onClick={onCreateNew}
              className="inline-flex items-center gap-1.5 px-2 sm:px-4 h-9 sm:h-10 text-xs sm:text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Crear</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
