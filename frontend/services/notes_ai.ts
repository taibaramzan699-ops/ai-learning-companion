import { auth } from "@/lib/firebase";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  mastery: number; // 0=new, 1=learning, 2=familiar, 3=mastered
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface AIMetadata {
  summary: string | null;
  key_points: string[];
  explanation: string | null;
  flashcards: Flashcard[];
  quiz_questions: QuizQuestion[];
  last_ai_update: string | null;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source: 'manual' | 'document' | 'chat';
  category?: string | null;
  document_id?: string;
  is_favorite: boolean;
  ai_metadata?: AIMetadata;
  created_at: string;
  updated_at: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1';

async function apiCall<T>(method: string, endpoint: string, body?: any): Promise<T> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `API Error: ${response.status}`);
  }

  // 204 No Content (e.g. DELETE) has no body — calling .json() on it throws
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const notesAPI = {
  async getAll(): Promise<Note[]> {
    return apiCall<Note[]>('GET', '/notes');
  },

  async getOne(id: string): Promise<Note> {
    return apiCall<Note>('GET', `/notes/${id}`);
  },

  async create(note: Partial<Note>): Promise<Note> {
    return apiCall<Note>('POST', '/notes', note);
  },

  async update(id: string, note: Partial<Note>): Promise<Note> {
    return apiCall<Note>('PATCH', `/notes/${id}`, note);
  },

  async delete(id: string): Promise<void> {
    return apiCall<void>('DELETE', `/notes/${id}`);
  },

  async toggleFavorite(id: string): Promise<Note> {
    return apiCall<Note>('POST', `/notes/${id}/toggle-favorite`);
  },

  async search(query: string): Promise<Note[]> {
    return apiCall<Note[]>('GET', `/notes/search/${query}`);
  },

  async summarize(id: string): Promise<string> {
    const { summary } = await apiCall<{ summary: string }>('POST', `/notes/${id}/summarize`);
    return summary;
  },

  async explain(id: string, topic?: string): Promise<string> {
    const { explanation } = await apiCall<{ explanation: string }>('POST', `/notes/${id}/explain`, {
      note_id: id,
      topic,
    });
    return explanation;
  },

  async generateFlashcards(id: string, count: number = 10): Promise<Flashcard[]> {
    const { flashcards } = await apiCall<{ flashcards: Flashcard[] }>('POST', `/notes/${id}/flashcards`, {
      note_id: id,
      count,
    });
    return flashcards;
  },

  async generateQuiz(id: string, count: number = 5): Promise<QuizQuestion[]> {
    const { quiz_questions } = await apiCall<{ quiz_questions: QuizQuestion[] }>('POST', `/notes/${id}/quiz`, {
      note_id: id,
      count,
    });
    return quiz_questions;
  },

  async chatWithNote(id: string, message: string): Promise<string> {
    const { message: response } = await apiCall<{ message: string }>('POST', `/notes/${id}/chat`, { message });
    return response;
  },

  async updateAIMetadata(id: string): Promise<Note> {
    return apiCall<Note>('POST', `/notes/${id}/ai/update`);
  },

  async createFromMessage(content: string, documentId?: string | null): Promise<Note> {
    return apiCall<Note>('POST', '/notes/from-message', {
      content,
      document_id: documentId ?? null,
    });
  },

  async createFromConversation(
    messages: { role: 'user' | 'assistant'; content: string }[],
    documentId?: string | null
  ): Promise<Note> {
    return apiCall<Note>('POST', '/notes/from-conversation', {
      messages,
      document_id: documentId ?? null,
    });
  },
};

export default notesAPI;