"use client";

import { useEffect, useRef, useState } from "react";
import {
  Upload,
  X,
  GripVertical,
  Image as ImageIcon,
  Video,
  Loader2,
} from "lucide-react";

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
}

interface MediaUploaderProps {
  tenant: string;
  mediaUrls: string[];
  mediaIds: string[];
  onMediaChange: (urls: string[], ids: string[]) => void;
  maxFiles?: number;
  acceptTypes?: string[];
  variant?: "default" | "tech";
  disabled?: boolean;
}

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".mkv", ".avi"];

const inferMediaType = (url: string): "image" | "video" => {
  if (url.startsWith("data:video")) {
    return "video";
  }

  const lowerUrl = url.toLowerCase();
  if (VIDEO_EXTENSIONS.some((ext) => lowerUrl.includes(ext))) {
    return "video";
  }

  return "image";
};

export default function MediaUploader({
  tenant,
  mediaUrls,
  mediaIds,
  onMediaChange,
  maxFiles = 10,
  acceptTypes = ["image/*", "video/*"],
  variant = "default",
  disabled = false,
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mediaUrls.length === 0 || mediaIds.length === 0) {
      setMediaItems([]);
      return;
    }

    if (mediaUrls.length !== mediaIds.length) {
      return;
    }

    const items = mediaUrls.map((url, index) => ({
      id: mediaIds[index],
      url,
      type: inferMediaType(url),
    }));

    setMediaItems(items);
  }, [mediaUrls, mediaIds]);

  const styles = {
    text: variant === "tech" ? "text-gray-200" : "text-gray-900",
    textSecondary: variant === "tech" ? "text-gray-400" : "text-gray-500",
    border: variant === "tech" ? "border-gray-800" : "border-gray-200",
    dragActive: variant === "tech" ? "border-[#FF8000]" : "border-blue-500",
    cardBg: variant === "tech" ? "bg-[#1a1a1a]" : "bg-gray-50",
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(event.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files || []);
    await handleFiles(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFiles = async (files: File[]) => {
    setError(null);

    if (files.length === 0) {
      return;
    }

    const remainingSlots = maxFiles - mediaItems.length;
    if (files.length > remainingSlots) {
      setError(
        `Solo puedes agregar ${remainingSlots} archivos más (máximo ${maxFiles}).`,
      );
      return;
    }

    const invalidFiles = files.filter(
      (file) =>
        !file.type.startsWith("image/") && !file.type.startsWith("video/"),
    );
    if (invalidFiles.length > 0) {
      setError("Solo se permiten imágenes y videos.");
      return;
    }

    const oversizedFiles = files.filter((file) => {
      const isVideo = file.type.startsWith("video/");
      const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      return file.size > maxSize;
    });

    if (oversizedFiles.length > 0) {
      setError(
        "Algunos archivos exceden el tamaño máximo (5MB imágenes, 50MB videos).",
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedItems: MediaItem[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tenant", tenant);
        formData.append("assetType", "social");

        const response = await fetch("/api/v1/social/media/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          const message = result?.error?.message || "Failed to upload file";
          throw new Error(message);
        }

        uploadedItems.push({
          id: result.data.mediaId,
          url: result.data.url,
          type: file.type.startsWith("video/") ? "video" : "image",
        });

        setUploadProgress(Math.round(((index + 1) / files.length) * 100));
      }

      const newItems = [...mediaItems, ...uploadedItems];
      setMediaItems(newItems);
      onMediaChange(
        newItems.map((item) => item.url),
        newItems.map((item) => item.id),
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Error al subir archivos.",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveMedia = (index: number) => {
    const newItems = mediaItems.filter((_, itemIndex) => itemIndex !== index);
    setMediaItems(newItems);
    onMediaChange(
      newItems.map((item) => item.url),
      newItems.map((item) => item.id),
    );
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newItems = [...mediaItems];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    setMediaItems(newItems);
    onMediaChange(
      newItems.map((item) => item.url),
      newItems.map((item) => item.id),
    );
  };

  return (
    <div className={`space-y-4 ${styles.text}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          isDragging ? styles.dragActive : styles.border
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptTypes.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <Upload className={`mx-auto h-10 w-10 mb-3 ${styles.textSecondary}`} />
        <p className={`text-sm font-medium ${styles.text}`}>
          Arrastra imágenes o videos aquí
        </p>
        <p className={`text-xs ${styles.textSecondary}`}>
          o haz clic para seleccionar archivos
        </p>
        <p className={`text-xs mt-2 ${styles.textSecondary}`}>
          Máximo {maxFiles} archivos • 5MB imágenes, 50MB videos
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      {isUploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Subiendo archivos...
            </div>
            <span className="text-sm text-blue-600">
              {Math.round(uploadProgress)}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {mediaItems.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-medium ${styles.text}`}>
              Contenido multimedia
            </h3>
            <span className={`text-xs ${styles.textSecondary}`}>
              {mediaItems.length}/{maxFiles} items
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {mediaItems.map((item, index) => (
              <div
                key={item.id}
                className={`relative rounded-lg overflow-hidden border ${styles.border} ${styles.cardBg}`}
                draggable={!disabled}
                onDragStart={() => setDragIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (dragIndex === null) return;
                  handleReorder(dragIndex, index);
                  setDragIndex(null);
                }}
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={`Media ${index + 1}`}
                    className="w-full aspect-square object-cover"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
                    <Video className="h-10 w-10 text-gray-400" />
                  </div>
                )}

                <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                  {item.type === "image" ? (
                    <span className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      IMG
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      VID
                    </span>
                  )}
                </div>

                <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded">
                  {index + 1}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveMedia(index)}
                  className="absolute bottom-2 right-2 bg-red-600 text-white p-1 rounded"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="absolute bottom-2 left-2 bg-black/70 text-white p-1 rounded">
                  <GripVertical className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
