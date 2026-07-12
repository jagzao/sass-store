"use client";

import { useState } from "react";
import { PostComposer } from "@/components/social-planner/post-composer";
import { SocialCalendar } from "@/components/social-planner/social-calendar";
import { PostsList } from "@/components/social-planner/posts-list";
import { ScheduleTimeline } from "@/components/social-planner/schedule-timeline";
import { Calendar, ListOrdered, FileText, Plus } from "lucide-react";

type ViewMode = "calendar" | "timeline" | "posts" | "compose";

export default function SocialPlannerPage() {
  const [currentView, setCurrentView] = useState<ViewMode>("calendar");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleCreatePost = () => {
    setCurrentView("compose");
  };

  const handlePostCreated = () => {
    setCurrentView("calendar");
    // Refresh data would happen here
  };

  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const handleEditPost = (postId: string) => {
    setEditingPostId(postId);
    setCurrentView("compose");
  };

  const handlePostEdited = () => {
    setEditingPostId(null);
    setCurrentView("posts");
    // Refresh data would happen here
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setCurrentView("posts");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Social Planner
              </h1>
              <p className="text-gray-600">
                Gestiona tu contenido en redes sociales
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentView("calendar")}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === "calendar"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Calendar className="h-4 w-4" />{" "}
                  <span className="hidden sm:inline">Calendario</span>
                </button>
                <button
                  onClick={() => setCurrentView("timeline")}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === "timeline"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <ListOrdered className="h-4 w-4" />{" "}
                  <span className="hidden sm:inline">Timeline</span>
                </button>
                <button
                  onClick={() => setCurrentView("posts")}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentView === "posts"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <FileText className="h-4 w-4" />{" "}
                  <span className="hidden sm:inline">Posts</span>
                </button>
              </div>

              {/* Create Post Button */}
              <button
                onClick={handleCreatePost}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 h-10 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Crear Post</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {currentView === "compose" && (
          <PostComposer
            onCancel={handleCancelEdit}
            onSuccess={editingPostId ? handlePostEdited : handlePostCreated}
            initialDate={selectedDate}
            postIdToEdit={editingPostId}
          />
        )}

        {currentView === "calendar" && (
          <SocialCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onCreatePost={handleCreatePost}
          />
        )}

        {currentView === "timeline" && <ScheduleTimeline />}

        {currentView === "posts" && <PostsList onEditPost={handleEditPost} />}
      </div>
    </div>
  );
}
