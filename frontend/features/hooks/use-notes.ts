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
  document_id?: string;
  is_favorite: boolean;
  ai_metadata?: AIMetadata;
  created_at: string;
  updated_at: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/v1';

async function apiCall<T>(method: string, endpoint: string, body?: any): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  
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

  return response.json();
}

export const notesAPI = {
  // Original CRUD
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

  // Toggle favorite
  async toggleFavorite(id: string): Promise<Note> {
    return apiCall<Note>('POST', `/notes/${id}/toggle-favorite`);
  },

  // Search
  async search(query: string): Promise<Note[]> {
    return apiCall<Note[]>('GET', `/notes/search/${query}`);
  },

  // AI Features
  async summarize(id: string): Promise<string> {
    const { summary } = await apiCall<{ summary: string }>('POST', `/notes/${id}/summarize`);
    return summary;
  },

  async explain(id: string, topic?: string): Promise<string> {
    const { explanation } = await apiCall<{ explanation: string }>('POST', `/notes/${id}/explain`, { topic });
    return explanation;
  },

  async generateFlashcards(id: string, count: number = 10): Promise<Flashcard[]> {
    const { flashcards } = await apiCall<{ flashcards: Flashcard[] }>('POST', `/notes/${id}/flashcards`, { count });
    return flashcards;
  },

  async generateQuiz(id: string, count: number = 5): Promise<QuizQuestion[]> {
    const { quiz_questions } = await apiCall<{ quiz_questions: QuizQuestion[] }>('POST', `/notes/${id}/quiz`, { count });
    return quiz_questions;
  },

  async chatWithNote(id: string, message: string): Promise<string> {
    const { message: response } = await apiCall<{ message: string }>('POST', `/notes/${id}/chat`, { message });
    return response;
  },

  async updateAIMetadata(id: string): Promise<Note> {
    return apiCall<Note>('POST', `/notes/${id}/ai/update`);
  },
};

export default notesAPI;
