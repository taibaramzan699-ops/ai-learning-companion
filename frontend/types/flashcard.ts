// frontend/types/flashcard.ts
// Phase 1 — Data contract for the Flashcards module.
// Mirrors the Quiz module's pattern: shared shapes used by both
// static UI (Phase 2) and backend integration (Phase 3).
// No mocked/fake fields — anything derived (mastery, box, streak)
// is computed and returned by the backend, never invented on the client.

// ---------------------------------------------------------------------------
// Enums / literal unions
// ---------------------------------------------------------------------------

/** Difficulty selected at generation time (Step 2 of the create wizard). */
export type FlashcardDifficulty = "easy" | "medium" | "hard";

/**
 * Requested type at generation time (Step 3 of the wizard).
 * "mixed" is a *generation request only* — every stored card still
 * carries its own concrete CardType once generated (see CardType below).
 * This mirrors how Quiz handles question_type.
 */
export type FlashcardTypeRequest = "definition" | "qa" | "concept" | "mixed";

/** Concrete type stored on each individual generated card. */
export type CardType = "definition" | "qa" | "concept";

/**
 * Mastery status is backend-derived from the Leitner spaced-repetition
 * state. The frontend only ever displays this — it must never compute
 * or guess it locally.
 */
export type MasteryStatus = "new" | "learning" | "reviewing" | "mastered";

/** User's self-assessment on a reviewed card (drives the Leitner box). */
export type ReviewOutcome = "know" | "review_again" | "difficult";

export type DeckSortOption = "recent" | "alphabetical" | "mastery" | "cards";

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export interface FlashcardDeck {
  id: string;
  title: string;
  subject: string;
  icon: string; // lucide icon name, resolved to a component in the UI layer
  totalCards: number;
  cardsReviewed: number;
  masteryPercent: number; // 0-100, backend-computed from card mastery states
  lastReviewedAt: string | null; // ISO 8601, null if never reviewed
  sourceDocumentId: string | null;
  sourceDocumentName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  cardType: CardType;
  front: string; // question / term
  back: string; // answer / definition
  tags: string[]; // auto-generated tags (AI feature)
  confidenceScore: number | null; // 0-1, AI confidence in generated content
  leitnerBox: 1 | 2 | 3 | 4 | 5; // spaced-repetition box
  masteryStatus: MasteryStatus;
  nextReviewAt: string | null; // ISO 8601, when this card is next due
  timesReviewed: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// "Continue Learning" + deck list views
// ---------------------------------------------------------------------------

export interface ContinueLearningItem {
  deck: FlashcardDeck;
  lastQuestionPreview: string; // e.g. last-seen card's front text, truncated
  cardsReviewedInSession: number;
}

export interface DeckListQuery {
  search: string;
  subject: string | "all";
  sort: DeckSortOption;
}

// ---------------------------------------------------------------------------
// Right sidebar analytics (Phase 2 widgets)
// ---------------------------------------------------------------------------

export interface FlashcardOverview {
  totalCards: number;
  mastered: number;
  needReview: number;
  newCards: number;
}

export interface StudyGoal {
  targetCards: number;
  completedCards: number;
  date: string; // ISO date, today's goal
}

export interface StudyStreak {
  currentStreakDays: number;
  /** Mon-Sun activity for the current week, backend-computed. */
  weekActivity: { day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"; active: boolean }[];
}

export interface AiTip {
  id: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Create Flashcards wizard (Steps 1-5)
// ---------------------------------------------------------------------------

export interface StudyMaterialOption {
  id: string;
  name: string;
  uploadedAt: string;
  pageCount: number | null;
}

export interface CreateFlashcardsRequest {
  documentId: string;
  difficulty: FlashcardDifficulty;
  cardType: FlashcardTypeRequest;
  numberOfCards: number; // stepper value, recommended range enforced in UI
}

export interface CreateFlashcardsEstimate {
  estimatedSeconds: number; // shown as "Estimated time: 1-2 minutes"
  recommendedMinCards: number;
  recommendedMaxCards: number;
}

export interface GenerationJobStatus {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed";
  deckId: string | null; // populated once completed
  errorMessage: string | null;
}

// ---------------------------------------------------------------------------
// Review session
// ---------------------------------------------------------------------------

export interface ReviewSessionState {
  deckId: string;
  cardQueue: string[]; // ordered Flashcard ids for this session
  currentIndex: number;
  isFlipped: boolean;
  sessionStartedAt: string;
}

export interface SubmitReviewRequest {
  cardId: string;
  outcome: ReviewOutcome;
}

export interface SubmitReviewResponse {
  card: Flashcard; // updated card with new leitnerBox / masteryStatus
  deck: FlashcardDeck; // updated deck-level masteryPercent
}

// ---------------------------------------------------------------------------
// API response wrappers (match Quiz module's envelope pattern)
// ---------------------------------------------------------------------------

export interface FlashcardsPageData {
  continueLearning: ContinueLearningItem | null;
  decks: FlashcardDeck[];
  overview: FlashcardOverview;
  goal: StudyGoal;
  streak: StudyStreak;
  tip: AiTip | null;
}