"use client";

import { motion } from "framer-motion";
import { Logo } from "./Logo";
import { ActionCard } from "./ActionCard";
import type { Palette } from "./theme";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function EmptyState({
  subheading,
  onPromptSelect,
  prompts,
  palette,
}: {
  subheading: string;
  onPromptSelect: (text: string) => void;
  prompts: { icon: any; title: string; description: string }[];
  palette: Palette;
}) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-6 text-center" style={{ transform: "scale(0.92)" }}>
      <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ duration: 0.4 }}>
        <Logo size={88} palette={palette} />
      </motion.div>

      <motion.h1
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-5 text-2xl font-semibold tracking-tight"
        style={{ color: palette.textPrimary }}
      >
        AI Learning Companion
      </motion.h1>

      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.4, delay: 0.18 }}
        className="mt-1 text-base font-medium"
        style={{ color: palette.textSecondary }}
      >
        Study Smarter. Learn Faster.
      </motion.p>

      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.4, delay: 0.26 }}
        className="mt-2 max-w-sm text-sm leading-relaxed"
        style={{ color: palette.textMuted }}
      >
        {subheading}
      </motion.p>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        transition={{ duration: 0.4, delay: 0.34 }}
        className="mt-6 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2"
      >
        {prompts.map((p, i) => (
          <ActionCard
            key={i}
            icon={p.icon}
            title={p.title}
            description={p.description}
            onClick={() => onPromptSelect(p.title)}
            palette={palette}
          />
        ))}
      </motion.div>
    </div>
  );
}
