// frontend/components/flashcards/StudyOverviewPanel.tsx
"use client";

import { Flame, Sparkles } from "lucide-react";
import type {
  AiTip,
  FlashcardOverview,
  StudyGoal,
  StudyStreak,
} from "@/types/flashcard";
import { cn } from "@/lib/utils";

interface StudyOverviewPanelProps {
  overview: FlashcardOverview;
  goal: StudyGoal;
  streak: StudyStreak;
  tip: AiTip | null;
}

function OverviewRing({ percent }: { percent: number }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative mx-auto h-32 w-32">
      <svg viewBox="0 0 108 108" className="h-32 w-32 -rotate-90">
        <circle cx="54" cy="54" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="9" />
        <circle
          cx="54"
          cy="54"
          r={radius}
          fill="none"
          stroke="#2563EB"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-2xl font-semibold text-[#111827]">
          {percent}
        </span>
        <span className="text-[11px] text-gray-400">Total Cards</span>
      </div>
    </div>
  );
}

function StatRow({
  color,
  label,
  value,
  percent,
}: {
  color: string;
  label: string;
  value: number;
  percent: number;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2.5">
        <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
        <div>
          <p className="text-sm font-medium text-[#111827]">{value}</p>
          <p className="text-xs text-gray-400">{label}</p>
        </div>
      </div>
      <span className="text-xs font-medium text-gray-500">{percent}%</span>
    </div>
  );
}

export function StudyOverviewPanel({
  overview,
  goal,
  streak,
  tip,
}: StudyOverviewPanelProps) {
  const pct = (n: number) =>
    overview.totalCards === 0 ? 0 : Math.round((n / overview.totalCards) * 100);

  const goalPercent = goal.targetCards
    ? Math.min(100, Math.round((goal.completedCards / goal.targetCards) * 100))
    : 0;

  return (
    <aside className="flex w-full flex-col gap-4 lg:w-80">
      {/* Flashcard overview */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h4 className="font-serif text-sm font-semibold text-[#111827]">
          Your Flashcard Overview
        </h4>
        <div className="mt-4">
          <OverviewRing percent={overview.totalCards} />
        </div>
        <div className="mt-4 divide-y divide-gray-100">
          <StatRow
            color="bg-emerald-500"
            label="Mastered"
            value={overview.mastered}
            percent={pct(overview.mastered)}
          />
          <StatRow
            color="bg-amber-500"
            label="Need Review"
            value={overview.needReview}
            percent={pct(overview.needReview)}
          />
          <StatRow
            color="bg-rose-500"
            label="New Cards"
            value={overview.newCards}
            percent={pct(overview.newCards)}
          />
        </div>
      </div>

      {/* Today's goal */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="font-serif text-sm font-semibold text-[#111827]">
            Today's Goal
          </h4>
          <button className="text-xs font-medium text-[#2563EB] hover:underline">
            Edit Goal
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-500">
          <span className="font-semibold text-[#111827]">
            {goal.completedCards}
          </span>{" "}
          / {goal.targetCards} cards reviewed
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#2563EB] transition-all"
            style={{ width: `${goalPercent}%` }}
          />
        </div>
      </div>

      {/* Streak */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <h4 className="font-serif text-sm font-semibold text-[#111827]">
            Study Streak
          </h4>
        </div>
        <p className="mt-3">
          <span className="font-serif text-2xl font-semibold text-[#111827]">
            {streak.currentStreakDays}
          </span>{" "}
          <span className="text-sm text-gray-500">days in a row</span>
        </p>
        <div className="mt-3 flex justify-between">
          {streak.weekActivity.map((d, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-medium",
                  d.active
                    ? "bg-[#2563EB] text-white"
                    : "bg-gray-100 text-gray-400"
                )}
              >
                {d.day}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI tip */}
      {tip && (
        <div className="rounded-2xl border border-[#DCE7FF] bg-[#F5F8FF] p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#2563EB]" />
            <h4 className="font-serif text-sm font-semibold text-[#111827]">
              AI Tip
            </h4>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            {tip.message}
          </p>
        </div>
      )}
    </aside>
  );
}