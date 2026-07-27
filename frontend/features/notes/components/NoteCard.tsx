"use client";

import { Tag, PenLine, FileText, Sparkles } from "lucide-react";
import type { Note } from "@/services/notes_ai";
interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

const sourceMeta: Record<Note['source'], { label: string; icon: any; className: string }> = {
  manual: { label: "Manual", icon: PenLine, className: "bg-neutral-100 text-neutral-600" },
  document: { label: "Document", icon: FileText, className: "bg-blue-50 text-blue-600" },
  chat: { label: "AI Generated", icon: Sparkles, className: "bg-violet-50 text-violet-600" },
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Just the relative day — "Today", "Yesterday", "3 days ago", or a plain
 * date once it's a week+ old. No clock time, keeps the card clean. */
function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function NoteCard({ note, onClick }: NoteCardProps) {
  const plainText = stripHtml(note.content);
  // Skip the "Category: ... · Generated from ..." header line if present
  const contentWithoutHeader = plainText.replace(/^Category:.*?(?=Summary|Main Notes|$)/s, "").trim();
  const preview = (note.ai_metadata?.summary || contentWithoutHeader || plainText).slice(0, 110);
  const { label, icon: SourceIcon, className } = sourceMeta[note.source];

  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col gap-2 rounded-xl border border-neutral-200/80 bg-white p-4 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 font-serif text-sm font-semibold leading-snug text-neutral-900">
          {note.title || "Untitled note"}
        </h3>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}>
          <SourceIcon className="h-3 w-3" />
          {label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-neutral-400">
        {note.category && (
          <>
            <span className="font-medium text-neutral-500">{note.category}</span>
            <span className="text-neutral-300">·</span>
          </>
        )}
        <span>{formatRelativeDate(note.updated_at)}</span>
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500">
        {preview || "No content yet"}
      </p>

      {note.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Tag className="h-3 w-3 text-neutral-300" />
          {note.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-neutral-50 px-2 py-0.5 text-[11px] font-medium text-neutral-500 ring-1 ring-inset ring-neutral-200"
            >
              #{tag}
            </span>
          ))}
          {note.tags.length > 3 && (
            <span className="text-[11px] text-neutral-400">+{note.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-neutral-100 pt-2 text-xs font-medium text-neutral-400">
        <span className="transition-colors group-hover:text-neutral-700">View note →</span>
        <span className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <PenLine className="h-3 w-3" />
          Edit
        </span>
      </div>
    </button>
  );
}