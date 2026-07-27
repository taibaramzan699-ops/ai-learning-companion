export interface AppUser {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  createdAt: string;
  role: "student" | "admin";
}

export type DocumentStatus = "uploading" | "processing" | "ready" | "failed";

export interface DocumentRecord {
  id: string;
  ownerId: string;
  fileName: string;
  fileUrl: string;
  status: DocumentStatus;
  pageCount?: number;
  chunkCount?: number;
  errorMessage?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  citations?: { documentId: string; page: number; snippet: string }[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  easeFactor: number;
  intervalDays: number;
  dueAt: string;
}

export interface PlannerEvent {
  id: string;
  userId: string;
  title: string;
  type: "flashcard-review" | "quiz" | "custom";
  scheduledAt: string;
  completedAt?: string;
}