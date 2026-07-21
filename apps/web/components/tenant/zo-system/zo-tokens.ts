// Color palette and tokens for Zo Systems premium dark theme.
// Keep hardcoded values here only; import in zo-system components.

export const zoTokens = {
  background: "#070708",
  backgroundSecondary: "#0d0e11",
  surface: "#111216",
  surfaceElevated: "#18191e",
  border: "#282a31",
  textPrimary: "#f5f5f7",
  textSecondary: "#a7abb4",
  textMuted: "#737782",
  redPrimary: "#e8343d",
  redHover: "#ff4650",
  redDark: "#7d161c",
  gold: "#c9a24e",
  goldMuted: "#7d6839",
} as const;

// Tailwind class aliases for static class usage.
export const zo = {
  bg: "bg-[#070708]",
  bgSecondary: "bg-[#0d0e11]",
  surface: "bg-[#111216]",
  surfaceElevated: "bg-[#18191e]",
  border: "border-[#282a31]",
  textPrimary: "text-[#f5f5f7]",
  textSecondary: "text-[#a7abb4]",
  textMuted: "text-[#737782]",
  red: "text-[#e8343d]",
  redBg: "bg-[#e8343d]",
  redHoverBg: "hover:bg-[#ff4650]",
  redBorder: "border-[#e8343d]",
  gold: "text-[#c9a24e]",
  goldBg: "bg-[#c9a24e]",
  goldBorder: "border-[#c9a24e]",
} as const;
