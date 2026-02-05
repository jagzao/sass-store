export const isValidMediaFile = (file: File): boolean => {
  return file.type.startsWith("image/") || file.type.startsWith("video/");
};

export const isValidFileSize = (file: File): boolean => {
  const isVideo = file.type.startsWith("video/");
  const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
  return file.size <= maxSize;
};

export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).slice(2, 8);
  const extension = originalName.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
};

export const getMediaType = (mimeType: string): "image" | "video" => {
  return mimeType.startsWith("video/") ? "video" : "image";
};

export const validatePlatformLimits = (
  platform: string,
  mediaCount: number,
): { valid: boolean; error?: string } => {
  const limits: Record<string, { max: number; name: string }> = {
    instagram: { max: 10, name: "Instagram" },
    facebook: { max: 10, name: "Facebook" },
    linkedin: { max: 9, name: "LinkedIn" },
    tiktok: { max: 35, name: "TikTok" },
    x: { max: 4, name: "X (Twitter)" },
    gbp: { max: 10, name: "Google Business" },
    threads: { max: 10, name: "Threads" },
  };

  const limit = limits[platform];
  if (limit && mediaCount > limit.max) {
    return {
      valid: false,
      error: `${limit.name} permite máximo ${limit.max} items por publicación`,
    };
  }

  return { valid: true };
};

export const extractMediaMetadata = async (
  file: File,
): Promise<{ width?: number; height?: number; duration?: number }> => {
  return new Promise((resolve) => {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => resolve({});
      img.src = URL.createObjectURL(file);
      return;
    }

    if (file.type.startsWith("video/")) {
      const video = document.createElement("video");
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
        });
      };
      video.onerror = () => resolve({});
      video.src = URL.createObjectURL(file);
      return;
    }

    resolve({});
  });
};
