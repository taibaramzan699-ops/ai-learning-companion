"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Loader2, Trash2, Play, RotateCcw, Plus, Search } from "lucide-react";
import { useQuizzes, useDeleteQuiz } from "@/app/app/hooks/use-quiz";
import type { QuizSummary } from "@/services/quiz_ai";

const difficultyStyles: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-600",
  medium: "bg-amber-50 text-amber-600",
  hard: "bg-rose-50 text-rose-600",
};

function formatRelativeDate(iso: string | null): string {
  if (!iso) return "Not attempted";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function QuizCard({ quiz, onDelete }: { quiz: QuizSummary; onDelete: (id: string) => void }) {
  const router = useRouter();
  const attempted = quiz.attempts_count > 0;

  return (
    <div className="group flex flex-col gap-2.5 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-neutral-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <BrainCircuit className="h-4 w-4 text-[#2563EB]" />
          </div>
          <h3 className="line-clamp-1 font-serif text-sm font-semibold text-[#111827]">{quiz.title}</h3>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${difficultyStyles[quiz.difficulty]}`}
        >
          {quiz.difficulty}
        </span>
      </div>

      <p className="text-xs text-neutral-400">Generated {formatRelativeDate(quiz.created_at)}</p>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
        <span>{quiz.question_count} questions</span>
        <span className="text-neutral-300">·</span>
        <span>{quiz.category}</span>
      </div>

      {attempted && (
        <div className="flex items-center gap-x-2 text-xs text-neutral-500">
          <span className="font-medium text-neutral-700">{quiz.best_score_pct}%</span>
          <span className="text-neutral-300">·</span>
          <span>{formatRelativeDate(quiz.last_attempt_at)}</span>
        </div>
      )}

      <div className="mt-1 flex items-center justify-between border-t border-neutral-100 pt-2.5">
        <button
          onClick={() => router.push(`/app/quiz/${quiz.id}`)}
          className="flex items-center gap-1.5 text-xs font-medium text-[#2563EB] transition-all duration-200 hover:translate-x-0.5"
        >
          {attempted ? <RotateCcw className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {attempted ? "Resume" : "Start"} →
        </button>
        <button
          onClick={() => onDelete(quiz.id)}
          className="opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          aria-label={`Delete ${quiz.title}`}
        >
          <Trash2 className="h-3.5 w-3.5 text-neutral-300 hover:text-rose-500" />
        </button>
      </div>
    </div>
  );
}

export default function QuizPage() {
  const { data: quizzes, isLoading } = useQuizzes();
  const { mutate: deleteQuiz } = useDeleteQuiz();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = (quizzes ?? []).filter((q) => q.title.toLowerCase().includes(search.toLowerCase()));
  const continueLearning = filtered.find((q) => q.attempts_count > 0 && (q.best_score_pct ?? 0) < 100);

  return (
    <div className="min-h-full bg-[#F9FAFB]">
      <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#111827]">AI Quiz</h1>
            <p className="text-sm text-neutral-500">
              Generate quizzes from your notes and test your understanding instantly.
            </p>
          </div>
          <button
            onClick={() => router.push("/app/quiz/create")}
            className="flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            Create Quiz
          </button>
        </div>

        <div className="relative mb-6 max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or document..."
            className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#2563EB]"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-neutral-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !quizzes || quizzes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <BrainCircuit className="h-7 w-7 text-[#2563EB]" />
            </div>
            <p className="font-serif text-base font-semibold text-[#111827]">No quizzes yet</p>
            <p className="max-w-xs text-sm text-neutral-500">
              Generate your first AI quiz from uploaded notes.
            </p>
            <button
              onClick={() => router.push("/app/quiz/create")}
              className="mt-1 flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              Generate Quiz
            </button>
          </div>
        ) : (
          <>
            {continueLearning && (
              <div className="mb-8">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">
                  Continue Learning
                </h2>
                <button
                  onClick={() => router.push(`/app/quiz/${continueLearning.id}`)}
                  className="flex w-full flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-serif text-base font-semibold text-[#111827]">{continueLearning.title}</h3>
                    <p className="mt-0.5 text-xs text-neutral-400">Generated from {continueLearning.source_label}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                      <span>Best score: {continueLearning.best_score_pct}%</span>
                      <span className="text-neutral-300">·</span>
                      <span className="capitalize">{continueLearning.difficulty}</span>
                      <span className="text-neutral-300">·</span>
                      <span>{formatRelativeDate(continueLearning.last_attempt_at)}</span>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 self-start rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white transition-transform duration-200 hover:-translate-y-0.5 sm:self-auto">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Resume Quiz
                  </span>
                </button>
              </div>
            )}

            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">My Quizzes</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} onDelete={deleteQuiz} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}