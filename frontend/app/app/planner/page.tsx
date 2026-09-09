"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
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
type BucketKey = "overdue" | "today" | "tomorrow" | "week" | "later" | "completed";

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

const PRIORITY_STYLES: Record<Priority, { label: string; dot: string; text: string }> = {
  high: { label: "High", dot: "bg-[#B33F2E]", text: "text-[#B33F2E]" },
  medium: { label: "Medium", dot: "bg-[#93691E]", text: "text-[#93691E]" },
  low: { label: "Low", dot: "bg-[#3F6B4E]", text: "text-[#3F6B4E]" },
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

const BUCKET_ORDER: BucketKey[] = ["overdue", "today", "tomorrow", "week", "later", "completed"];
const BUCKET_LABEL: Record<BucketKey, string> = {
  overdue: "Overdue",
  today: "Today",
  tomorrow: "Tomorrow",
  week: "This week",
  later: "Later",
  completed: "Completed",
};

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

function diffDaysFromToday(iso: string): number {
  const date = new Date(iso + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isOverdue(task: Task) {
  return !task.completed && task.deadline < todayISO();
}

function isToday(task: Task) {
  return task.deadline === todayISO();
}

function formatExactDate(iso: string): string {
  const date = new Date(iso + "T00:00:00");
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getBucket(task: Task): BucketKey {
  if (task.completed) return "completed";
  if (isOverdue(task)) return "overdue";
  if (isToday(task)) return "today";
  const diff = diffDaysFromToday(task.deadline);
  if (diff === 1) return "tomorrow";
  if (diff > 1 && diff <= 7) return "week";
  return "later";
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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
// Stat strip
// ---------------------------------------------------------------------------

function StatStrip({
  total,
  completed,
  pending,
  overdue,
  progressPct,
}: {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  progressPct: number;
}) {
  const items: { value: number; label: string }[] = [
    { value: total, label: "Total" },
    { value: pending, label: "Pending" },
    { value: completed, label: "Completed" },
    { value: overdue, label: "Overdue" },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-[#E3E1D7] bg-white">
      <div className="grid grid-cols-2 divide-x divide-[#E3E1D7] sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="px-5 py-4">
            <p className="font-mono text-2xl font-medium text-[#1B1B17]">{item.value}</p>
            <p className="mt-0.5 text-xs text-[#6E6C63]">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 border-t border-[#E3E1D7] px-5 py-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EDECE5]">
          <div
            className="h-full rounded-full bg-[#2F4858] transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="font-mono text-xs text-[#6E6C63]">{progressPct}%</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task row
// ---------------------------------------------------------------------------

function Divider() {
  return <span className="h-3 w-px shrink-0 bg-[#E3E1D7]" aria-hidden />;
}

function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const priority = PRIORITY_STYLES[task.priority];

  return (
    <div className="group flex items-start gap-3 border-b border-[#E3E1D7] py-3.5 last:border-b-0">
      <button
        onClick={() => onToggle(task.id)}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors active:scale-90",
          task.completed
            ? "border-[#2F4858] bg-[#2F4858] text-white"
            : "border-[#C9C7BC] text-transparent hover:border-[#2F4858]"
        )}
        aria-label="Toggle complete"
      >
        <Check className="h-3 w-3" />
      </button>

      <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", priority.dot)} aria-hidden />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm text-[#1B1B17]",
            task.completed && "text-[#9C9A90] line-through"
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6E6C63]">
          <span className={priority.text}>{priority.label}</span>
          {task.subject && (
            <>
              <Divider />
              <span>{task.subject}</span>
            </>
          )}
          <Divider />
          <span className="font-mono">{formatExactDate(task.deadline)}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onEdit(task)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9C9A90] hover:bg-[#F1F0EC] hover:text-[#1B1B17]"
          aria-label="Edit task"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9C9A90] hover:bg-[#FBEAE6] hover:text-[#B33F2E]"
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
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
      <div className="fixed inset-0 bg-[#1B1B17]/45 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-[#E3E1D7] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#EDECE5] px-6 py-5">
          <div>
            <h2 className="font-serif text-lg font-semibold leading-tight text-[#1B1B17]">
              {isEditing ? "Edit task" : "Add task"}
            </h2>
            <p className="mt-0.5 text-xs text-[#6E6C63]">
              {isEditing ? "Update the details below" : "What are you working on?"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#9C9A90] hover:bg-[#F1F0EC] hover:text-[#1B1B17]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#6E6C63]">Task title</label>
            <input
              autoFocus
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Finish CSS Flexbox notes"
              className="w-full rounded-xl border border-[#E3E1D7] px-3.5 py-2.5 text-sm text-[#1B1B17] outline-none transition-colors focus:border-[#2F4858]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#6E6C63]">Subject / category</label>
            <input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Web Development"
              className="w-full rounded-xl border border-[#E3E1D7] px-3.5 py-2.5 text-sm text-[#1B1B17] outline-none transition-colors focus:border-[#2F4858]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6E6C63]">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full rounded-xl border border-[#E3E1D7] px-3.5 py-2.5 text-sm text-[#1B1B17] outline-none transition-colors focus:border-[#2F4858]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6E6C63]">Priority</label>
              <div className="relative">
                <select
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))}
                  className="w-full appearance-none rounded-xl border border-[#E3E1D7] bg-white px-3.5 py-2.5 pr-9 text-sm text-[#1B1B17] outline-none transition-colors focus:border-[#2F4858]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9C9A90]" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-[#EDECE5] px-6 py-5">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-[#E3E1D7] py-2.5 text-sm font-medium text-[#6E6C63] transition-colors hover:bg-[#F9F8F4]"
          >
            Cancel
          </button>
          <button
            onClick={() => form.title.trim() && onSave(form)}
            disabled={!form.title.trim()}
            className="flex-1 rounded-xl bg-[#2F4858] py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98] hover:bg-[#24363F] disabled:opacity-40"
          >
            Save task
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

    return result;
  }, [tasks, filterTab, sortBy]);

  const groups = useMemo(() => {
    const buckets: Record<BucketKey, Task[]> = {
      overdue: [],
      today: [],
      tomorrow: [],
      week: [],
      later: [],
      completed: [],
    };
    for (const task of visibleTasks) {
      buckets[getBucket(task)].push(task);
    }
    return BUCKET_ORDER.map((key) => ({ key, label: BUCKET_LABEL[key], tasks: buckets[key] })).filter(
      (group) => group.tasks.length > 0
    );
  }, [visibleTasks]);

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

  const summaryLine =
    stats.total === 0
      ? "Nothing on your plate yet."
      : stats.overdue > 0
      ? `${stats.overdue} task${stats.overdue === 1 ? "" : "s"} overdue, ${stats.pending} still open.`
      : stats.pending > 0
      ? `${stats.pending} task${stats.pending === 1 ? "" : "s"} open, ${stats.completed} done.`
      : "Everything's done — nice work.";

  return (
    <div className="min-h-full bg-[#F6F6F1]">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-10 sm:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs text-[#6E6C63]">{formatToday()}</p>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-[#1B1B17]">{getGreeting()}</h1>
            <p className="mt-1.5 text-sm text-[#6E6C63]">{summaryLine}</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex shrink-0 items-center gap-2 self-start rounded-xl bg-[#2F4858] px-4 py-2.5 text-sm font-medium text-white transition-colors active:scale-[0.98] hover:bg-[#24363F]"
          >
            <Plus className="h-4 w-4" />
            Add task
          </button>
        </div>

        {tasks.length > 0 && (
          <>
            <StatStrip
              total={stats.total}
              completed={stats.completed}
              pending={stats.pending}
              overdue={stats.overdue}
              progressPct={progressPct}
            />

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
                        ? "bg-[#2F4858] text-white"
                        : "border border-[#E3E1D7] bg-white text-[#6E6C63] hover:border-[#C9C7BC]"
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
                  className="appearance-none rounded-xl border border-[#E3E1D7] bg-white py-2 pl-3.5 pr-9 text-xs font-medium text-[#6E6C63] outline-none focus:border-[#2F4858]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      Sort: {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9C9A90]" />
              </div>
            </div>
          </>
        )}

        {/* Agenda */}
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[#E3E1D7] bg-white py-24 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E3E1D7]">
              <CalendarDays className="h-5 w-5 text-[#6E6C63]" />
            </div>
            <p className="font-serif text-base font-semibold text-[#1B1B17]">No tasks yet</p>
            <p className="max-w-xs text-sm text-[#6E6C63]">Add the first thing you need to study.</p>
            <button
              onClick={openAddModal}
              className="mt-1 flex items-center gap-2 rounded-xl bg-[#2F4858] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#24363F]"
            >
              <Plus className="h-4 w-4" />
              Add your first task
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E3E1D7] bg-white py-16 text-center">
            <p className="text-sm text-[#6E6C63]">No tasks match this filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.key}>
                <div className="mb-1 flex items-center gap-2">
                  {group.key === "overdue" && <TriangleAlert className="h-3.5 w-3.5 text-[#B33F2E]" />}
                  <h2
                    className={cn(
                      "text-sm font-medium",
                      group.key === "overdue" ? "text-[#B33F2E]" : "text-[#1B1B17]"
                    )}
                  >
                    {group.label}
                  </h2>
                  <span className="font-mono text-xs text-[#9C9A90]">{group.tasks.length}</span>
                </div>
                <div className="rounded-xl border border-[#E3E1D7] bg-white px-4">
                  {group.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={toggleComplete}
                      onEdit={openEditModal}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              </div>
            ))}
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