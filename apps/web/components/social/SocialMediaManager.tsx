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
}

export default function SocialMediaManager({
  tenant,
}: SocialMediaManagerProps) {
  const [activeView, setActiveView] = useState<ViewType>("calendar");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostData, setSelectedPostData] = useState<
    InitialData | undefined
  >(undefined);

  const handleCreateNew = () => {
    setSelectedPostId(null);
    setSelectedPostData(undefined);
    setIsEditorOpen(true);
  };

  const handlePostClick = (postId: string, data?: InitialData) => {
    setSelectedPostId(postId);
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
        return <CalendarView onPostClick={handlePostClick} />;
      case "queue":
        return <QueueView onPostClick={handlePostClick} />;
      case "generate":
        return <GenerateView />;
      case "library":
        return (
          <LibraryView
            onContentSelect={handlePostClick}
            onCreateNew={handleCreateNew}
          />
        );
      case "analytics":
        return <AnalyticsView onPostClick={handlePostClick} />;
      default:
        return <CalendarView onPostClick={handlePostClick} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <SocialNavigation
          activeView={activeView}
          onViewChange={setActiveView}
          onCreateNew={handleCreateNew}
        />

        <div className="p-6">{renderActiveView()}</div>
      </div>

      {/* Editor Drawer */}
      {isEditorOpen && (
        <EditorDrawer
          isOpen={isEditorOpen}
          onClose={handleCloseEditor}
          postId={selectedPostId}
          initialData={selectedPostData}
        />
      )}
    </div>
  );
}
