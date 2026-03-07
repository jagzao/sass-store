"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList, type: VisitPhotoType) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPhotos: VisitPhoto[] = [];

    const processFile = async (file: File) => {
      const url = URL.createObjectURL(file);
      return { url, type, file };
    };

    try {
      for (let i = 0; i < files.length; i++) {
        const photo = await processFile(files[i]);
        newPhotos.push(photo);
      }
      onChange([...photos, ...newPhotos]);
    } catch {
      // noop
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange =
    (type: VisitPhotoType) => async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      await processFiles(files, type);
      e.target.value = "";
    };

  const handleRemove = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    onChange(newPhotos);
  };

  const onDrop =
    (type: VisitPhotoType) => async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.dataTransfer.files?.length) {
        await processFiles(e.dataTransfer.files, type);
      }
    };

  const beforePhotos = photos.filter((p) => p.type === "BEFORE");
  const afterPhotos = photos.filter((p) => p.type === "AFTER");

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={beforeInputRef}
        onChange={handleFileChange("BEFORE")}
        accept="image/*"
        multiple
        className="hidden"
      />

      <input
        type="file"
        ref={afterInputRef}
        onChange={handleFileChange("AFTER")}
        accept="image/*"
        multiple
        className="hidden"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before Photos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">
              Clienta
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {beforePhotos.length === 0 && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => beforeInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop("BEFORE")}
                className={cn(
                  "col-span-2 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground bg-muted/30 cursor-pointer transition-colors",
                  "hover:bg-muted/50 hover:border-[#C5A059]/60",
                )}
              >
                <Upload className="h-8 w-8 mb-2 opacity-60" />
                <span className="text-xs">Arrastra o haz click para subir</span>
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
              Resultado
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {afterPhotos.length === 0 && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => afterInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop("AFTER")}
                className={cn(
                  "col-span-2 border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground bg-muted/30 cursor-pointer transition-colors",
                  "hover:bg-muted/50 hover:border-[#C5A059]/60",
                )}
              >
                <Upload className="h-8 w-8 mb-2 opacity-60" />
                <span className="text-xs">Arrastra o haz click para subir</span>
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
