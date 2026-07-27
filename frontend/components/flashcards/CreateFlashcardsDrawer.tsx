"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Loader2, Search, Sparkles, AlertTriangle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useDocuments } from "@/features/documents/use-documents";
import { useCreateFlashcards } from "@/hooks/use-flashcards";
import type { FlashcardDifficulty, FlashcardTypeRequest } from "@/types/flashcard";

const difficultyOptions: { value: FlashcardDifficulty; label: string; hint: string }[] = [
  { value: "easy", label: "Easy", hint: "Core terms and definitions" },
  { value: "medium", label: "Medium", hint: "Balanced coverage" },
  { value: "hard", label: "Hard", hint: "Nuanced, exam-level cards" },
];

const cardTypeOptions: { value: FlashcardTypeRequest; label: string; hint: string }[] = [
  { value: "definition", label: "Definition", hint: "Term on the front, definition on the back" },
  { value: "qa", label: "Question & Answer", hint: "A question you have to answer" },
  { value: "concept", label: "Concept Review", hint: "Broader concept, explained on the back" },
  { value: "mixed", label: "Mixed", hint: "A blend of all formats" },
];

const CARD_COUNT_OPTIONS = [10, 15, 20, 25, 30];

function SectionHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-semibold text-[#2563EB]">
          {step}
        </span>
        <h3 className="font-serif text-sm font-semibold text-[#111827]">{title}</h3>
      </div>
      <div className="mt-3 border-b border-neutral-100" />
    </div>
  );
}

export function CreateFlashcardsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { data: documents, isLoading: documentsLoading } = useDocuments();
  const { submit, isSubmitting, error: submitError } = useCreateFlashcards();

  const [search, setSearch] = useState("");
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<FlashcardDifficulty>("medium");
  const [cardType, setCardType] = useState<FlashcardTypeRequest>("mixed");
  const [numberOfCards, setNumberOfCards] = useState(20);
  const [localError, setLocalError] = useState<string | null>(null);

  const readyDocuments = useMemo(() => (documents ?? []).filter((d) => d.status === "ready"), [documents]);
  const filteredDocuments = useMemo(
    () => readyDocuments.filter((d) => d.fileName.toLowerCase().includes(search.toLowerCase())),
    [readyDocuments, search]
  );

  function resetState() {
    setSearch("");
    setDocumentId(null);
    setDifficulty("medium");
    setCardType("mixed");
    setNumberOfCards(20);
    setLocalError(null);
  }

  async function handleGenerate() {
    if (!documentId) {
      setLocalError("Choose a document before generating.");
      return;
    }
    setLocalError(null);
    const result = await submit({ documentId, difficulty, cardType, numberOfCards });
    if (result) {
      onOpenChange(false);
      resetState();
      router.push(`/app/flashcards/${result.deckId}`);
    }
  }

  const error = localError ?? submitError;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-[520px]">
        <div className="flex h-full flex-col">
          <SheetHeader className="gap-3 border-b border-neutral-100 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                <Sparkles className="h-5 w-5 text-[#2563EB]" />
              </div>
              <div>
                <SheetTitle className="font-serif text-lg font-semibold text-[#111827]">
                  Create Flashcards
                </SheetTitle>
                <SheetDescription className="text-sm text-neutral-500">
                  AI will generate smart flashcards from your materials.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Step 1 — Study material */}
            <SectionHeader step={1} title="Select Study Material" />
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search uploaded documents..."
                className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#2563EB]"
              />
            </div>

            {documentsLoading ? (
              <div className="flex items-center justify-center py-10 text-neutral-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : readyDocuments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E5E7EB] py-8 text-center">
                <p className="text-sm text-neutral-500">No processed documents yet — upload one first.</p>
              </div>
            ) : (
              <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                {filteredDocuments.map((doc) => {
                  const selected = documentId === doc.id;
                  const pageCount = (doc as { pageCount?: number }).pageCount;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setDocumentId(doc.id);
                        setLocalError(null);
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
                      <span className="flex shrink-0 items-center gap-2">
                        {pageCount != null && <span className="text-xs text-neutral-400">{pageCount}p</span>}
                        {selected && <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Step 2 — Difficulty */}
            <div className="mt-8">
              <SectionHeader step={2} title="Difficulty" />
              <div className="grid grid-cols-3 gap-2.5">
                {difficultyOptions.map((opt) => {
                  const selected = difficulty === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setDifficulty(opt.value)}
                      className={`rounded-xl border-2 px-3 py-3 text-center transition-all duration-150 ${
                        selected ? "border-[#2563EB] bg-blue-50" : "border-[#E5E7EB] hover:border-neutral-300"
                      }`}
                    >
                      <p className={`text-sm font-semibold ${selected ? "text-[#2563EB]" : "text-[#111827]"}`}>
                        {opt.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3 — Flashcard type */}
            <div className="mt-8">
              <SectionHeader step={3} title="Flashcard Type" />
              <div className="flex flex-col gap-2.5">
                {cardTypeOptions.map((opt) => {
                  const selected = cardType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setCardType(opt.value)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all duration-150 ${
                        selected ? "border-[#2563EB] bg-blue-50" : "border-[#E5E7EB] hover:border-neutral-300"
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

            {/* Step 4 — Number of cards */}
            <div className="mt-8">
              <SectionHeader step={4} title="Number of Cards" />
              <div className="grid grid-cols-5 gap-2">
                {CARD_COUNT_OPTIONS.map((n) => {
                  const selected = numberOfCards === n;
                  return (
                    <button
                      key={n}
                      onClick={() => setNumberOfCards(n)}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border-2 py-3 transition-all duration-150 ${
                        selected
                          ? "border-[#2563EB] bg-blue-50 text-[#2563EB]"
                          : "border-[#E5E7EB] text-[#111827] hover:border-neutral-300"
                      }`}
                    >
                      <span className="text-base font-semibold">{n}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-neutral-500">Recommended: 10–30 cards per deck.</p>
            </div>

            {error && (
              <div className="mt-6 flex items-start gap-2 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2.5 text-sm text-rose-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Step 5 — Generate, pinned to the bottom */}
          <div className="border-t border-neutral-100 bg-white px-6 py-5">
            <button
              onClick={handleGenerate}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#111827] to-[#1f2937] py-3 text-sm font-medium text-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Flashcards
                </>
              )}
            </button>
            <p className="mt-2 text-center text-xs text-neutral-400">Estimated time: 1–2 minutes</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}