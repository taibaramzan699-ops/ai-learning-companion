// frontend/app/app/hooks/use-flashcards.ts
"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  flashcardAPI,
  type FlashcardDeckSummary as WireDeck,
  type ContinueLearningItem as WireContinueLearning,
  type FlashcardsPageData as WirePageData,
  type FlashcardPublic as WireCard,
  type FlashcardDifficulty,
  type FlashcardTypeRequest,
  type ReviewOutcome,
} from "@/services/flashcard_ai";
import type {
  ContinueLearningItem,
  DeckListQuery,
  DeckSortOption,
  Flashcard,
  FlashcardDeck,
  FlashcardsPageData,
} from "@/types/flashcard";

const PAGE_DATA_KEY = ["flashcards", "page-data"];
const reviewKey = (deckId: string) => ["flashcards", "review", deckId];

// ---------------------------------------------------------------------------
// Wire (snake_case, matches backend Pydantic) -> UI shape (camelCase)
// ---------------------------------------------------------------------------

// week_activity is contractually Mon->Sun order (see StudyStreak's doc comment
// in types/flashcard.ts), so the day label is derived from position rather
// than trusting the wire's `day` field, which is typed as a loose `string` on
// the backend and isn't guaranteed to match our literal union.
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function mapDeck(d: WireDeck): FlashcardDeck {
  return {
    id: d.id,
    title: d.title,
    subject: d.subject,
    icon: d.icon,
    totalCards: d.total_cards,
    cardsReviewed: d.cards_reviewed,
    masteryPercent: d.mastery_percent,
    lastReviewedAt: d.last_reviewed_at,
    sourceDocumentId: null,
    sourceDocumentName: d.source_label,
    createdAt: d.created_at,
    updatedAt: d.last_reviewed_at ?? d.created_at,
  };
}

function mapContinueLearning(c: WireContinueLearning): ContinueLearningItem {
  return {
    deck: mapDeck(c.deck),
    lastQuestionPreview: c.last_question_preview,
    cardsReviewedInSession: c.cards_reviewed_in_session,
  };
}

function mapPageData(p: WirePageData): FlashcardsPageData {
  return {
    continueLearning: p.continue_learning ? mapContinueLearning(p.continue_learning) : null,
    decks: p.decks.map(mapDeck),
    overview: {
      totalCards: p.overview.total_cards,
      mastered: p.overview.mastered,
      needReview: p.overview.need_review,
      newCards: p.overview.new_cards,
    },
    goal: {
      targetCards: p.goal.target_cards,
      completedCards: p.goal.completed_cards,
      date: p.goal.date,
    },
    streak: {
      currentStreakDays: p.streak.current_streak_days,
      weekActivity: p.streak.week_activity.map((d, i) => ({
        day: WEEKDAY_LABELS[i % 7],
        active: d.active,
      })),
    },
    tip: p.tip,
  };
}

function mapReviewCard(c: WireCard, deckId: string): Flashcard {
  return {
    id: c.id,
    deckId,
    cardType: c.card_type,
    front: c.front,
    back: c.back,
    tags: [],
    confidenceScore: null,
    leitnerBox: c.leitner_box as 1 | 2 | 3 | 4 | 5,
    masteryStatus: c.mastery_status,
    nextReviewAt: null,
    timesReviewed: 0,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// useFlashcardsPage — powers the main deck grid page
// ---------------------------------------------------------------------------

interface UseFlashcardsPageResult {
  data: FlashcardsPageData | null;
  isLoading: boolean;
  error: string | null;
  query: DeckListQuery;
  setSearch: (value: string) => void;
  setSubject: (value: string) => void;
  setSort: (value: DeckSortOption) => void;
  filteredDecks: FlashcardDeck[];
  subjects: string[];
  refetch: () => void;
}

export function useFlashcardsPage(): UseFlashcardsPageResult {
  const { data: raw, isLoading, error, refetch } = useQuery({
    queryKey: PAGE_DATA_KEY,
    queryFn: () => flashcardAPI.getPageData(),
  });

  const [query, setQuery] = useState<DeckListQuery>({
    search: "",
    subject: "all",
    sort: "recent",
  });

  const data = useMemo(() => (raw ? mapPageData(raw) : null), [raw]);

  const subjects = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.decks.map((d) => d.subject)));
  }, [data]);

  const filteredDecks = useMemo(() => {
    if (!data) return [];
    let result = [...data.decks];

    if (query.search.trim()) {
      const q = query.search.trim().toLowerCase();
      result = result.filter(
        (d) => d.title.toLowerCase().includes(q) || d.subject.toLowerCase().includes(q)
      );
    }

    if (query.subject !== "all") {
      result = result.filter((d) => d.subject === query.subject);
    }

    switch (query.sort) {
      case "alphabetical":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "mastery":
        result.sort((a, b) => b.masteryPercent - a.masteryPercent);
        break;
      case "cards":
        result.sort((a, b) => b.totalCards - a.totalCards);
        break;
      case "recent":
      default:
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    return result;
  }, [data, query]);

  return {
    data,
    isLoading,
    error: error ? (error as Error).message : null,
    query,
    setSearch: (value) => setQuery((q) => ({ ...q, search: value })),
    setSubject: (value) => setQuery((q) => ({ ...q, subject: value })),
    setSort: (value) => setQuery((q) => ({ ...q, sort: value })),
    filteredDecks,
    subjects,
    refetch,
  };
}

