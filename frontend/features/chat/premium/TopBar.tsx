"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, FileText, Layers, MessageCircle, Check } from "lucide-react";
import type { Palette, ThemeMode } from "./theme";

const GENERAL_MODE = "general";
const ALL_DOCS_MODE = "all";

export function TopBar({
  selectedScope,
  onScopeChange,
  readyDocuments,
  palette,
}: {
  selectedScope: string;
  onScopeChange: (v: string) => void;
  readyDocuments: { id: string; fileName: string }[];
  palette: Palette;
}) {
  const [scopeOpen, setScopeOpen] = useState(false);
  const scopeRef = useRef<HTMLDivElement>(null);

  const isGeneral = selectedScope === GENERAL_MODE;
  const isAllDocs = selectedScope === ALL_DOCS_MODE;
  const selectedDoc = readyDocuments.find((d) => d.id === selectedScope);
  const label = isGeneral ? "General Assistant" : isAllDocs ? "Select Knowledge Base" : selectedDoc?.fileName ?? "Select";

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (scopeRef.current && !scopeRef.current.contains(e.target as Node)) setScopeOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape for accessibility
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setScopeOpen(false);
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex items-center justify-between px-1 py-3">
      <div />

      <div className="flex items-center gap-2">
        {/* Scope selector */}
        <div className="relative" ref={scopeRef}>
          <button
            onClick={() => setScopeOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors"
            style={{ background: palette.bgSecondary, borderColor: palette.border, color: palette.textPrimary }}
          >
            {isGeneral ? (
              <MessageCircle className="h-3.5 w-3.5" style={{ color: palette.textSecondary }} strokeWidth={1.5} />
            ) : isAllDocs ? (
              <Layers className="h-3.5 w-3.5" style={{ color: palette.textSecondary }} strokeWidth={1.5} />
            ) : (
              <FileText className="h-3.5 w-3.5" style={{ color: palette.textSecondary }} strokeWidth={1.5} />
            )}
            <span className="max-w-[160px] truncate">{label}</span>
            <ChevronDown
              className="h-3.5 w-3.5 transition-transform duration-200"
              style={{ color: palette.textMuted, transform: scopeOpen ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </button>

          {scopeOpen && (
            <div
              className="absolute right-0 z-20 mt-1.5 w-[340px] origin-top-right overflow-hidden rounded-2xl border shadow-[0_20px_60px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-150"
              style={{ background: palette.card, borderColor: palette.border }}
            >
              {/* Modes group */}
              <div className="px-2 pb-1 pt-2.5">
                <p
          className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400"        
          style={{ color: palette.textMuted }}
                >
                  Chat mode
                </p>
                {[
                  { id: GENERAL_MODE, label: "General Assistant", icon: MessageCircle, sub: "No documents attached" },
                  { id: ALL_DOCS_MODE, label: "All Documents", icon: Layers, sub: `${readyDocuments.length} Recent document${readyDocuments.length === 1 ? "" : "s"}` },
                ].map((opt) => {
                  const active = opt.id === selectedScope;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        onScopeChange(opt.id);
                        setScopeOpen(false);
                      }}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200 hover:scale-[1.01]"
                      style={{ background: active ? palette.cardHover : "transparent" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = palette.cardHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = active ? palette.cardHover : "transparent")}
                    >
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#F6F7F9] group-hover:bg-[#EEF3F4] transition"
                        style={{ background: palette.bgSecondary }}
                      >
                        <opt.icon className="h-3.5 w-3.5" style={{ color: palette.textSecondary }} strokeWidth={1.5} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-medium" style={{ color: palette.textPrimary }}>
                          {opt.label}
                        </span>
                        <span className="block truncate text-[11px]" style={{ color: palette.textMuted }}>
                          {opt.sub}
                        </span>
                      </span>
                      {active && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: palette.textPrimary }} strokeWidth={2} />}
                    </button>
                  );
                })}
              </div>

              {readyDocuments.length > 0 && (
                <>
                  <div className="mx-4 my-3 h-px bg-gray-200" style={{ background: palette.border }} />

                  {/* Individual documents group */}
                  <div className="px-2 pb-2 pt-1">
                    <p
                      className="block truncate text-xs text-gray-500 mt-0.5"
                      style={{ color: palette.textMuted }}
                    >
                      Documents — {readyDocuments.length}
                    </p>
                    <div className="max-h-56 overflow-y-auto">
                      {readyDocuments.map((d) => {
                        const active = d.id === selectedScope;
                        return (
                          <button
                            key={d.id}
                            onClick={() => {
                              onScopeChange(d.id);
                              setScopeOpen(false);
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors"
                            style={{ background: active ? palette.cardHover : "transparent" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = palette.cardHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = active ? palette.cardHover : "transparent")}
                          >
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                              style={{ background: palette.bgSecondary }}
                            >
                              <FileText className="h-3.5 w-3.5" style={{ color: palette.textSecondary }} strokeWidth={1.5} />
                            </span>
                            <span className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: palette.textPrimary }}>
                              {d.fileName}
                            </span>
                            {active && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: palette.textPrimary }} strokeWidth={2} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      
      </div>
    </div>
  );
}
