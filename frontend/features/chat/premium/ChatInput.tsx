"use client";

import { Paperclip, Mic, MicOff, ArrowUp } from "lucide-react";
import type { Palette } from "./theme";

export function ChatInput({
  value,
  onChange,
  onSend,
  onAttach,
  onToggleVoice,
  isRecording,
  voiceSupported,
  isUploading,
  isSending,
  palette,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onAttach: () => void;
  onToggleVoice: () => void;
  isRecording: boolean;
  voiceSupported: boolean;
  isUploading: boolean;
  isSending: boolean;
  palette: Palette;
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-2xl border px-2"
      style={{ height: 60, background: palette.bgSecondary, borderColor: palette.border }}
    >
      <button
        onClick={onAttach}
        disabled={isUploading}
        title="Attach a document"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
        style={{ color: palette.textSecondary }}
        onMouseEnter={(e) => (e.currentTarget.style.background = palette.cardHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Paperclip className="h-4 w-4" strokeWidth={1.5} />
      </button>

      {voiceSupported && (
        <button
          onClick={onToggleVoice}
          title={isRecording ? "Stop recording" : "Speak your question"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors"
          style={{ color: isRecording ? palette.danger : palette.textSecondary }}
          onMouseEnter={(e) => {
            if (!isRecording) e.currentTarget.style.background = palette.cardHover;
          }}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {isRecording ? <MicOff className="h-4 w-4" strokeWidth={1.5} /> : <Mic className="h-4 w-4" strokeWidth={1.5} />}
        </button>
      )}

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder={isRecording ? "Listening…" : "Ask anything about your study materials…"}
        className="flex-1 bg-transparent text-sm outline-none"
        style={{ color: palette.textPrimary }}
      />

      <button
        onClick={onSend}
        disabled={isSending || !value.trim()}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-opacity disabled:opacity-30"
        style={{ background: palette.accentBg }}
      >
        <ArrowUp className="h-4 w-4" style={{ color: palette.accentText }} strokeWidth={2} />
      </button>
    </div>
  );
}
