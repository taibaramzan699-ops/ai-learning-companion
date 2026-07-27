import type { Palette } from "./theme";

export function BackgroundEffects({ palette }: { palette: Palette }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${palette.textPrimary}0D, transparent)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(${palette.textPrimary} 1px, transparent 1px), linear-gradient(90deg, ${palette.textPrimary} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="absolute left-1/2 top-24 h-64 w-64 -translate-x-1/2 rounded-full blur-[100px]"
        style={{ background: `${palette.textPrimary}0F` }}
      />
    </div>
  );
}
