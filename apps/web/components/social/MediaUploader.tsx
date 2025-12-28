"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

interface MediaUploaderProps {
  value?: string;
  type?: "image" | "video" | "both";
  maxSize?: number; // in MB
  onUpload: (url: string, type: "image" | "video") => void;
  onRemove?: () => void;
  className?: string;
}

export default function MediaUploader({
  value,
  type = "both",
  maxSize = 10,
  onUpload,
  onRemove,
  className = "",
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(value || null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = {
    image: "image/jpeg,image/png,image/gif,image/webp",
    video: "video/mp4,video/webm,video/quicktime",
    both: "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime",
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxSize) {
        setError(`File size must be less than ${maxSize}MB`);
        return;
      }

      // Determine media type
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      const detectedType = isImage ? "image" : isVideo ? "video" : null;

      if (!detectedType) {
        setError("Invalid file type");
        return;
      }

      setMediaType(detectedType);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Simulate upload with progress
      // In real implementation, this would use Cloudinary or another service
      setUploading(true);
      setProgress(0);

      try {
        // Simulate upload progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          setProgress(i);
        }

        // In real implementation, upload to Cloudinary here
        // const formData = new FormData();
        // formData.append('file', file);
        // formData.append('upload_preset', 'your_preset');
        // const response = await fetch('https://api.cloudinary.com/v1_1/your_cloud/upload', {
        //   method: 'POST',
        //   body: formData
        // });
        // const data = await response.json();
        // const uploadedUrl = data.secure_url;

        // For now, use the preview URL as a placeholder
        const uploadedUrl = URL.createObjectURL(file);

        onUpload(uploadedUrl, detectedType);
        setProgress(100);
      } catch (err) {
        setError("Upload failed. Please try again.");
        setPreview(null);
      } finally {
        setUploading(false);
      }
    },
    [maxSize, onUpload],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    setMediaType(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onRemove?.();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!preview ? (
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes[type]}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />

          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>
              {" or drag and drop"}
            </div>

            <p className="text-xs text-gray-500">
              {type === "image" && "PNG, JPG, GIF up to 10MB"}
              {type === "video" && "MP4, WEBM up to 10MB"}
              {type === "both" && "Images or videos up to 10MB"}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Preview */}
          <div className="relative rounded-lg overflow-hidden bg-gray-100">
            {mediaType === "image" ? (
              <Image
                src={preview}
                alt="Preview"
                width={400}
                height={300}
                className="w-full h-auto object-contain max-h-96"
              />
            ) : (
              <video
                src={preview}
                controls
                className="w-full h-auto max-h-96"
              />
            )}

            {/* Upload Progress Overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-lg font-medium mb-2">Uploading...</div>
                  <div className="w-64 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="text-sm mt-2">{progress}%</div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {!uploading && (
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleClick}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Change
              </button>
              <button
                onClick={handleRemove}
                className="flex-1 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
