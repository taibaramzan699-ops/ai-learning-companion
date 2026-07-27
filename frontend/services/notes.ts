import { auth } from "@/lib/firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export type NoteSource = "manual" | "document" | "chat";

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source: NoteSource;
  document_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteParams {
  title: string;
  content?: string;
  tags?: string[];
  source?: NoteSource;
  documentId?: string | null;
}

export interface UpdateNoteParams {
  title?: string;
  content?: string;
  tags?: string[];
}

export async function createNote(params: CreateNoteParams): Promise<Note> {
  const res = await fetch(`${API_BASE}/api/v1/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
    },
    body: JSON.stringify({
      title: params.title,
      content: params.content ?? "",
      tags: params.tags ?? [],
      source: params.source ?? "manual",
      document_id: params.documentId ?? null,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? "Failed to create note");
  }
  return res.json();
}

export async function listNotes(): Promise<Note[]> {
  const res = await fetch(`${API_BASE}/api/v1/notes`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to load notes");
  return res.json();
}

export async function getNote(noteId: string): Promise<Note> {
  const res = await fetch(`${API_BASE}/api/v1/notes/${noteId}`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to load note");
  return res.json();
}

export async function updateNote(noteId: string, params: UpdateNoteParams): Promise<Note> {
  const res = await fetch(`${API_BASE}/api/v1/notes/${noteId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? "Failed to update note");
  }
  return res.json();
}

export async function deleteNote(noteId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/notes/${noteId}`, {
    method: "DELETE",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to delete note");
}

export interface AIFlashcard {
  id: string;
  question: string;
  answer: string;
  mastery: number;
}

export interface AIQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export async function summarizeNote(noteId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/notes/${noteId}/summarize`, {
    method: "POST",
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to summarize note");
  const data = await res.json();
  return data.summary as string;
}

export async function explainNote(noteId: string, topic?: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/notes/${noteId}/explain`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
    },
    body: JSON.stringify({ note_id: noteId, topic: topic ?? null }),
  });
  if (!res.ok) throw new Error("Failed to explain note");
  const data = await res.json();
  return data.explanation as string;
}

export async function generateFlashcardsForNote(noteId: string, count = 8): Promise<AIFlashcard[]> {
  const res = await fetch(`${API_BASE}/api/v1/notes/${noteId}/flashcards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
    },
    body: JSON.stringify({ note_id: noteId, count }),
  });
  if (!res.ok) throw new Error("Failed to generate flashcards");
  const data = await res.json();
  return data.flashcards as AIFlashcard[];
}

export async function generateQuizForNote(noteId: string, count = 5): Promise<AIQuizQuestion[]> {
  const res = await fetch(`${API_BASE}/api/v1/notes/${noteId}/quiz`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
    },
    body: JSON.stringify({ note_id: noteId, count }),
  });
  if (!res.ok) throw new Error("Failed to generate quiz");
  const data = await res.json();
  return data.quiz_questions as AIQuizQuestion[];
}

export async function exportNote(noteId: string, format: "pdf" | "docx"): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/v1/notes/${noteId}/export?format=${format}`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error("Failed to export note");
  return res.blob();
}