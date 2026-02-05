"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselPreviewProps {
  mediaUrls: string[];
  platform: string;
  variant?: "default" | "tech";
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}

const PLATFORM_ASPECT_RATIOS: Record<
  string,
  { width: number; height: number }
> = {
  instagram: { width: 1, height: 1 },
  facebook: { width: 1, height: 1 },
  linkedin: { width: 1.91, height: 1 },
  tiktok: { width: 9, height: 16 },
  x: { width: 16, height: 9 },
  gbp: { width: 1, height: 1 },
  threads: { width: 1, height: 1 },
};

const inferIsVideo = (url: string) =>
  url.startsWith("data:video") ||
  url.toLowerCase().includes(".mp4") ||
  url.toLowerCase().includes(".mov") ||
  url.toLowerCase().includes(".webm");

export default function CarouselPreview({
  mediaUrls,
  platform,
  variant = "default",
  currentIndex: controlledIndex,
  onIndexChange,
}: CarouselPreviewProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const currentIndex =
    controlledIndex !== undefined ? controlledIndex : internalIndex;
  const setCurrentIndex = onIndexChange || setInternalIndex;

  const aspectRatio = PLATFORM_ASPECT_RATIOS[platform] || {
    width: 1,
    height: 1,
  };

  const handlePrevious = () => {
    setCurrentIndex(
      currentIndex === 0 ? mediaUrls.length - 1 : currentIndex - 1,
    );
  };

  const handleNext = () => {
    setCurrentIndex(
      currentIndex === mediaUrls.length - 1 ? 0 : currentIndex + 1,
    );
  };

  useEffect(() => {
    if (mediaUrls.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(
        currentIndex === mediaUrls.length - 1 ? 0 : currentIndex + 1,
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex, mediaUrls.length, setCurrentIndex]);

  if (mediaUrls.length === 0) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg aspect-square">
        <p className="text-gray-400 text-sm">Sin contenido multimedia</p>
      </div>
    );
  }

  const styles = {
    bg: variant === "tech" ? "bg-[#111111]" : "bg-white",
    border: variant === "tech" ? "border-gray-800" : "border-gray-200",
  };

  const activeUrl = mediaUrls[currentIndex];
  const isVideo = inferIsVideo(activeUrl);

  return (
    <div
      className={`relative ${styles.bg} ${styles.border} border rounded-lg overflow-hidden`}
    >
      <div
        className="relative"
        style={{ aspectRatio: `${aspectRatio.width}/${aspectRatio.height}` }}
      >
        {isVideo ? (
          <video
            src={activeUrl}
            className="w-full h-full object-cover"
            controls
            muted
            loop
          />
        ) : (
          <img
            src={activeUrl}
            alt={`Slide ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        )}

        {mediaUrls.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full">
          {currentIndex + 1} / {mediaUrls.length}
        </div>
      </div>

      {mediaUrls.length > 1 && (
        <div className="flex justify-center gap-2 py-3">
          {mediaUrls.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
