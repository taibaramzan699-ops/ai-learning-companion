"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { useQuizIntro, useQuizDetail, useSubmitQuiz } from "@/app/app/hooks/use-quiz";
import type { QuizResult } from "@/services/quiz_ai";

const difficultyStyles: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-600",
  medium: "bg-amber-50 text-amber-600",
  hard: "bg-rose-50 text-rose-600",
};

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function gradeColor(pct: number): string {
  if (pct >= 80) return "text-emerald-600";
  if (pct >= 50) return "text-amber-600";
  return "text-rose-600";
}

type View = "intro" | "taking" | "result";

export default function QuizTakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: quizId } = use(params);
  const router = useRouter();

  const { data: intro, isLoading: introLoading } = useQuizIntro(quizId);
  const { data: detail, isLoading: detailLoading } = useQuizDetail(quizId);
  const { mutate: submitQuiz, isPending: isSubmitting } = useSubmitQuiz();

  const [view, setView] = useState<View>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (view !== "taking" || startedAt === null) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [view, startedAt]);

  const questions = detail?.questions ?? [];
  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasAnsweredCurrent = currentQuestion ? answers[currentQuestion.id] !== undefined : false;
  const answeredCount = Object.keys(answers).length;

  function handleStart() {
    setAnswers({});
    setCurrentIndex(0);
    setStartedAt(Date.now());
    setElapsed(0);
    setSubmitError(null);
    setView("taking");
  }

  function selectAnswer(questionId: string, optionIndex: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  function goNext() {
    if (isLastQuestion) {
      handleSubmit();
      return;
    }
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
  }

  function goPrev() {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }

  function handleSubmit() {
    const timeTakenSeconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : undefined;
    setSubmitError(null);
    submitQuiz(
      { quizId, answers, timeTakenSeconds },
      {
        onSuccess: (data) => {
          setResult(data);
          setView("result");
        },
        onError: (err: Error) => setSubmitError(err.message || "Couldn't submit your answers. Please try again."),
      }
    );
  }

  const isLoading = introLoading || detailLoading;

  return (
    <div className="min-h-full bg-[#F9FAFB]">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
        <button
          onClick={() => router.push("/app/quiz")}
          className="mb-6 flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All quizzes
        </button>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-neutral-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !intro ? (
          <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-24 text-center">
            <p className="text-sm text-neutral-500">This quiz couldn't be found.</p>
          </div>
        ) : view === "intro" ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                <BrainCircuit className="h-6 w-6 text-[#2563EB]" />
              </div>
              <div>
                <h1 className="font-serif text-xl font-semibold text-[#111827]">{intro.title}</h1>
                <p className="text-sm text-neutral-500">From {intro.source_label}</p>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${difficultyStyles[intro.difficulty]}`}
              >
                {intro.difficulty}
              </span>
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                {intro.question_count} questions
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                <Clock className="h-3 w-3" />
                ~{intro.estimated_minutes} min
              </span>
            </div>

            {intro.topics.length > 0 && (
              <div className="mb-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">Covers</p>
                <div className="flex flex-wrap gap-1.5">
                  {intro.topics.map((topic) => (
                    <span key={topic} className="rounded-full border border-[#E5E7EB] px-2.5 py-1 text-xs text-neutral-600">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {intro.attempts_count > 0 && (
              <div className="mb-6 rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                Best score so far: <span className="font-semibold text-[#111827]">{intro.best_score_pct}%</span> across{" "}
                {intro.attempts_count} attempt{intro.attempts_count > 1 ? "s" : ""}
              </div>
            )}

            <button
              onClick={handleStart}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] py-3 text-sm font-medium text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-neutral-800"
            >
              <Sparkles className="h-4 w-4" />
              {intro.attempts_count > 0 ? "Retake Quiz" : "Start Quiz"}
            </button>
          </div>
        ) : view === "taking" && currentQuestion ? (
          <div>
            <div className="mb-4 flex items-center justify-between text-xs text-neutral-500">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="flex items-center gap-1 font-medium text-neutral-600">
                <Clock className="h-3.5 w-3.5" />
                {formatClock(elapsed)}
              </span>
            </div>

            <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-7 shadow-sm">
              <h2 className="mb-5 font-serif text-lg font-semibold leading-snug text-[#111827]">
                {currentQuestion.question}
              </h2>

              <div className={`grid gap-2.5 ${currentQuestion.question_type === "true_false" ? "grid-cols-2" : "grid-cols-1"}`}>
                {currentQuestion.options.map((option, idx) => {
                  const selected = answers[currentQuestion.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => selectAnswer(currentQuestion.id, idx)}
                      className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3.5 text-left text-sm transition-all duration-150 ${
                        selected
                          ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                          : "border-[#E5E7EB] text-[#111827] hover:border-neutral-300"
                      } ${currentQuestion.question_type === "true_false" ? "justify-center font-medium" : ""}`}
                    >
                      <span>{option}</span>
                      {selected && currentQuestion.question_type !== "true_false" && (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {submitError && (
              <div className="mb-4 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2.5 text-sm text-rose-700">
                {submitError}
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>

              <span className="text-xs text-neutral-400">{answeredCount}/{questions.length} answered</span>

              <button
                onClick={goNext}
                disabled={!hasAnsweredCurrent || isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-[#111827] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLastQuestion ? (
                  isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit Quiz"
                  )
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : view === "result" && result ? (
          <div>
            <div className="mb-6 rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 mx-auto">
                <Trophy className="h-7 w-7 text-[#2563EB]" />
              </div>
              <p className={`font-serif text-4xl font-bold ${gradeColor(result.percentage)}`}>{result.percentage}%</p>
              <p className="mt-1 text-sm text-neutral-500">
                {result.score} of {result.total} correct · Grade {result.grade}
                {result.time_taken_seconds != null && <> · {formatClock(result.time_taken_seconds)}</>}
              </p>

              {result.ai_feedback && (
                <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-neutral-600">{result.ai_feedback}</p>
              )}

              {(result.strong_topics.length > 0 || result.weak_topics.length > 0) && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
                  {result.strong_topics.map((t) => (
                    <span key={t} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                      {t}
                    </span>
                  ))}
                  {result.weak_topics.map((t) => (
                    <span key={t} className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-600">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={handleStart}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300"
              >
                Retake Quiz
              </button>
              <button
                onClick={() => router.push("/app/quiz")}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#111827] py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Back to Quizzes
              </button>
            </div>

            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-400">Review</h2>
            <div className="flex flex-col gap-3">
              {result.results.map((r, i) => (
                <div key={r.question_id} className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
                  <div className="mb-3 flex items-start gap-2.5">
                    {r.is_correct ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                    )}
                    <p className="text-sm font-medium text-[#111827]">
                      {i + 1}. {r.question}
                    </p>
                  </div>
                  <div className="ml-6.5 space-y-1.5 pl-[26px] text-sm">
                    {r.options.map((opt, idx) => {
                      const isCorrectOpt = idx === r.correct_answer;
                      const isSelectedOpt = idx === r.selected_answer;
                      return (
                        <p
                          key={idx}
                          className={
                            isCorrectOpt
                              ? "font-medium text-emerald-600"
                              : isSelectedOpt
                                ? "font-medium text-rose-600"
                                : "text-neutral-500"
                          }
                        >
                          {opt}
                          {isCorrectOpt && " ✓"}
                          {isSelectedOpt && !isCorrectOpt && " (your answer)"}
                        </p>
                      );
                    })}
                    {r.explanation && <p className="pt-1.5 text-xs text-neutral-500">{r.explanation}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}