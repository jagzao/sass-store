"use client";

import { useState, useRef, type ChangeEvent, useCallback } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  ZoomIn,
  Crop as CropIcon,
} from "lucide-react";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";

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

  // Crop state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropType, setCropType] = useState<"before" | "after" | null>(null);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener(
        "load",
        () => resolve(reader.result as string),
        false,
      );
      reader.readAsDataURL(file);
    });
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height,
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleUpload = async (file: Blob, type: "before" | "after") => {
    setUploading(true);
    setUploadingType(type);

    try {
      const formData = new FormData();
      formData.append("file", file); // Blob is accepted here
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

  const handleFileChange = async (
    e: ChangeEvent<HTMLInputElement>,
    type: "before" | "after",
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        alert("Por favor, selecciona solo archivos de imagen");
        return;
      }
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setCropType(type);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setIsCropping(true);

      // Reset inputs so same file can be selected again if cancelled
      if (type === "before" && beforeInputRef.current)
        beforeInputRef.current.value = "";
      if (type === "after" && afterInputRef.current)
        afterInputRef.current.value = "";
    }
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels || !cropType) return;

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      await handleUpload(croppedImage, cropType);
      handleCropCancel();
    } catch (e) {
      console.error(e);
      alert("Error al recortar la imagen");
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setImageSrc(null);
    setCropType(null);
  };

  const handleRemoveImage = (type: "before" | "after") => {
    if (type === "before") {
      onBeforeImageChange(null);
    } else {
      onAfterImageChange(null);
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

      {/* Crop Modal */}
      {isCropping && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CropIcon className="w-5 h-5 text-[#C5A059]" />
                Recortar y Ajustar
              </h4>
              <button
                onClick={handleCropCancel}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative w-full h-[400px] bg-gray-900">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={4 / 3}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <ZoomIn className="w-5 h-5 text-gray-500" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
                />
                <span className="text-sm text-gray-500 w-8 text-right">
                  {zoom.toFixed(1)}x
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleCropCancel}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCropSave}
                  disabled={uploading}
                  className="px-6 py-2 bg-[#C5A059] text-white rounded-lg hover:bg-[#B08D45] font-bold shadow-lg shadow-[#C5A059]/20 transition-all transform hover:scale-105"
                >
                  {uploading ? "Procesando..." : "Recortar y Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#C5A059]/50 transition-colors">
            {beforeImage ? (
              <div className="relative group">
                <img
                  src={beforeImage}
                  alt="Antes"
                  className="w-full h-48 object-cover rounded-md shadow-sm"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage("before")}
                    className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transform hover:scale-110 transition-all"
                    title="Eliminar imagen"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="mx-auto bg-gray-50 rounded-full p-4 w-16 h-16 flex items-center justify-center border border-gray-200">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    {uploading && uploadType === "before"
                      ? "Subiendo..."
                      : 'Sube la imagen "Antes"'}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerFileInput("before")}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 border border-[#C5A059] text-sm font-medium rounded-full text-[#C5A059] bg-white hover:bg-[#C5A059]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C5A059] disabled:opacity-50 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar archivo
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

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-[#C5A059]/50 transition-colors">
            {afterImage ? (
              <div className="relative group">
                <img
                  src={afterImage}
                  alt="Después"
                  className="w-full h-48 object-cover rounded-md shadow-sm"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                  <button
                    type="button"
                    onClick={() => handleRemoveImage("after")}
                    className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transform hover:scale-110 transition-all"
                    title="Eliminar imagen"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="mx-auto bg-gray-50 rounded-full p-4 w-16 h-16 flex items-center justify-center border border-gray-200">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">
                    {uploading && uploadType === "after"
                      ? "Subiendo..."
                      : 'Sube la imagen "Después"'}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG hasta 5MB</p>
                </div>
                <button
                  type="button"
                  onClick={() => triggerFileInput("after")}
                  disabled={uploading}
                  className="inline-flex items-center px-4 py-2 border border-[#C5A059] text-sm font-medium rounded-full text-[#C5A059] bg-white hover:bg-[#C5A059]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C5A059] disabled:opacity-50 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Seleccionar archivo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {(beforeImage || afterImage) && (
        <div className="mt-4 p-4 bg-[#F8F5FA] rounded-md border border-[#C5A059]/20 flex items-start gap-3">
          <div className="p-1 bg-[#C5A059]/10 rounded-full text-[#C5A059]">
            <CropIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Tip de visualización
            </p>
            <p className="text-sm text-[#666666] mt-1">
              Usa el botón de recortar para centrar la atención en el detalle
              más importante del servicio.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
