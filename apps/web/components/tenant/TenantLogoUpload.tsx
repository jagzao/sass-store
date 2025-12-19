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

interface TenantLogoUploadProps {
  currentLogo?: string;
  onLogoChange: (url: string | null) => void;
}

export default function TenantLogoUpload({
  currentLogo,
  onLogoChange,
}: TenantLogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

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
      }, "image/png"); // Force PNG for logos (transparency)
    });
  };

  const handleUpload = async (file: Blob) => {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "tenants/logos");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al subir la imagen");
      }

      const data = await response.json();
      onLogoChange(data.url);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error al subir la imagen. Por favor, intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        alert("Por favor, selecciona solo archivos de imagen");
        return;
      }
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setIsCropping(true);

      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      await handleUpload(croppedImage);
      handleCropCancel();
    } catch (e) {
      console.error(e);
      alert("Error al recortar la imagen");
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setImageSrc(null);
  };

  const handleRemoveImage = () => {
    if (confirm("¿Estás seguro de que quieres eliminar el logo actual?")) {
      onLogoChange(null);
    }
  };

  const triggerFileInput = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Crop Modal */}
      {isCropping && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CropIcon className="w-5 h-5 text-blue-600" />
                Ajustar Logo
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
                aspect={3 / 2}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                objectFit="contain"
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
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg transition-all"
                >
                  {uploading ? "Procesando..." : "Guardar Logo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Logo del Negocio
        </label>

        <input
          type="file"
          ref={inputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-white">
          {currentLogo ? (
            <div className="relative group inline-block">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <img
                  src={currentLogo}
                  alt="Logo actual"
                  className="max-h-32 max-w-full object-contain mx-auto"
                />
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-all"
                    title="Cambiar logo"
                  >
                    <CropIcon className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all"
                    title="Eliminar logo"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto bg-blue-50 rounded-full p-4 w-16 h-16 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  {uploading ? "Subiendo..." : "Haz clic para subir un logo"}
                </p>
                <p className="text-xs text-gray-500">
                  Recomendado: Fondo transparente (PNG)
                </p>
              </div>
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-full text-blue-600 bg-white hover:bg-blue-50 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Seleccionar archivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
