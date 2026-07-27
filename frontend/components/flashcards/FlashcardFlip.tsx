// frontend/components/flashcards/FlashcardFlip.tsx
"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Flashcard } from "@/types/flashcard";
import { cn } from "@/lib/utils";

interface FlashcardFlipProps {
  card: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}

const CARD_TYPE_LABEL: Record<Flashcard["cardType"], string> = {
  definition: "Definition",
  qa: "Question & Answer",
  concept: "Concept Review",
};

export function FlashcardFlip({ card, isFlipped, onFlip }: FlashcardFlipProps) {
  return (
    <div className="mx-auto w-full max-w-xl [perspective:1600px]">
      <motion.div
        role="button"
        tabIndex={0}
        onClick={onFlip}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onFlip();
          }
        }}
        className="relative h-80 w-full cursor-pointer select-none [transform-style:preserve-3d]"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Front */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-md [backface-visibility:hidden]"
          )}
        >
          <Badge className="mb-4 rounded-full bg-[#EFF4FF] font-normal text-[#2563EB] hover:bg-[#EFF4FF]">
            {CARD_TYPE_LABEL[card.cardType]}
          </Badge>
          <p className="font-serif text-xl font-medium leading-relaxed text-[#111827]">
            {card.front}
          </p>
          <span className="mt-6 text-xs font-medium uppercase tracking-wide text-gray-400">
            Tap to reveal
          </span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-[#DCE7FF] bg-[#F5F8FF] p-8 text-center shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          <div className="mb-4 flex items-center gap-1.5 text-[#2563EB]">
            <Sparkles className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">
              Answer
            </span>
          </div>
          <p className="font-serif text-lg font-medium leading-relaxed text-[#111827]">
            {card.back}
          </p>
        </div>
      </motion.div>
    </div>
  );
}