// ---------------------------------------------------------------------------
// useCreateFlashcards — powers the create wizard drawer
// ---------------------------------------------------------------------------

interface UseCreateFlashcardsResult {
  isSubmitting: boolean;
  error: string | null;
  submit: (payload: {
    documentId: string;
    difficulty: FlashcardDifficulty;
    cardType: FlashcardTypeRequest;
    numberOfCards: number;
  }) => Promise<{ deckId: string } | null>;
}

export function useCreateFlashcards(): UseCreateFlashcardsResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (params: {
      documentId: string;
      difficulty: FlashcardDifficulty;
      cardType: FlashcardTypeRequest;
      numberOfCards: number;
    }) =>
      flashcardAPI.generate({
        documentId: params.documentId,
        numCards: params.numberOfCards,
        difficulty: params.difficulty,
        cardType: params.cardType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAGE_DATA_KEY });
    },
  });

  return {
    isSubmitting: mutation.isPending,
    error: mutation.error ? (mutation.error as Error).message : null,
    submit: async (payload) => {
      try {
        const result = await mutation.mutateAsync(payload);
        return { deckId: result.deck_id };
      } catch {
        return null;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// useReviewSession — powers [deckId]/page.tsx flip-card review experience
// ---------------------------------------------------------------------------

interface UseReviewSessionResult {
  cards: Flashcard[];
  currentCard: Flashcard | null;
  currentIndex: number;
  total: number;
  isFlipped: boolean;
  isLoading: boolean;
  flip: () => void;
  submitOutcome: (outcome: ReviewOutcome) => void;
  isComplete: boolean;
}

export function useReviewSession(deckId: string): UseReviewSessionResult {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const { data: raw, isLoading } = useQuery({
    queryKey: reviewKey(deckId),
    queryFn: () => flashcardAPI.getDeckReview(deckId),
    enabled: !!deckId,
  });

  const cards = useMemo(
    () => (raw ? raw.map((c) => mapReviewCard(c, deckId)) : []),
    [raw, deckId]
  );

  const submitMutation = useMutation({
    mutationFn: (params: { cardId: string; outcome: ReviewOutcome }) =>
      flashcardAPI.submitReview(deckId, params.cardId, params.outcome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAGE_DATA_KEY });
    },
  });

  const flip = () => setIsFlipped((f) => !f);

  const submitOutcome = (outcome: ReviewOutcome) => {
    const card = cards[currentIndex];
    if (!card) return;
    submitMutation.mutate({ cardId: card.id, outcome });
    setIsFlipped(false);
    setCurrentIndex((i) => Math.min(i + 1, cards.length));
  };

  return {
    cards,
    currentCard: cards[currentIndex] ?? null,
    currentIndex,
    total: cards.length,
    isFlipped,
    isLoading,
    flip,
    submitOutcome,
    isComplete: cards.length > 0 && currentIndex >= cards.length,
  };
}

// ---------------------------------------------------------------------------
// useDeleteDeck
// ---------------------------------------------------------------------------

export function useDeleteDeck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deckId: string) => flashcardAPI.delete(deckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAGE_DATA_KEY });
    },
  });
}