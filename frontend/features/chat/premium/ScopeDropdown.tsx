"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  FileText,
  Layers,
  MessageCircle,
} from "lucide-react";
import type { Palette } from "./theme";

const GENERAL_MODE = "general";
const ALL_DOCS_MODE = "all";

interface ScopeDropdownProps {
  open: boolean;
  selectedScope: string;
  readyDocuments: {
    id: string;
    fileName: string;
  }[];
  palette: Palette;
  onSelect: (id: string) => void;
}

export function ScopeDropdown({
  open,
  selectedScope,
  readyDocuments,
  palette,
  onSelect,
}: ScopeDropdownProps) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{
          opacity: 0,
          y: -10,
          scale: 0.97,
          filter: "blur(6px)",
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
        }}
        exit={{
          opacity: 0,
          y: -8,
          scale: 0.98,
        }}
        transition={{
          duration: 0.22,
          ease: "easeOut",
        }}
        className="absolute right-0 top-14 z-50 w-[360px] overflow-hidden rounded-3xl border backdrop-blur-2xl"
        style={{
          background: "rgba(255,255,255,.92)",
          borderColor: "#ECECEC",
          boxShadow:
            "0 30px 80px rgba(15,17,21,.12)",
        }}
      >
        {/* Header */}

        <div className="px-6 pt-6 pb-4">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.25em]"
            style={{
              color: palette.textMuted,
            }}
          >
            CHAT MODE
          </p>

          <p
            className="mt-1 text-sm"
            style={{
              color: palette.textSecondary,
            }}
          >
            Choose how the AI should answer.
          </p>
        </div>

        <div className="space-y-2 px-4">

          {/* GENERAL */}

          <OptionCard
            active={selectedScope === GENERAL_MODE}
            icon={<MessageCircle size={18} />}
            title="General Assistant"
            subtitle="Ask questions without documents."
            palette={palette}
            onClick={() => onSelect(GENERAL_MODE)}
          />

          {/* ALL DOCS */}

          <OptionCard
            active={selectedScope === ALL_DOCS_MODE}
            icon={<Layers size={18} />}
            title="All Documents"
            subtitle={`Search across ${readyDocuments.length} uploaded document${
              readyDocuments.length === 1 ? "" : "s"
            }`}
            palette={palette}
            onClick={() => onSelect(ALL_DOCS_MODE)}
          />

        </div>

        {readyDocuments.length > 0 && (
          <>
            <div
              className="mx-6 my-6 h-px"
              style={{
                background: "#ECECEC",
              }}
            />

            <div className="px-6">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.25em]"
                style={{
                  color: palette.textMuted,
                }}
              >
                YOUR DOCUMENTS
              </p>

              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto pb-6">

                {readyDocuments.map((doc) => (

                  <OptionCard
                    key={doc.id}
                    active={selectedScope === doc.id}
                    icon={<FileText size={18} />}
                    title={doc.fileName}
                    subtitle="Ready for AI search"
                    palette={palette}
                    onClick={() => onSelect(doc.id)}
                  />

                ))}

              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

interface OptionCardProps {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  palette: Palette;
  onClick: () => void;
}

function OptionCard({
  active,
  icon,
  title,
  subtitle,
  palette,
  onClick,
}: OptionCardProps) {
  return (
    <motion.button
      whileHover={{
        y: -2,
        scale: 1.01,
      }}
      whileTap={{
        scale: 0.98,
      }}
      transition={{
        type: "spring",
        stiffness: 350,
      }}
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all"
      style={{
        borderColor: active ? "#D4A14A" : "#ECECEC",
        background: active
          ? "linear-gradient(135deg,#FFF9EE,#FFFFFF)"
          : "#FFFFFF",
        boxShadow: active
          ? "0 10px 30px rgba(212,161,74,.18)"
          : "0 4px 12px rgba(15,17,21,.04)",
      }}
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{
          background: "#F7F7F7",
          color: palette.textPrimary,
        }}
      >
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="truncate text-sm font-semibold"
          style={{
            color: palette.textPrimary,
          }}
        >
          {title}
        </div>

        <div
          className="mt-1 text-xs"
          style={{
            color: palette.textMuted,
          }}
        >
          {subtitle}
        </div>
      </div>

      {active && (
        <motion.div
          initial={{
            scale: 0,
          }}
          animate={{
            scale: 1,
          }}
        >
          <Check
            size={18}
            color="#D4A14A"
            strokeWidth={2.5}
          />
        </motion.div>
      )}
    </motion.button>
  );
}