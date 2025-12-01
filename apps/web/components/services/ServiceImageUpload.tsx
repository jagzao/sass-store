"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ServiceImageUploadProps {
  beforeImage?: string;
  afterImage?: string;
  onBeforeImageChange: (url: string | null) => void;
  onAfterImageChange: (url: string | null) => void;
}

export default function ServiceImageUpload({
  beforeImage,
  afterImage,
  onBeforeImageChange,
  onAfterImageChange,
}: ServiceImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadingType] = useState<"before" | "after" | null>(
    null,
  );
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File, type: "before" | "after") => {
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecciona solo archivos de imagen");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no debe superar los 5MB");
      return;
    }

    setUploading(true);
    setUploadingType(type);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "services");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir la imagen");
      }

      const data = await response.json();

      if (type === "before") {
        onBeforeImageChange(data.url);
      } else {
        onAfterImageChange(data.url);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen. Por favor, intenta de nuevo.");
    } finally {
      setUploading(false);
      setUploadingType(null);
    }
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    type: "before" | "after",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file, type);
    }
  };

  const handleRemoveImage = (type: "before" | "after") => {
    if (type === "before") {
      onBeforeImageChange(null);
      if (beforeInputRef.current) {
        beforeInputRef.current.value = "";
      }
    } else {
      onAfterImageChange(null);
      if (afterInputRef.current) {
        afterInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = (type: "before" | "after") => {
    if (type === "before" && beforeInputRef.current) {
      beforeInputRef.current.click();
    } else if (type === "after" && afterInputRef.current) {
      afterInputRef.current.click();
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">
        Imágenes del Servicio
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen &quot;Antes&quot;
          </label>

          <input
            type="file"
            ref={beforeInputRef}
            onChange={(e) => handleFileChange(e, "before")}
            accept="image/*"
            className="hidden"
          />

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            {beforeImage ? (
              <div className="relative">
                <img
                  src={beforeImage}
                  alt="Antes"
                  className="w-full h-48 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage("before")}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto bg-gray-100 rounded-full p-3 w-12 h-12 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    {uploading && uploadType === "before"
                      ? "Subiendo..."
                      : 'Subir imagen "Antes"'}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerFileInput("before")}
                  disabled={uploading && uploadType === "before"}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#C5A059] hover:bg-[#B08D45] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C5A059] disabled:opacity-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* After Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen &quot;Después&quot;
          </label>

          <input
            type="file"
            ref={afterInputRef}
            onChange={(e) => handleFileChange(e, "after")}
            accept="image/*"
            className="hidden"
          />

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            {afterImage ? (
              <div className="relative">
                <img
                  src={afterImage}
                  alt="Después"
                  className="w-full h-48 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage("after")}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto bg-gray-100 rounded-full p-3 w-12 h-12 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    {uploading && uploadType === "after"
                      ? "Subiendo..."
                      : 'Subir imagen "Después"'}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerFileInput("after")}
                  disabled={uploading && uploadType === "after"}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-[#C5A059] hover:bg-[#B08D45] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C5A059] disabled:opacity-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {(beforeImage || afterImage) && (
        <div className="mt-4 p-4 bg-[#F8F5FA] rounded-md border border-[#C5A059]/20">
          <p className="text-sm text-[#666666]">
            Las imágenes se mostrarán en la tarjeta del servicio y en la vista
            detallada.
          </p>
        </div>
      )}
    </div>
  );
}
