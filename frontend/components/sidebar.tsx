"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import {
  House,
  Bot,
  NotebookTabs,
  BrainCircuit,
  BookOpenCheck,
  CalendarDays,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TEAL = "#2d3d40";
const TEAL_HOVER = "#3c5256";

const navItems = [
  { href: "/app/materials", label: "Dashboard", icon: House },
  { href: "/app/chat", label: "AI Tutor", icon: Bot },
  { href: "/app/notes", label: "Smart Notes", icon: NotebookTabs },
  { href: "/app/quiz", label: "AI Quiz", icon: BrainCircuit },
  { href: "/app/flashcards", label: "Flashcards", icon: BookOpenCheck },
  { href: "/app/planner", label: "Study Planner", icon: CalendarDays },
];

function BrandMark() {
  return (
    <Link href="/app/materials" className="flex items-center gap-3">
      <Logo size={42} />
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight" style={{ color: TEAL }}>
          AI Learning Companion
        </h2>
        <p className="text-xs text-gray-500">Smart Study Platform</p>
      </div>
    </Link>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition-all duration-200",
              active
                ? "text-white shadow-md"
                : "text-ink-400 hover:bg-ink-100/60 hover:text-ink-950 dark:hover:bg-ink-800/60"
            )}
            style={active ? { background: `linear-gradient(135deg, ${TEAL}, ${TEAL_HOVER})` } : undefined}
          >
            <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar — visible below lg, replaces the persistent sidebar */}
      <div className="flex items-center justify-between border-b border-border bg-white/80 px-4 py-3 lg:hidden">
        <Link href="/app/materials" className="flex items-center gap-2">
          <Logo size={32} />
          <span className="font-display text-base font-semibold" style={{ color: TEAL }}>
            AI Learning Companion
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-lg p-2 text-ink-400 hover:bg-ink-100/60"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside
            className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl transition-transform duration-200 dark:bg-ink-900"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 pt-8 pb-7">
              <BrandMark />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100/60"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 pb-2 pt-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-400/70">Workspace</p>
            </div>
            <NavLinks pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop persistent sidebar — hidden below lg */}
      <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-border bg-white/60 dark:bg-ink-900/40 lg:flex">
        <div className="border-b border-white/10 px-6 pt-8 pb-7">
          <BrandMark />
        </div>
        <div className="px-6 pb-2 pt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400/70">Workspace</p>
        </div>
        <NavLinks pathname={pathname} />
      </aside>
    </>
  );
}