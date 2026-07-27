"use client";

import { useState } from "react";
import { Plus, NotebookText, Loader2 } from "lucide-react";
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from "@/app/app/hooks/use-notes";
import { NoteCard } from "@/features/notes/components/NoteCard";
import { NoteEditor } from "@/features/notes/components/NoteEditor";
import type { Note } from "@/services/notes_ai";
export default function NotesPage() {
  const { data: notes, isLoading } = useNotes();
  const { mutate: createNote, isPending: isCreating } = useCreateNote();
  const { mutate: updateNote, isPending: isUpdating } = useUpdateNote();
  const { mutate: deleteNote, isPending: isDeleting } = useDeleteNote();

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  function openNewNote() {
    setActiveNote(null);
    setIsEditorOpen(true);
  }

  function openExistingNote(note: Note) {
    setActiveNote(note);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    setIsEditorOpen(false);
    setActiveNote(null);
  }

  function handleSave(data: { title: string; content: string; tags: string[] }) {
    if (activeNote) {
      updateNote({ noteId: activeNote.id, params: data }, { onSuccess: closeEditor });
    } else {
      createNote({ ...data, source: "manual" }, { onSuccess: closeEditor });
    }
  }


  function handleDelete() {
  if (!activeNote || isDeleting) return;
  deleteNote(activeNote.id, { onSuccess: closeEditor });
}
  return (
  <div className="min-h-full bg-[#F9FAFB]">
    <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900">Notes</h1>
          <p className="text-sm text-neutral-500">Your personal knowledge hub.</p>
        </div>
        <button
          onClick={openNewNote}
          className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          <Plus className="h-4 w-4" />
          New note
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-neutral-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : !notes || notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 py-24 text-center">
          <NotebookText className="h-8 w-8 text-neutral-300" />
          <p className="text-sm text-neutral-500">No notes yet. Create your first one.</p>
          <button
            onClick={openNewNote}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            New note
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} onClick={() => openExistingNote(note)} />
          ))}
        </div>
      )}

            {isEditorOpen && (
        <NoteEditor
          note={activeNote}
          isSaving={isCreating || isUpdating}
          isDeleting={isDeleting}
          onSave={handleSave}
          onDelete={activeNote ? handleDelete : undefined}
          onClose={closeEditor}
        />
      )}
    </div>
  </div>
  );
}
