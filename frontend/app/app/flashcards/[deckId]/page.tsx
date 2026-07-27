"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Layers, Loader2, Sparkles } from "lucide-react";
import { useReviewSession } from "@/hooks/use-flashcards";

export default function FlashcardReviewPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);
  const router = useRouter();
  const [started, setStarted] = useState(false);

  const { currentCard, currentIndex, total, isFlipped, isLoading, flip, submitOutcome, isComplete } =
    useReviewSession(deckId);

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#F9FAFB] py-24 text-neutral-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F9FAFB]">
      <div className="mx-auto max-w-2xl px-6 py-10 sm:px-8">
        <button
          onClick={() => router.push("/app/flashcards")}
          className="mb-6 flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All flashcard sets
        </button>

        {!started ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
              <Layers className="h-6 w-6 text-[#2563EB]" />
            </div>
            <h1 className="font-serif text-xl font-semibold text-[#111827]">Ready to review</h1>
            <p className="mt-1 text-sm text-neutral-500">{total} cards in this deck</p>
            <button
              onClick={() => setStarted(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] py-3 text-sm font-medium text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-neutral-800"
            >
              <Sparkles className="h-4 w-4" />
              Start Review
            </button>
          </div>
        ) : isComplete ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
            <h1 className="font-serif text-xl font-semibold text-[#111827]">Session complete</h1>
            <p className="mt-1 text-sm text-neutral-500">You reviewed all {total} cards in this deck.</p>
            <button
              onClick={() => router.push("/app/flashcards")}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] py-3 text-sm font-medium text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-neutral-800"
            >
              Back to Flashcards
            </button>
          </div>
        ) : currentCard ? (
          <div>
            <div className="mb-4 flex items-center justify-between text-xs text-neutral-500">
              <span>
                Card {currentIndex + 1} of {total}
              </span>
            </div>

            <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
              />
            </div>

            <div
              onClick={!isFlipped ? flip : undefined}
              className="relative h-72 [perspective:1400px]"
              style={{ cursor: !isFlipped ? "pointer" : "default" }}
            >
              <div
                className="relative h-full w-full transition-transform duration-500 ease-out [transform-style:preserve-3d]"
                style={{ transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
              >
                {/* Front — question */}
                <div className="absolute inset-0 flex flex-col rounded-2xl border border-[#E5E7EB] bg-white p-7 shadow-sm [backface-visibility:hidden]">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">Question</p>
                  <p className="flex-1 font-serif text-lg font-semibold leading-snug text-[#111827]">
                    {currentCard.front}
                  </p>
                  <p className="text-center text-xs text-neutral-400">Tap card to reveal answer</p>
                </div>

                {/* Back — answer */}
                <div
                  className="absolute inset-0 flex flex-col rounded-2xl border border-[#E5E7EB] bg-white p-7 shadow-sm [backface-visibility:hidden]"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-neutral-400">Answer</p>
                  <p className="flex-1 text-base leading-relaxed text-[#111827]">{currentCard.back}</p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              {isFlipped && (
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    onClick={() => submitOutcome("difficult")}
                    className="rounded-xl border-2 border-[#E5E7EB] py-3 text-sm font-medium text-rose-600 transition-all duration-150 hover:border-rose-200 hover:bg-rose-50"
                  >
                    Again
                  </button>
                  <button
                    onClick={() => submitOutcome("review_again")}
                    className="rounded-xl border-2 border-[#E5E7EB] py-3 text-sm font-medium text-amber-600 transition-all duration-150 hover:border-amber-200 hover:bg-amber-50"
                  >
                    Good
                  </button>
                  <button
                    onClick={() => submitOutcome("know")}
                    className="rounded-xl border-2 border-[#E5E7EB] py-3 text-sm font-medium text-emerald-600 transition-all duration-150 hover:border-emerald-200 hover:bg-emerald-50"
                  >
                    Easy
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}