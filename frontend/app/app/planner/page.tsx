"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  ListTodo,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Priority = "low" | "medium" | "high";
type FilterTab = "all" | "pending" | "completed" | "overdue" | "today";
type SortBy = "newest" | "deadline" | "priority";

interface Task {
  id: string;
  title: string;
  subject: string;
  deadline: string; // ISO date, e.g. "2026-07-28"
  priority: Priority;
  completed: boolean;
  createdAt: string;
}

const STORAGE_KEY = "study-planner-tasks";

const PRIORITY_STYLES: Record<Priority, { label: string; badge: string; bar: string }> = {
  high: { label: "High", badge: "bg-rose-50 text-rose-600", bar: "bg-rose-400" },
  medium: { label: "Medium", badge: "bg-amber-50 text-amber-600", bar: "bg-amber-400" },
  low: { label: "Low", badge: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-400" },
};

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Today" },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "deadline", label: "Deadline" },
  { value: "priority", label: "Priority" },
];

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(task: Task) {
  return !task.completed && task.deadline < todayISO();
}

function isToday(task: Task) {
  return task.deadline === todayISO();
}

function formatDeadline(iso: string): { label: string; overdue: boolean } {
  const date = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: "Today", overdue: false };
  if (diffDays === 1) return { label: "Tomorrow", overdue: false };
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, overdue: true };
  return {
    label: date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
    overdue: false,
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

interface TaskFormValue {
  title: string;
  subject: string;
  deadline: string;
  priority: Priority;
}

const EMPTY_FORM: TaskFormValue = {
  title: "",
  subject: "",
  deadline: todayISO(),
  priority: "medium",
};

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: "blue" | "emerald" | "amber" | "rose";
}) {
  const colorMap = {
    blue: { bg: "bg-blue-50", text: "text-[#2563EB]" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    rose: { bg: "bg-rose-50", text: "text-rose-600" },
  }[color];

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", colorMap.bg)}>
        <Icon className={cn("h-5 w-5", colorMap.text)} />
      </div>
      <div className="min-w-0">
        <p className="font-serif text-xl font-semibold text-[#111827]">{value}</p>
        <p className="text-xs text-neutral-500">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ task }: { task: Task }) {
  if (task.completed) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    );
  }
  if (isOverdue(task)) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-600">
        <TriangleAlert className="h-3 w-3" />
        Overdue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
      <Circle className="h-3 w-3" />
      Pending
    </span>
  );
}

// ---------------------------------------------------------------------------
// Add / Edit modal
// ---------------------------------------------------------------------------

