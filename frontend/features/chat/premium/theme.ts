export interface Palette {
  bg: string;
  bgSecondary: string;
  card: string;
  cardHover: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  accentBg: string;
  accentText: string;

  accentGlow: string;   // <-- ADD THIS

  danger: string;
}

export const darkPalette: Palette = {
  bg: "#0F1115",
  bgSecondary: "#171A21",
  card: "#1E222B",
  cardHover: "#252B36",
  border: "rgba(255,255,255,0.08)",
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A7B8",
  textMuted: "#6F7686",
  accentBg: "#FFFFFF",
  accentText: "#0F1115",
  danger: "#FF6B6B",
  accentGlow: "rgba(255,255,255,0.12)",
};

export const lightPalette: Palette = {
  bg: "#FFFFFF",
  bgSecondary: "#F5F6F8",
  card: "#F7F8FA",
  cardHover: "#EEF0F3",
  border: "rgba(15,17,21,0.08)",
  textPrimary: "#0F1115",
  textSecondary: "#4B5165",
  textMuted: "#8A90A0",
  accentBg: "#0F1115",
  accentText: "#FFFFFF",
  danger: "#E5484D",
  accentGlow: "rgba(212,161,74,0.28)",
};

export type ThemeMode = "dark" | "light";

export function getPalette(mode: ThemeMode): Palette {
  return mode === "dark" ? darkPalette : lightPalette;
}