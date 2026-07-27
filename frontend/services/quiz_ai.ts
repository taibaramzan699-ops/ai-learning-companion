import { auth } from "@/lib/firebase";

export type QuizDifficulty = "easy" | "medium" | "hard";
// "mixed" is only ever a generation request — a stored/served question is
// always concretely "mcq" or "true_false".
export type QuizQuestionType = "mcq" | "true_false" | "mixed";
export type QuizQuestionFormat = "mcq" | "true_false";

export interface QuizSummary {
  id: string;
  title: string;
  category: string;
  source_label: string;
  difficulty: QuizDifficulty;
  question_type: QuizQuestionType;
  question_count: number;
  best_score_pct: number | null;
  attempts_count: number;
  last_attempt_at: string | null;
  created_at: string;
}

export interface QuizIntro {
  id: string;
  title: string;
  source_label: string;
  category: string;
  question_count: number;
  difficulty: QuizDifficulty;
  question_type: QuizQuestionType;
  estimated_minutes: number;
  topics: string[];
  best_score_pct: number | null;
  attempts_count: number;
}

export interface QuizQuestionPublic {
  id: string;
  question: string;
  options: string[];
  question_type: QuizQuestionFormat;
}

export interface QuizDetail {
  id: string;
  title: string;
  difficulty: QuizDifficulty;
  questions: QuizQuestionPublic[];
}

export interface QuestionResult {
  question_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  selected_answer: number | null;
  is_correct: boolean;
  explanation: string;
  topic: string | null;
}

export interface QuizResult {
  quiz_id: string;
  score: number;
  total: number;
  percentage: number;
  grade: string;
  time_taken_seconds: number | null;
  results: QuestionResult[];
  strong_topics: string[];
  weak_topics: string[];
  ai_feedback: string | null;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") + "/api/v1";

async function apiCall<T>(method: string, endpoint: string, body?: any): Promise<T> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.detail || errorText;
    } catch {
      // errorText wasn't JSON — use as-is
    }
    throw new Error(message || `Something went wrong (${response.status}). Please try again.`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const quizAPI = {
  async getAll(): Promise<QuizSummary[]> {
    return apiCall<QuizSummary[]>("GET", "/quizzes");
  },

  async generate(params: {
    documentId?: string | null;
    noteId?: string | null;
    numQuestions?: number;
    difficulty?: QuizDifficulty;
    questionType?: QuizQuestionType;
  }): Promise<{ quiz_id: string }> {
    return apiCall<{ quiz_id: string }>("POST", "/quizzes/generate", {
      document_id: params.documentId ?? null,
      note_id: params.noteId ?? null,
      num_questions: params.numQuestions ?? 10,
      difficulty: params.difficulty ?? "medium",
      question_type: params.questionType ?? "mcq",
    });
  },

  async getIntro(quizId: string): Promise<QuizIntro> {
    return apiCall<QuizIntro>("GET", `/quizzes/${quizId}/intro`);
  },

  async getDetail(quizId: string): Promise<QuizDetail> {
    return apiCall<QuizDetail>("GET", `/quizzes/${quizId}`);
  },

  async submit(quizId: string, answers: Record<string, number>, timeTakenSeconds?: number): Promise<QuizResult> {
    return apiCall<QuizResult>("POST", `/quizzes/${quizId}/submit`, {
      answers,
      time_taken_seconds: timeTakenSeconds ?? null,
    });
  },

  async delete(quizId: string): Promise<void> {
    return apiCall<void>("DELETE", `/quizzes/${quizId}`);
  },
};

export default quizAPI;