function TaskFormModal({
  initial,
  onCancel,
  onSave,
}: {
  initial: TaskFormValue;
  onCancel: () => void;
  onSave: (value: TaskFormValue) => void;
}) {
  const [form, setForm] = useState<TaskFormValue>(initial);
  const isEditing = Boolean(initial.title);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#111827] text-white">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold leading-tight text-[#111827]">
                {isEditing ? "Edit Task" : "Add Task"}
              </h2>
              <p className="text-xs text-neutral-500">
                {isEditing ? "Update your task details" : "Plan a new study task"}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-500">Task title</label>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Finish CSS Flexbox notes"
              className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm text-[#111827] outline-none transition-colors focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-500">Subject / Category</label>
            <input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Web Development"
              className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm text-[#111827] outline-none transition-colors focus:border-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm text-[#111827] outline-none transition-colors focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">Priority</label>
              <div className="relative">
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}
                  className="w-full appearance-none rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 pr-9 text-sm text-[#111827] outline-none transition-colors focus:border-[#2563EB]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-neutral-100 px-6 py-5">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[#E5E7EB] py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            onClick={() => form.title.trim() && onSave(form)}
            disabled={!form.title.trim()}
            className="flex-1 rounded-xl bg-[#111827] py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-neutral-800 disabled:opacity-40"
          >
            Save Task
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StudyPlannerPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortBy>("deadline");

  useEffect(() => {
    setTasks(loadTasks());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveTasks(tasks);
  }, [tasks, hydrated]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const overdue = tasks.filter((t) => isOverdue(t)).length;
    const pending = total - completed - overdue;
    return { total, completed, overdue, pending };
  }, [tasks]);

  const progressPct = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  const visibleTasks = useMemo(() => {
    let result = [...tasks];

    switch (filterTab) {
      case "pending":
        result = result.filter((t) => !t.completed && !isOverdue(t));
        break;
      case "completed":
        result = result.filter((t) => t.completed);
        break;
      case "overdue":
        result = result.filter((t) => isOverdue(t));
        break;
      case "today":
        result = result.filter((t) => isToday(t));
        break;
    }

    switch (sortBy) {
      case "deadline":
        result.sort((a, b) => a.deadline.localeCompare(b.deadline));
        break;
      case "priority":
        result.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
        break;
      case "newest":
      default:
        result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    // Completed tasks always sink to the bottom, regardless of sort.
    result.sort((a, b) => Number(a.completed) - Number(b.completed));

    return result;
  }, [tasks, filterTab, sortBy]);

  function openAddModal() {
    setEditingTask(null);
    setModalOpen(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  function handleSave(value: TaskFormValue) {
    if (editingTask) {
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, ...value } : t)));
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        ...value,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [...prev, newTask]);
    }
    setModalOpen(false);
    setEditingTask(null);
  }

  function toggleComplete(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  function deleteTask(id: string) {
    if (window.confirm("Delete this task?")) {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    }
  }

  return (
    <div className="min-h-full bg-[#F9FAFB]">
      <div className="mx-auto max-w-4xl space-y-8 px-6 py-8 sm:px-8">
        {/* Hero header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-[#111827]">
              {getGreeting()} 👋
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Stay organized and keep your learning on track.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex shrink-0 items-center gap-2 self-start rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5 hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>

        {tasks.length > 0 && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard icon={ListTodo} label="Total Tasks" value={stats.total} color="blue" />
              <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="emerald" />
              <StatCard icon={Clock} label="Pending" value={stats.pending} color="amber" />
              <StatCard icon={TriangleAlert} label="Overdue" value={stats.overdue} color="rose" />
            </div>

            {/* Progress bar */}
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-serif text-sm font-semibold text-[#111827]">Overall Progress</p>
                <span className="text-sm font-medium text-[#2563EB]">{progressPct}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-[#2563EB] transition-all duration-500 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-2.5 text-xs text-neutral-500">
                {stats.completed} of {stats.total} tasks completed
                {progressPct === 100
                  ? " — everything's done, nice work!"
                  : progressPct >= 50
                  ? " — keep going, you're making great progress."
                  : ""}
              </p>
            </div>

            {/* Filters + sort */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-1.5">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilterTab(tab.value)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                      filterTab === tab.value
                        ? "bg-[#111827] text-white"
                        : "bg-white text-neutral-600 border border-[#E5E7EB] hover:border-neutral-300"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="appearance-none rounded-xl border border-[#E5E7EB] bg-white py-2 pl-3.5 pr-9 text-xs font-medium text-neutral-600 outline-none focus:border-[#2563EB]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Sort: {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
              </div>
            </div>
          </>
        )}

        {/* Task list */}
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
              <CalendarDays className="h-7 w-7 text-[#2563EB]" />
            </div>
            <p className="font-serif text-base font-semibold text-[#111827]">No Tasks Yet</p>
            <p className="max-w-xs text-sm text-neutral-500">
              Start planning your study schedule.
            </p>
            <button
              onClick={openAddModal}
              className="mt-1 flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              Add Your First Task
            </button>
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
            <p className="text-sm text-neutral-500">No tasks match this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTasks.map((task) => {
              const { label: deadlineLabel } = formatDeadline(task.deadline);
              const priority = PRIORITY_STYLES[task.priority];
              return (
                <div
                  key={task.id}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-4 pl-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-xl",
                    task.completed && "opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-0 h-full w-1",
                      task.completed ? "bg-neutral-200" : priority.bar
                    )}
                  />

                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleComplete(task.id)}
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all active:scale-90",
                        task.completed
                          ? "border-[#2563EB] bg-[#2563EB] text-white"
                          : "border-neutral-300 text-transparent hover:border-[#2563EB]"
                      )}
                      aria-label="Toggle complete"
                    >
                      <Check className="h-3 w-3" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "font-serif text-sm font-semibold text-[#111827]",
                          task.completed && "line-through"
                        )}
                      >
                        {task.title}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {task.subject && (
                          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                            {task.subject}
                          </span>
                        )}
                        <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", priority.badge)}>
                          {priority.label} Priority
                        </span>
                        <StatusBadge task={task} />
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                          <CalendarDays className="h-3 w-3" />
                          {deadlineLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openEditModal(task)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                        aria-label="Edit task"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <TaskFormModal
          initial={
            editingTask
              ? {
                  title: editingTask.title,
                  subject: editingTask.subject,
                  deadline: editingTask.deadline,
                  priority: editingTask.priority,
                }
              : EMPTY_FORM
          }
          onCancel={() => {
            setModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}