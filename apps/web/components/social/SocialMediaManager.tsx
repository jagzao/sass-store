"use client";

import { useState } from "react";
import SocialNavigation from "./SocialNavigation";
import EditorDrawer, { InitialData } from "./EditorDrawer";
import CalendarView from "./views/CalendarView";
import QueueView from "./views/QueueView";
import GenerateView from "./views/GenerateView";
import LibraryView from "./views/LibraryView";
import AnalyticsView from "./views/AnalyticsView";

type ViewType = "calendar" | "queue" | "generate" | "library" | "analytics";

interface SocialMediaManagerProps {
  tenant: string;
  variant?: "default" | "tech";
}

import TokenManagementModal from "./TokenManagementModal";

// ... (imports remain)

export default function SocialMediaManager({
  tenant,
  variant = "default",
}: SocialMediaManagerProps) {
  const [activeView, setActiveView] = useState<ViewType>("calendar");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostData, setSelectedPostData] = useState<
    InitialData | undefined
  >(undefined);

  const handleCreateNew = () => {
    setSelectedPostId(null);
    setSelectedPostData(undefined);
    setIsEditorOpen(true);
  };

  const handleManageTokens = () => {
    setIsTokenModalOpen(true);
  };

  const handlePostClick = (postId: string, data?: InitialData) => {
    if (postId === "new-post") {
      setSelectedPostId(null);
    } else {
      setSelectedPostId(postId);
    }
    setSelectedPostData(data);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedPostId(null);
    setSelectedPostData(undefined);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "calendar":
        return (
          <CalendarView
            tenant={tenant}
            onPostClick={handlePostClick}
            variant={variant}
          />
        );
      case "queue":
        return (
          <QueueView
            tenant={tenant}
            onPostClick={handlePostClick}
            variant={variant}
          />
        );
      case "generate":
        return <GenerateView tenant={tenant} />;
      case "library":
        return (
          <LibraryView
            tenant={tenant}
            onContentSelect={handlePostClick}
            onCreateNew={handleCreateNew}
          />
        );
      case "analytics":
        return <AnalyticsView tenant={tenant} onPostClick={handlePostClick} />;
      default:
        return <CalendarView tenant={tenant} onPostClick={handlePostClick} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <SocialNavigation
          activeView={activeView}
          onViewChange={setActiveView}
          onCreateNew={handleCreateNew}
          onManageTokens={handleManageTokens}
        />

        <div className="p-6">{renderActiveView()}</div>
      </div>

      {/* Editor Drawer */}
      {isEditorOpen && (
        <EditorDrawer
          tenant={tenant}
          isOpen={isEditorOpen}
          onClose={handleCloseEditor}
          postId={selectedPostId}
          initialData={selectedPostData}
          variant={variant}
        />
      )}

      {/* Token Management Modal */}
      {isTokenModalOpen && (
        <TokenManagementModal
          tenant={tenant}
          isOpen={isTokenModalOpen}
          onClose={() => setIsTokenModalOpen(false)}
          variant={variant}
        />
      )}
    </div>
  );
}
