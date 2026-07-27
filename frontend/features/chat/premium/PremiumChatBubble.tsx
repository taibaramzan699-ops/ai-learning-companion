"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Check, Copy, StickyNote, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/services/chat";
import type { Palette } from "./theme";
import { notesAPI } from "@/services/notes_ai";

export function PremiumChatBubble({ message, palette }: { message: ChatMessage; palette: Palette }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const router = useRouter();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — fail silently
    }
  }

  async function handleSaveAsNote() {
    if (saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");
    try {
      await notesAPI.createFromMessage(message.content);
      setSaveState("saved");
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 2000);
    }
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] space-y-2 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
          style={
            isUser
              ? { background: palette.accentBg, color: palette.accentText }
              : { background: palette.card, color: palette.textPrimary, border: `1px solid ${palette.border}` }
          }
        >
          {isUser ? (
            message.content
          ) : (
            <div
              className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5"
              style={{ color: palette.textPrimary }}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && (
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 transition-colors"
              style={{ color: palette.textMuted }}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>

            <button
              onClick={saveState === "saved" ? () => router.push("/app/notes") : handleSaveAsNote}
              disabled={saveState === "saving"}
              className="flex items-center gap-1 transition-colors"
              style={{ color: saveState === "saved" ? palette.accentBg : palette.textMuted }}
            >
              {saveState === "saving" && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              )}
              {saveState === "idle" && (
                <>
                  <StickyNote className="h-3.5 w-3.5" />
                  Save as Note
                </>
              )}
              {saveState === "saved" && (
                <>
                  <Check className="h-3.5 w-3.5" />
                  View Note
                </>
              )}
              {saveState === "error" && "Failed — retry"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}