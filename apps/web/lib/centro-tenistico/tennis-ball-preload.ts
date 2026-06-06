import {
  TENNIS_BALL_FRAME_COUNT,
  tennisBallFrameSrc,
} from "./tennis-ball-frames";

function loadFrame(index: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.crossOrigin = "anonymous"; // required: prevents canvas taint for getImageData()
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error(`Failed to load ${tennisBallFrameSrc(index + 1)}`));
    img.src = tennisBallFrameSrc(index + 1);
  });
}

/**
 * Pre-carga secuencial de los 120 frames en memoria.
 * ScrollTrigger solo debe montarse cuando esta promesa resuelve.
 */
export async function preloadTennisBallFrames(
  onProgress?: (loaded: number, total: number) => void,
): Promise<HTMLImageElement[]> {
  const images: HTMLImageElement[] = new Array(TENNIS_BALL_FRAME_COUNT);

  for (let i = 0; i < TENNIS_BALL_FRAME_COUNT; i += 1) {
    images[i] = await loadFrame(i);
    onProgress?.(i + 1, TENNIS_BALL_FRAME_COUNT);
  }

  return images;
}
