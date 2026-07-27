"use client";

import { useState } from "react";
import { Layers, ArrowRight, MoreVertical, Trash2 } from "lucide-react";
import { useDeleteDeck } from "@/hooks/use-flashcards";
import type { FlashcardDeck } from "@/types/flashcard";

interface DeckCardProps {
  deck: FlashcardDeck;
  onReview: (deckId: string) => void;
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

export function DeckCard({ deck, onReview }: DeckCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const deleteDeck = useDeleteDeck();

  function handleDelete() {
    deleteDeck.mutate(deck.id);
  }

  return (
<div className="group relative flex min-h-[185px] flex-col rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
<div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FF]">
            <Layers className="h-5 w-5 text-[#2563EB]" />
          </div>
          <h3 className="line-clamp-1 font-serif text-xl font-semibold text-[#111827]"></h3>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            {deck.subject}
          </span>

          {/* Overflow menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 opacity-0 transition-opacity hover:bg-neutral-100 hover:text-neutral-600 group-hover:opacity-100"
              aria-label="Deck options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                {/* click-away layer */}
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-7 z-20 w-36 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-lg">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirming(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete deck
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {confirming ? (
        <div className="flex flex-1 flex-col justify-center gap-3 py-2">
          <p className="text-xs leading-relaxed text-neutral-600">
            Delete <span className="font-medium text-[#111827]">{deck.title}</span> permanently?
            This can't be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirming(false)}
              className="flex-1 rounded-lg border border-[#E5E7EB] py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteDeck.isPending}
              className="flex-1 rounded-lg bg-rose-600 py-1.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {deleteDeck.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-neutral-500">Generated {formatLastReviewed(deck.createdAt)}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-neutral-500">
            <span>{deck.totalCards} cards</span>
            <span className="text-neutral-300">·</span>
            <span>Last reviewed: {formatLastReviewed(deck.lastReviewedAt)}</span>
          </div>

          <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
            <button
              onClick={() => onReview(deck.id)}
              className="flex items-center gap-2 text-sm font-medium text-[#2563EB] hover:translate-x-1 transition"
            >
              Review
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}