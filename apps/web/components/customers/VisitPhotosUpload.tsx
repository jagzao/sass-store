"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type VisitPhotoType = "BEFORE" | "AFTER";

export interface VisitPhoto {
  url: string;
  type: VisitPhotoType;
  file?: File; // Optional for new uploads before they are saved
}

interface VisitPhotosUploadProps {
  photos: VisitPhoto[];
  onChange: (photos: VisitPhoto[]) => void;
}

export default function VisitPhotosUpload({
  photos,
  onChange,
}: VisitPhotosUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeType, setActiveType] = useState<VisitPhotoType>("BEFORE");

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPhotos: VisitPhoto[] = [];

    // Mock upload or real upload logic here
    // For now, we simulate a "local preview" URL
    // In a real app, you'd upload here and get a remote URL

    // We will simulate upload for now to keep it UI-functional
    const processFile = async (file: File) => {
      // Ideally: const url = await uploadFile(file);
      // Mock:
      const url = URL.createObjectURL(file);
      return { url, type: activeType, file };
    };

    try {
      for (let i = 0; i < files.length; i++) {
        const photo = await processFile(files[i]);
        newPhotos.push(photo);
      }
      onChange([...photos, ...newPhotos]);
    } catch (error) {
      console.error("Error processing photos:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    onChange(newPhotos);
  };

  const triggerUpload = (type: VisitPhotoType) => {
    setActiveType(type);
    fileInputRef.current?.click();
  };

  const beforePhotos = photos.filter((p) => p.type === "BEFORE");
  const afterPhotos = photos.filter((p) => p.type === "AFTER");

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before Photos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">Antes</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => triggerUpload("BEFORE")}
              disabled={uploading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {beforePhotos.length === 0 && (
              <div className="col-span-2 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
                <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                <span className="text-xs">Sin fotos</span>
              </div>
            )}
            {beforePhotos.map((photo, idx) => (
              <div
                key={`before-${idx}`}
                className="relative group aspect-square rounded-md overflow-hidden border bg-muted max-w-[200px] max-h-[200px]"
              >
                <img
                  src={photo.url}
                  alt="Before"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(photos.indexOf(photo))}
                  className="absolute top-1 right-1 bg-destructive/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* After Photos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">
              Después
            </h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => triggerUpload("AFTER")}
              disabled={uploading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {afterPhotos.length === 0 && (
              <div className="col-span-2 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
                <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                <span className="text-xs">Sin fotos</span>
              </div>
            )}
            {afterPhotos.map((photo, idx) => (
              <div
                key={`after-${idx}`}
                className="relative group aspect-square rounded-md overflow-hidden border bg-muted max-w-[200px] max-h-[200px]"
              >
                <img
                  src={photo.url}
                  alt="After"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(photos.indexOf(photo))}
                  className="absolute top-1 right-1 bg-destructive/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
