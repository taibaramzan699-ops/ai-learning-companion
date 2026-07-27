"use client";

import { useState } from "react";
import { Lightbulb, BookOpen, Loader2, Plus, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { notesAPI, type Note } from "@/services/notes_ai";

interface NoteAIPanelProps {
  note: Note | null; // null = not saved yet, AI actions need a saved note
  onInsert: (html: string) => void;
}

type ActionKey = "summarize" | "explain";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Converts plain AI text (which may still contain stray markdown) into clean HTML. */
function aiTextToHtml(text: string): string {
  const lines = text.split(/\r?\n/);
  const htmlParts: string[] = [];
  let listBuffer: string[] = [];

  function flushList() {
    if (listBuffer.length > 0) {
      htmlParts.push(`<ul>${listBuffer.map((li) => `<li>${li}</li>`).join("")}</ul>`);
      listBuffer = [];
    }
  }

  function inlineFormat(line: string): string {
    let out = escapeHtml(line);
    out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
    return out;
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      htmlParts.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`);
      continue;
    }
    const bulletMatch = line.match(/^[-*•]\s+(.*)/);
    if (bulletMatch) {
      listBuffer.push(inlineFormat(bulletMatch[1]));
      continue;
    }
    const numberedMatch = line.match(/^\d+[.)]\s+(.*)/);
    if (numberedMatch) {
      listBuffer.push(inlineFormat(numberedMatch[1]));
      continue;
    }
    flushList();
    htmlParts.push(`<p>${inlineFormat(line)}</p>`);
  }
  flushList();
  return htmlParts.join("");
}

const actionMeta: Record<ActionKey, { label: string; icon: typeof Lightbulb }> = {
  summarize: { label: "Summarize", icon: BookOpen },
  explain: { label: "Explain", icon: Lightbulb },
};

export function NoteAIPanel({ note, onInsert }: NoteAIPanelProps) {
  const [activeAction, setActiveAction] = useState<ActionKey | null>(null);
  const [resultHtml, setResultHtml] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const summarizeMutation = useMutation({ mutationFn: (id: string) => notesAPI.summarize(id) });
  const explainMutation = useMutation({ mutationFn: (id: string) => notesAPI.explain(id) });

  const isPending = summarizeMutation.isPending || explainMutation.isPending;

  function runAction(action: ActionKey) {
    if (!note) return;
    setActiveAction(action);
    setResultHtml(null);
    setErrorText(null);

    const onError = (err: Error) => setErrorText(err.message);

    if (action === "summarize") {
      summarizeMutation.mutate(note.id, {
        onSuccess: (text) => setResultHtml(aiTextToHtml(text)),
        onError,
      });
    } else if (action === "explain") {
      explainMutation.mutate(note.id, {
        onSuccess: (text) => setResultHtml(aiTextToHtml(text)),
        onError,
      });
    }
  }

  function handleInsert() {
    if (!resultHtml) return;
    onInsert(resultHtml);
    setResultHtml(null);
    setActiveAction(null);
  }

  function handleDismiss() {
    setResultHtml(null);
    setErrorText(null);
    setActiveAction(null);
  }

  if (!note) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-200 px-3 py-2 text-xs text-neutral-400">
        Save this note first to unlock AI actions (Summarize, Explain).
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(actionMeta) as ActionKey[]).map((key) => {
          const { label, icon: Icon } = actionMeta[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => runAction(key)}
              disabled={isPending}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                activeAction === key
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              {isPending && activeAction === key ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              {label}
            </button>
          );
        })}
      </div>

      {errorText && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          <span>Something went wrong: {errorText}</span>
          <button type="button" onClick={handleDismiss} className="text-red-400 hover:text-red-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {resultHtml && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div
            className="max-h-64 overflow-y-auto text-sm leading-relaxed text-neutral-700 [&_h3]:font-serif [&_h3]:font-semibold [&_h3]:text-sm [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_strong]:font-semibold [&_strong]:text-neutral-900"
            dangerouslySetInnerHTML={{ __html: resultHtml }}
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleInsert}
              className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Insert into note
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="ml-auto flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-3.5 w-3.5" />
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}