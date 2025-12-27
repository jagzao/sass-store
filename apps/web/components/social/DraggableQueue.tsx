"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import DraggablePostCard from "./DraggablePostCard";

interface Post {
  id: string;
  title: string;
  baseText: string;
  scheduledAt: Date;
  status: string;
  platforms: string[];
}

interface DraggableQueueProps {
  posts: Post[];
  onPostClick: (postId: string) => void;
  onReorder?: (posts: Post[]) => void;
}

export default function DraggableQueue({
  posts: initialPosts,
  onPostClick,
  onReorder,
}: DraggableQueueProps) {
  const [posts, setPosts] = useState(initialPosts);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = posts.findIndex((post) => post.id === active.id);
      const newIndex = posts.findIndex((post) => post.id === over.id);

      const newPosts = arrayMove(posts, oldIndex, newIndex);
      setPosts(newPosts);

      // Call the onReorder callback if provided
      if (onReorder) {
        onReorder(newPosts);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={posts} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay publicaciones
              </h3>
              <p className="text-gray-600">
                Genera contenido con IA o crea una publicación manualmente.
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <DraggablePostCard
                key={post.id}
                post={post}
                onClick={onPostClick}
              />
            ))
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}
