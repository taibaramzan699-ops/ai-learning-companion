import { auth } from "@/lib/firebase";

export type FlashcardDifficulty = "easy" | "medium" | "hard";
// "mixed" is only ever a generation request — a stored/served card is always
// concretely "definition", "qa", or "concept".
export type FlashcardTypeRequest = "definition" | "qa" | "concept" | "mixed";
export type FlashcardCardType = "definition" | "qa" | "concept";
export type MasteryStatus = "new" | "learning" | "reviewing" | "mastered";
export type ReviewOutcome = "know" | "review_again" | "difficult";

// ---------------------------------------------------------------------------
// Wire types — mirror backend/app/models/flashcard.py field-for-field.
// ---------------------------------------------------------------------------

export interface FlashcardDeckSummary {
  id: string;
  title: string;
  subject: string;
  icon: string;
  source_label: string;
  difficulty: FlashcardDifficulty;
  total_cards: number;
  cards_reviewed: number;
  mastery_percent: number;
  last_reviewed_at: string | null;
  created_at: string;
}

export interface ContinueLearningItem {
  deck: FlashcardDeckSummary;
  last_question_preview: string;
  cards_reviewed_in_session: number;
}

export interface FlashcardPublic {
  id: string;
  card_type: FlashcardCardType;
  front: string;
  back: string;
  mastery_status: MasteryStatus;
  leitner_box: number;
}

export interface FlashcardReviewResult {
  card_id: string;
  new_leitner_box: number;
  new_mastery_status: MasteryStatus;
  next_review_at: string | null;
  deck_mastery_percent: number;
}

export interface FlashcardOverview {
  total_cards: number;
  mastered: number;
  need_review: number;
  new_cards: number;
}

export interface StudyGoal {
  target_cards: number;
  completed_cards: number;
  date: string;
}

export interface WeekActivityDay {
  day: string;
  active: boolean;
}

export interface StudyStreak {
  current_streak_days: number;
  week_activity: WeekActivityDay[];
}

export interface AiTip {
  id: string;
  message: string;
}

export interface FlashcardsPageData {
  continue_learning: ContinueLearningItem | null;
  decks: FlashcardDeckSummary[];
  overview: FlashcardOverview;
  goal: StudyGoal;
  streak: StudyStreak;
  tip: AiTip | null;
}

// ---------------------------------------------------------------------------
// Fetch wrapper — identical auth/error pattern to quiz_ai.ts
// ---------------------------------------------------------------------------

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

export const flashcardAPI = {
  async getAll(): Promise<FlashcardDeckSummary[]> {
    return apiCall<FlashcardDeckSummary[]>("GET", "/flashcards");
  },

  async getPageData(): Promise<FlashcardsPageData> {
    return apiCall<FlashcardsPageData>("GET", "/flashcards/page-data");
  },

  async generate(params: {
    documentId: string;
    numCards?: number;
    difficulty?: FlashcardDifficulty;
    cardType?: FlashcardTypeRequest;
  }): Promise<{ deck_id: string }> {
    return apiCall<{ deck_id: string }>("POST", "/flashcards/generate", {
      document_id: params.documentId,
      num_cards: params.numCards ?? 20,
      difficulty: params.difficulty ?? "medium",
      card_type: params.cardType ?? "mixed",
    });
  },

  async getDeckReview(deckId: string): Promise<FlashcardPublic[]> {
    return apiCall<FlashcardPublic[]>("GET", `/flashcards/${deckId}/review`);
  },

  async submitReview(
    deckId: string,
    cardId: string,
    outcome: ReviewOutcome
  ): Promise<FlashcardReviewResult> {
    return apiCall<FlashcardReviewResult>("POST", `/flashcards/${deckId}/review`, {
      card_id: cardId,
      outcome,
    });
  },

  async delete(deckId: string): Promise<void> {
    return apiCall<void>("DELETE", `/flashcards/${deckId}`);
  },
};

export default flashcardAPI;