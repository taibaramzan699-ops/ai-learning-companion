"use client";

import { motion } from "framer-motion";
import { ArrowRight, type LucideIcon } from "lucide-react";
import type { Palette } from "./theme";

export function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
  palette,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  palette: Palette;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="group flex items-start justify-between gap-3 rounded-xl border p-4 text-left transition-colors"
      style={{ background: palette.card, borderColor: palette.border }}
      onMouseEnter={(e) => (e.currentTarget.style.background = palette.cardHover)}
      onMouseLeave={(e) => (e.currentTarget.style.background = palette.card)}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
          style={{ borderColor: palette.border, background: `${palette.textPrimary}08` }}
        >
          <Icon className="h-4 w-4" style={{ color: palette.textPrimary }} strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: palette.textPrimary }}>
            {title}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: palette.textSecondary }}>
            {description}
          </p>
        </div>
      </div>
      <ArrowRight
        className="mt-1 h-4 w-4 shrink-0 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
        style={{ color: palette.textSecondary }}
      />
    </motion.button>
  );
}
