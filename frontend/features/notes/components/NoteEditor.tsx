"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Trash2, FileDown, FileText } from "lucide-react";
import type { Note } from "@/services/notes_ai";
import { auth } from "@/lib/firebase";
import { RichTextEditor } from "./RichTextEditor";
import { NoteAIPanel } from "./NoteAIPanel";

interface NoteEditorProps {
  note: Note | null; // null = creating a new note
  isSaving: boolean;
  isDeleting: boolean;
  onSave: (data: { title: string; content: string; tags: string[] }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function NoteEditor({ note, isSaving, isDeleting, onSave, onDelete, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [content, setContent] = useState(note?.content ?? "");
  const [tagsInput, setTagsInput] = useState(note?.tags.join(", ") ?? "");

  useEffect(() => {
    setTitle(note?.title ?? "");
    setContent(note?.content ?? "");
    setTagsInput(note?.tags.join(", ") ?? "");
  }, [note]);

  const [isDownloading, setIsDownloading] = useState<"pdf" | "docx" | null>(null);

  async function handleDownload(format: "pdf" | "docx") {
    if (!note) return;
    setIsDownloading(format);
    try {
      const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api/v1";
      const currentUser = auth?.currentUser ?? null;
      const token = currentUser ? await currentUser.getIdToken() : null;

      const res = await fetch(`${API_BASE}/notes/${note.id}/export?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${note.title || "note"}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    } finally {
      setIsDownloading(null);
    }
  }

  function handleSave() {
    if (!title.trim()) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({ title: title.trim(), content, tags });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h2 className="font-serif text-lg font-semibold text-neutral-900">
            {note ? "Edit note" : "New note"}
          </h2>
          <button onClick={onClose} className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="w-full border-none text-lg font-medium text-neutral-900 outline-none placeholder:text-neutral-300"
          />

          <NoteAIPanel
            note={note}
            onInsert={(html) => setContent((prev) => `${prev}${html}`)}
          />

          <RichTextEditor content={content} onChange={setContent} />

          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Tags, comma separated (e.g. OS, Semester5)"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 outline-none placeholder:text-neutral-300"
          />
        </div>

        <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-1.5">
            {note && onDelete ? (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            ) : null}

            {note && (
              <>
                <button
                  onClick={() => handleDownload("pdf")}
                  disabled={isDownloading !== null}
                  title="Download as PDF"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
                >
                  {isDownloading === "pdf" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4" />
                  )}
                  PDF
                </button>
                <button
                  onClick={() => handleDownload("docx")}
                  disabled={isDownloading !== null}
                  title="Download as Word"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
                >
                  {isDownloading === "docx" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Word
                </button>
              </>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save note
          </button>
        </div>
      </div>
    </div>
  );
}