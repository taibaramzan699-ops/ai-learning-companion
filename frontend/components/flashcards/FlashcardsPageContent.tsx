"use client";

import { useRouter } from "next/navigation";
import { Plus, Sparkles, Search, Loader2 } from "lucide-react";
import { ContinueLearningCard } from "@/components/flashcards/ContinueLearningCard";
import { DeckCard } from "@/components/flashcards/DeckCard";
import { useFlashcardsPage } from "@/hooks/use-flashcards";

export function FlashcardsPageContent() {
  const router = useRouter();
  const { data, isLoading, query, setSearch, filteredDecks } = useFlashcardsPage();

  const goToReview = (deckId: string) => router.push(`/app/flashcards/${deckId}`);
  const goToCreate = () => router.push("/app/flashcards/create");

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
            onClick={goToCreate}
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
            placeholder="Search your flashcard sets..."
            className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#2563EB]"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-neutral-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : filteredDecks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <Sparkles className="h-7 w-7 text-[#2563EB]" />
            </div>
            <p className="font-serif text-base font-semibold text-[#111827]">No flashcard sets yet</p>
            <p className="max-w-xs text-sm text-neutral-500">
              Generate your first AI flashcard deck from uploaded notes.
            </p>
            <button
              onClick={goToCreate}
              className="mt-1 flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              Create Flashcards
            </button>
          </div>
        ) : (
          <>
            {data?.continueLearning && (
              <div className="mb-8">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  Continue Learning
                </h2>
                <ContinueLearningCard item={data.continueLearning} onContinue={goToReview} />
              </div>
            )}

            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
              My Flashcard Sets
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDecks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} onReview={goToReview} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}