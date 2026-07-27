"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  Search,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { useGenerateQuiz } from "@/app/app/hooks/use-quiz";
import { useDocuments } from "@/features/documents/use-documents";
import type { QuizDifficulty, QuizQuestionType } from "@/services/quiz_ai";

type QuestionType = QuizQuestionType;

const STEPS = [
  { id: "material", label: "Study material" },
  { id: "difficulty", label: "Difficulty" },
  { id: "format", label: "Question type" },
  { id: "length", label: "Length" },
  { id: "review", label: "Review & generate" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

const difficultyOptions: { value: QuizDifficulty; label: string; hint: string }[] = [
  { value: "easy", label: "Easy", hint: "Good for a first pass" },
  { value: "medium", label: "Medium", hint: "Balanced coverage" },
  { value: "hard", label: "Hard", hint: "Exam-level recall" },
];

const questionTypeOptions: { value: QuestionType; label: string; hint: string }[] = [
  { value: "mcq", label: "Multiple choice", hint: "Four options, one correct" },
  { value: "true_false", label: "True / False", hint: "Fast recall check" },
  { value: "mixed", label: "Mixed", hint: "MCQ + True/False combined" },
];

const lengthOptions = [5, 10, 15, 20];

function estimateMinutes(numQuestions: number): number {
  return Math.max(1, Math.round((numQuestions * 35) / 60));
}

export default function CreateQuizPage() {
  const router = useRouter();
  const { data: documents, isLoading: documentsLoading } = useDocuments();
  const { mutate: generateQuiz, isPending } = useGenerateQuiz();

  const [stepIndex, setStepIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium");
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [numQuestions, setNumQuestions] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const step = STEPS[stepIndex].id;

  const readyDocuments = useMemo(
    () => (documents ?? []).filter((d) => d.status === "ready"),
    [documents]
  );
  const filteredDocuments = useMemo(
    () => readyDocuments.filter((d) => d.fileName.toLowerCase().includes(search.toLowerCase())),
    [readyDocuments, search]
  );
  const selectedDocument = readyDocuments.find((d) => d.id === documentId) ?? null;

  function canAdvanceFrom(id: StepId): boolean {
    if (id === "material") return !!documentId;
    return true;
  }

  function goNext() {
    if (!canAdvanceFrom(step)) {
      setError("Choose a document before continuing.");
      return;
    }
    setError(null);
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    if (stepIndex === 0) {
      router.push("/app/quiz");
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function goToStep(index: number) {
    // Only allow jumping to a step you've already unlocked (material chosen).
    if (index > 0 && !documentId) return;
    setError(null);
    setStepIndex(index);
  }

  function handleGenerate() {
    if (!documentId) {
      setError("Choose a document before generating.");
      setStepIndex(0);
      return;
    }
    setError(null);
    generateQuiz(
      { documentId, numQuestions, difficulty, questionType },
      {
        onSuccess: (data) => router.push(`/app/quiz/${data.quiz_id}`),
        onError: (err: Error) =>
          setError(err.message || "Couldn't generate the quiz. Try another document or fewer questions."),
      }
    );
  }

  return (
    <div className="min-h-full bg-[#F9FAFB]">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-10 sm:px-8 lg:grid-cols-[220px_1fr]">
        {/* Answer-sheet step rail */}
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <button
            onClick={() => router.push("/app/quiz")}
            className="mb-6 flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition-colors hover:text-neutral-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All quizzes
          </button>

          <h1 className="mb-1 font-serif text-lg font-semibold text-[#111827]">New AI Quiz</h1>
          <p className="mb-7 text-xs text-neutral-500">Build a quiz from your study material.</p>

          <ol className="relative flex flex-col gap-0">
            {STEPS.map((s, i) => {
              const isDone = i < stepIndex;
              const isCurrent = i === stepIndex;
              const isLocked = i > 0 && !documentId && i !== stepIndex;
              return (
                <li key={s.id} className="relative flex gap-3 pb-7 last:pb-0">
                  {i < STEPS.length - 1 && (
                    <span
                      className={`absolute left-[13px] top-6 h-full w-px ${
                        isDone ? "bg-[#2563EB]" : "bg-neutral-200"
                      }`}
                      aria-hidden
                    />
                  )}
                  <button
                    onClick={() => goToStep(i)}
                    disabled={isLocked}
                    className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors ${
                      isDone
                        ? "border-[#2563EB] bg-[#2563EB] text-white"
                        : isCurrent
                          ? "border-[#2563EB] bg-white text-[#2563EB]"
                          : "border-neutral-200 bg-white text-neutral-300"
                    } ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </button>
                  <button
                    onClick={() => goToStep(i)}
                    disabled={isLocked}
                    className={`pt-0.5 text-left text-sm transition-colors ${
                      isCurrent
                        ? "font-medium text-[#111827]"
                        : isDone
                          ? "text-neutral-600"
                          : "text-neutral-300"
                    } ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Step content */}
        <div className="flex flex-col">
          <div className="min-h-[420px] rounded-2xl border border-[#E5E7EB] bg-white p-7 shadow-sm">
            {step === "material" && (
              <div>
                <h2 className="mb-1 font-serif text-lg font-semibold text-[#111827]">
                  Which material should this come from?
                </h2>
                <p className="mb-5 text-sm text-neutral-500">
                  Only documents that finished processing show up here.
                </p>

                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search your documents..."
                    className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#2563EB]"
                  />
                </div>

                {documentsLoading ? (
                  <div className="flex items-center justify-center py-16 text-neutral-400">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : readyDocuments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#E5E7EB] py-10 text-center">
                    <p className="text-sm text-neutral-500">
                      No processed documents yet — upload one before generating a quiz.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                    {filteredDocuments.map((doc) => {
                      const selected = documentId === doc.id;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => {
                            setDocumentId(doc.id);
                            setError(null);
                          }}
                          className={`flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm transition-all duration-150 ${
                            selected
                              ? "border-[#2563EB] bg-blue-50"
                              : "border-[#E5E7EB] hover:border-blue-200 hover:bg-blue-50/40"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <FileText className="h-4 w-4 shrink-0 text-neutral-400" />
                            <span className="truncate text-[#111827]">{doc.fileName}</span>
                          </span>
                          {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2563EB]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {step === "difficulty" && (
              <div>
                <h2 className="mb-1 font-serif text-lg font-semibold text-[#111827]">
                  How hard should the questions be?
                </h2>
                <p className="mb-6 text-sm text-neutral-500">You can generate another difficulty later.</p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {difficultyOptions.map((opt) => {
                    const selected = difficulty === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setDifficulty(opt.value)}
                        className={`rounded-xl border-2 px-4 py-4 text-left transition-all duration-150 ${
                          selected
                            ? "border-[#2563EB] bg-blue-50"
                            : "border-[#E5E7EB] hover:border-neutral-300"
                        }`}
                      >
                        <p className={`text-sm font-semibold ${selected ? "text-[#2563EB]" : "text-[#111827]"}`}>
                          {opt.label}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">{opt.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === "format" && (
              <div>
                <h2 className="mb-1 font-serif text-lg font-semibold text-[#111827]">
                  What format should the questions take?
                </h2>
                <p className="mb-6 text-sm text-neutral-500">Choose the style that fits how you'll study.</p>

                <div className="flex flex-col gap-2.5">
                  {questionTypeOptions.map((opt) => {
                    const selected = questionType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setQuestionType(opt.value)}
                        className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all duration-150 ${
                          selected
                            ? "border-[#2563EB] bg-blue-50"
                            : "border-[#E5E7EB] hover:border-neutral-300"
                        }`}
                      >
                        <span>
                          <span className={`block text-sm font-medium ${selected ? "text-[#2563EB]" : "text-[#111827]"}`}>
                            {opt.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-neutral-500">{opt.hint}</span>
                        </span>
                        {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2563EB]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === "length" && (
              <div>
                <h2 className="mb-1 font-serif text-lg font-semibold text-[#111827]">
                  How many questions?
                </h2>
                <p className="mb-6 text-sm text-neutral-500">Longer quizzes take a little longer to complete.</p>

                <div className="grid grid-cols-4 gap-3">
                  {lengthOptions.map((n) => {
                    const selected = numQuestions === n;
                    return (
                      <button
                        key={n}
                        onClick={() => setNumQuestions(n)}
                        className={`flex flex-col items-center gap-1 rounded-xl border-2 py-4 transition-all duration-150 ${
                          selected
                            ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                            : "border-[#E5E7EB] text-[#111827] hover:border-neutral-300"
                        }`}
                      >
                        <span className="text-xl font-semibold">{n}</span>
                        <span className="text-[11px] text-neutral-500">questions</span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-4 text-xs text-neutral-500">
                  Estimated time: <span className="font-medium text-neutral-700">~{estimateMinutes(numQuestions)} min</span>
                </p>
              </div>
            )}

            {step === "review" && (
              <div>
                <h2 className="mb-1 font-serif text-lg font-semibold text-[#111827]">Ready to generate</h2>
                <p className="mb-6 text-sm text-neutral-500">Double-check the setup, then generate your quiz.</p>

                <dl className="divide-y divide-neutral-100 rounded-xl border border-[#E5E7EB]">
                  {[
                    ["Study material", selectedDocument?.fileName ?? "—"],
                    ["Difficulty", difficultyOptions.find((d) => d.value === difficulty)?.label],
                    ["Question type", questionTypeOptions.find((q) => q.value === questionType)?.label],
                    ["Length", `${numQuestions} questions · ~${estimateMinutes(numQuestions)} min`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
                      <dt className="text-neutral-500">{label}</dt>
                      <dd className="font-medium text-[#111827]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {error && (
              <div className="mt-6 flex items-start gap-2 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2.5 text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Sticky footer nav */}
          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:border-neutral-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            {step === "review" ? (
              <button
                onClick={handleGenerate}
                disabled={isPending}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#111827] to-[#1f2937] px-6 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate AI Quiz
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 rounded-xl bg-[#111827] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}