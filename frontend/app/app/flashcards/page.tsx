"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Loader2, Trash2, Play, RotateCcw, Plus, Search, Sparkles } from "lucide-react";
import { useFlashcardsPage, useDeleteDeck } from "@/hooks/use-flashcards";
import type { FlashcardDeck } from "@/types/flashcard";

function formatRelativeDate(iso: string | null): string {
  if (!iso) return "Not reviewed yet";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function DeckCard({ deck, onDelete }: { deck: FlashcardDeck; onDelete: (id: string) => void }) {
  const router = useRouter();
  const started = deck.cardsReviewed > 0;

  return (
    <div className="group flex flex-col gap-2.5 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-neutral-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <Layers className="h-4 w-4 text-[#2563EB]" />
          </div>
          <h3 className="line-clamp-1 font-serif text-sm font-semibold text-[#111827]">{deck.title}</h3>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
          {deck.subject}
        </span>
      </div>

      <p className="text-xs text-neutral-400">Generated {formatRelativeDate(deck.createdAt)}</p>

      <div className="flex items-center gap-x-2 text-xs text-neutral-500">
        <span>{deck.totalCards} cards</span>
      </div>

      {deck.masteryPercent > 0 && (
        <div className="flex items-center gap-x-2 text-xs text-neutral-500">
          <span className="font-medium text-neutral-700">{deck.masteryPercent}% mastered</span>
          <span className="text-neutral-300">·</span>
          <span>{formatRelativeDate(deck.lastReviewedAt)}</span>
        </div>
      )}

      <div className="mt-1 flex items-center justify-between border-t border-neutral-100 pt-2.5">
        <button
          onClick={() => router.push(`/app/flashcards/${deck.id}`)}
          className="flex items-center gap-1.5 text-xs font-medium text-[#2563EB] transition-all duration-200 hover:translate-x-0.5"
        >
          {started ? <RotateCcw className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {started ? "Resume" : "Start"} →
        </button>
        <button
          onClick={() => onDelete(deck.id)}
          className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-label={`Delete ${deck.title}`}
        >
          <Trash2 className="h-3.5 w-3.5 text-neutral-300 hover:text-rose-500" />
        </button>
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const router = useRouter();
  const { data, isLoading, filteredDecks, query, setSearch } = useFlashcardsPage();
  const { mutate: deleteDeck } = useDeleteDeck();

  return (
    <div className="min-h-full bg-[#F9FAFB]">
      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#111827]">AI Flashcards</h1>
            <p className="text-sm text-neutral-500">
              Generate AI-powered flashcards from your study materials for faster revision.
            </p>
          </div>
          <button
            onClick={() => router.push("/app/flashcards/create")}
            className="flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            Create Flashcards
          </button>
        </div>

        <div className="relative mb-6 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={query.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search flashcard sets..."
            className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#2563EB]"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-neutral-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !data || data.decks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <Layers className="h-7 w-7 text-[#2563EB]" />
            </div>
            <p className="font-serif text-base font-semibold text-[#111827]">No flashcard sets yet</p>
            <p className="max-w-xs text-sm text-neutral-500">Generate your first AI flashcard deck from uploaded notes.</p>
            <button
              onClick={() => router.push("/app/flashcards/create")}
              className="mt-1 flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800"
            >
              <Sparkles className="h-4 w-4" />
              Generate Flashcards
            </button>
          </div>
        ) : (
          <>
            {data.continueLearning && (
              <div className="mb-8">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  Continue Learning
                </h2>
                <button
                  onClick={() => router.push(`/app/flashcards/${data.continueLearning!.deck.id}`)}
                  className="flex w-full flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-serif text-base font-semibold text-[#111827]">
                      {data.continueLearning.deck.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Generated from {data.continueLearning.deck.sourceDocumentName}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                      {data.continueLearning.deck.masteryPercent > 0 && (
                        <>
                          <span>{data.continueLearning.deck.masteryPercent}% mastered</span>
                          <span className="text-neutral-300">·</span>
                        </>
                      )}
                      <span>{formatRelativeDate(data.continueLearning.deck.lastReviewedAt)}</span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 self-start rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white transition-transform duration-200 hover:-translate-y-0.5 sm:self-auto">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Resume Review
                  </span>
                </button>
              </div>
            )}

            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
              My Flashcard Decks
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDecks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} onDelete={deleteDeck} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}