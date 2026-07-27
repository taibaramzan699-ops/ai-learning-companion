"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronDown, FileText, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/services/chat";

export function ChatBubble({ message }: { message: ChatMessage }) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === "user";

  return (
    <div className={cn("flex items-start gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-ink-200 text-ink-700 dark:bg-ink-700 dark:text-ink-100"
            : "bg-ink-950 text-white dark:bg-white dark:text-ink-950"
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </div>

      <div className={cn("max-w-[75%] space-y-2", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-4 py-2.5 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-2xl rounded-tr-sm bg-ink-950 text-ink-50 dark:bg-ink-50 dark:text-ink-950"
              : "rounded-2xl rounded-tl-sm border border-border bg-white text-ink-900 dark:bg-ink-900/60 dark:text-ink-50"
          )}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.sources.length > 0 && (
          <div className="text-xs">
            <button
              onClick={() => setShowSources((v) => !v)}
              className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-ink-400 transition hover:border-ink-400 hover:text-ink-950 dark:hover:border-ink-600 dark:hover:text-ink-50"
            >
              <FileText className="h-3 w-3" />
              {message.sources.length} source{message.sources.length > 1 ? "s" : ""}
              <ChevronDown className={cn("h-3 w-3 transition-transform", showSources && "rotate-180")} />
            </button>

            {showSources && (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {message.sources.map((s, i) => (
                  <div
                    key={i}
                    className="rounded-md border border-border bg-white/70 p-2.5 dark:bg-ink-900/40"
                  >
                    <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-ink-400">
                      <span>Page {s.page_number ?? "—"}</span>
                      <span>{(s.score * 100).toFixed(0)}% match</span>
                    </div>
                    <p className="line-clamp-3 text-ink-900 dark:text-ink-50">{s.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
