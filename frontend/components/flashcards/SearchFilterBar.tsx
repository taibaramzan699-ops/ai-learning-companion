// frontend/components/flashcards/SearchFilterBar.tsx
"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { DeckSortOption } from "@/types/flashcard";

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  subject: string;
  onSubjectChange: (value: string) => void;
  subjects: string[];
  sort: DeckSortOption;
  onSortChange: (value: DeckSortOption) => void;
}

const SORT_LABELS: Record<DeckSortOption, string> = {
  recent: "Recent",
  alphabetical: "A–Z",
  mastery: "Mastery",
  cards: "Card Count",
};

export function SearchFilterBar({
  search,
  onSearchChange,
  subject,
  onSubjectChange,
  subjects,
  sort,
  onSortChange,
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search your flashcard sets..."
          className="h-12 rounded-xl border-gray-200 bg-white pl-11 text-sm text-[#111827] shadow-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-[#2563EB]/40"
        />
      </div>

      <Select
        value={subject}
        onValueChange={(v: string | null) => onSubjectChange(v ?? "all")}
      >
        <SelectTrigger className="h-12 w-full rounded-xl border-gray-200 bg-white text-sm text-[#111827] shadow-sm sm:w-[190px]">
          <SlidersHorizontal className="mr-2 h-4 w-4 text-gray-400" />
          <SelectValue placeholder="All Subjects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Subjects</SelectItem>
          {subjects.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={sort}
        onValueChange={(v: string | null) =>
          onSortChange((v as DeckSortOption) ?? "recent")
        }
      >
        <SelectTrigger className="h-12 w-full rounded-xl border-gray-200 bg-white text-sm text-[#111827] shadow-sm sm:w-[160px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(SORT_LABELS) as DeckSortOption[]).map((key) => (
            <SelectItem key={key} value={key}>
              Sort: {SORT_LABELS[key]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}