"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SingleImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function SingleImageUpload({
  value,
  onChange,
  disabled,
  label = "Imagen",
  className,
}: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona una imagen válida.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "services"); // Default folder

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Upload failed: ${response.status} ${response.statusText}`,
          errorText,
        );
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      onChange(data.url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onChange("");
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || uploading}
      />

      {!value || value === null || value === undefined ? (
        <div
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors",
            (disabled || uploading) && "opacity-50 cursor-not-allowed",
          )}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
          ) : (
            <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
          )}
          <span className="text-sm text-gray-500">
            {uploading ? "Subiendo..." : "Click para subir imagen"}
          </span>
        </div>
      ) : (
        <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-gray-200 group">
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          {!disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
