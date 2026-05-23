import {
  TENNIS_BALL_FRAME_COUNT,
  tennisBallFrameSrc,
} from "./tennis-ball-frames";

/**
 * Pre-carga los 120 frames en memoria (sin insertar <img> en el DOM).
 * Patrón equivalente al for-loop del snippet de referencia.
 */
export function preloadTennisBallFrames(
  onProgress?: (loaded: number, total: number) => void,
): Promise<HTMLImageElement[]> {
  const images: HTMLImageElement[] = [];
  let loaded = 0;

  const promises = Array.from({ length: TENNIS_BALL_FRAME_COUNT }, (_, i) => {
    const img = new Image();
    images[i] = img;
    return new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => {
        loaded += 1;
        onProgress?.(loaded, TENNIS_BALL_FRAME_COUNT);
        resolve(img);
      };
      img.onerror = () =>
        reject(new Error(`Failed to load ${tennisBallFrameSrc(i + 1)}`));
      img.src = tennisBallFrameSrc(i + 1);
    });
  });

  return Promise.all(promises).then(() => images);
}
