"use client";

import { RotateCcw } from "lucide-react";
import type { ContinueLearningItem } from "@/types/flashcard";

interface ContinueLearningCardProps {
  item: ContinueLearningItem;
  onContinue: (deckId: string) => void;
}

function formatLastReviewed(iso: string | null): string {
  if (!iso) return "Not started";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ContinueLearningCard({ item, onContinue }: ContinueLearningCardProps) {
  const { deck, cardsReviewedInSession } = item;

  return (
    <button
      onClick={() => onContinue(deck.id)}
      className="flex w-full flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h3 className="font-serif text-base font-semibold text-[#111827]">{deck.title}</h3>
        <p className="mt-0.5 text-xs text-neutral-400">
          Generated from {deck.sourceDocumentName ?? deck.subject}
        </p>
        <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
          <span>{deck.totalCards} cards</span>
          <span className="text-neutral-300">·</span>
          <span>{cardsReviewedInSession} of {deck.totalCards} reviewed</span>
          <span className="text-neutral-300">·</span>
          <span>{formatLastReviewed(deck.lastReviewedAt)}</span>
        </div>
      </div>
      <span className="flex items-center gap-1.5 self-start rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white transition-transform duration-200 hover:-translate-y-0.5 sm:self-auto">
        <RotateCcw className="h-3.5 w-3.5" />
        Continue Review
      </span>
    </button>
  );
}