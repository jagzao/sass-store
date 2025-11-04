/**
 * useCircleText - Helper utility for circular text layout
 * Distributes characters evenly around a circle
 */

export interface CircleTextChar {
  char: string;
  rotate: number;
}

export function generateCircleTextChars(text: string): CircleTextChar[] {
  const chars = text.split('');
  const total = chars.length;
  const degreePerChar = 360 / total;

  return chars.map((char, index) => ({
    char,
    rotate: index * degreePerChar
  }));
}

export function useCircleText(text?: string) {
  const defaultText = text || "DELIRIOS — CODING AND DESIGN WEBSITE — YOUTUBE — ";
  // Repetir el texto para llenar el círculo completamente
  const repeatedText = (defaultText + defaultText).trim();
  return generateCircleTextChars(repeatedText);
}

export default useCircleText;
