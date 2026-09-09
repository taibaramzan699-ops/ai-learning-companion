"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useScroll, useSpring } from "framer-motion";
import {
  BookOpen,
  Brain,
CalendarCheck,
  Layers,
  Upload,
  MessageCircle,
  Search,
  FileText,
  Check,
  Minus,
  Star,
  Home,
  Lightbulb,
  Sparkles,
  Paperclip,
  Mic,
} from "lucide-react";
import { Logo } from "@/components/logo";

// ---------------------------------------------------------------------------
// Shared tokens — unchanged from the original. Palette and content are
// preserved exactly; everything below adds motion/interaction layers only.
// ---------------------------------------------------------------------------
const INK = "#1A1A1A";
const TEAL = "#2D3D40";
const TEAL_HOVER = "#3C5256";
const BROWN = "#2F1F0F";
const CREAM = "#FAF8F4";
const GOLD = "#B8863C";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-center gap-2">
      <span className="h-px w-6" style={{ background: GOLD }} />
      <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: GOLD }}>
        {children}
      </span>
      <span className="h-px w-6" style={{ background: GOLD }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reveal — shared scroll-reveal wrapper (fade + scale + blur), item #8.
// Respects prefers-reduced-motion by collapsing to a plain fade.
// ---------------------------------------------------------------------------
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y, scale: 0.96, filter: "blur(10px)" }}
      whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Scroll progress bar, item #21
// ---------------------------------------------------------------------------
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const width = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 top-0 z-50 h-[2.5px] origin-left"
      style={{ scaleX: width, width: "100%", background: `linear-gradient(90deg, ${GOLD}, ${TEAL})` }}
    />
  );
}

// ---------------------------------------------------------------------------
// Cursor glow, item #16 — subtle, desktop-only, disabled on touch devices
// ---------------------------------------------------------------------------
function CursorGlow() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setVisible(true);
    };
    const leave = () => setVisible(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", leave);
    };
  }, []);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-40 hidden rounded-full sm:block"
      animate={{ x: pos.x - 160, y: pos.y - 160, opacity: visible ? 1 : 0 }}
      transition={{ type: "spring", stiffness: 60, damping: 20, mass: 0.4 }}
      style={{
        width: 320,
        height: 320,
        background: "radial-gradient(circle, rgba(184,134,60,0.05) 0%, rgba(45,61,64,0.04) 45%, transparent 75%)",
        mixBlendMode: "multiply",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Floating background particles, item #17 — quiet, ~10% opacity, slow drift
// ---------------------------------------------------------------------------
function FloatingParticles({ count = 14 }: { count?: number }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.round((i * 37 + 13) % 100),
      size: 3 + (i % 3) * 2,
      duration: 14 + (i % 5) * 3,
      delay: (i % 7) * 0.8,
    }))
  ).current;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.id % 2 === 0 ? GOLD : TEAL,
            opacity: 0.1,
          }}
          initial={{ y: "110%" }}
          animate={{ y: "-10%" }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Animated mesh gradient background, item #3 — two blurred fields drifting
// slowly in opposite directions, à la Linear / Vercel.
// ---------------------------------------------------------------------------
function MeshBackground() {
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #C9D6D6 0%, transparent 70%)" }}
        animate={{ x: [0, 40, -10, 0], y: [0, 30, 10, 0], opacity: [0.3, 0.4, 0.25, 0.3] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, #E8D9BF 0%, transparent 70%)" }}
        animate={{ x: [0, -30, 15, 0], y: [0, -20, 15, 0], opacity: [0.25, 0.35, 0.2, 0.25] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Typewriter, item #5 — cycles through study actions in the hero
// ---------------------------------------------------------------------------
function Typewriter({ phrases, className }: { phrases: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setText(phrases[0]);
      return;
    }
    const current = phrases[index % phrases.length];
    const speed = deleting ? 35 : 55;
    const pause = deleting ? 300 : 1400;

    if (!deleting && text === current) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && text === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % phrases.length);
      return;
    }
    const t = setTimeout(() => {
      setText((prev) => (deleting ? current.slice(0, prev.length - 1) : current.slice(0, prev.length + 1)));
    }, speed);
    return () => clearTimeout(t);
  }, [text, deleting, index, phrases, reduced]);

  return (
    <span className={className}>
      {text}
      {!reduced && (
        <motion.span
          aria-hidden="true"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          style={{ display: "inline-block", marginLeft: 2, color: GOLD }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Animated counter, item #9
// ---------------------------------------------------------------------------
function Counter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState("0");
  const reduced = useReducedMotion();

  const numeric = parseInt(value.replace(/\D/g, ""), 10);
  const suffix = value.replace(/[0-9]/g, "");
  const isNumeric = !Number.isNaN(numeric);

  useEffect(() => {
    if (!inView) return;
    if (reduced || !isNumeric) {
      setDisplay(value);
      return;
    }
    const duration = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(`${Math.round(eased * numeric)}${suffix}`);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, isNumeric, numeric, reduced, suffix, value]);

  return <span ref={ref}>{isNumeric ? display : value}</span>;
}

// ---------------------------------------------------------------------------
// Magnetic + ripple button, items #18 / #21 — wraps an anchor, keeps its
// exact visual style, adds pull-toward-cursor and a click ripple.
// ---------------------------------------------------------------------------
function MagneticCTA({
  href,
  children,
  style,
  className,
}: {
  href: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const onMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    setOffset({ x: relX * 0.18, y: relY * 0.3 });
  };

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const id = Date.now();
    setRipples((r) => [...r, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((r) => r.filter((rp) => rp.id !== id)), 650);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      onClick={onClick}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 200, damping: 14, mass: 0.3 }}
      whileTap={{ scale: 0.96 }}
      className={`relative isolate overflow-hidden ${className ?? ""}`}
      style={style}
    >
      {children}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          className="pointer-events-none absolute rounded-full bg-white/40"
          style={{ left: r.x, top: r.y, translateX: "-50%", translateY: "-50%" }}
          initial={{ width: 0, height: 0, opacity: 0.5 }}
          animate={{ width: 260, height: 260, opacity: 0 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      ))}
    </motion.a>
  );
}

// ---------------------------------------------------------------------------
// Loading screen, item #19 — brief, skippable, respects reduced motion
// ---------------------------------------------------------------------------
function LoadingScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1100);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3"
      style={{ background: CREAM }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-2.5"
      >
        <Logo size={34} />
        <span className="font-serif text-lg font-semibold" style={{ color: INK }}>
          AI Learning Companion
        </span>
      </motion.div>
      <motion.div
        className="h-[3px] w-40 overflow-hidden rounded-full bg-black/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: GOLD }}
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Navbar — glassmorphism, shrinks on scroll, slides in on load. Item #1.
// ---------------------------------------------------------------------------
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-30 border-b transition-all duration-300"
      style={{
        borderColor: scrolled ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.02)",
        background: scrolled ? "rgba(250,248,244,0.7)" : "rgba(250,248,244,0.45)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: scrolled ? "0 8px 30px rgba(26,26,26,0.06)" : "none",
      }}
    >
      <div
        className="mx-auto flex max-w-6xl items-center justify-between px-6 transition-all duration-300"
        style={{ paddingTop: scrolled ? 10 : 16, paddingBottom: scrolled ? 10 : 16 }}
      >
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
          <span className="font-serif text-lg font-semibold" style={{ color: INK }}>
            AI Learning Companion
          </span>
        </div>
        <nav className="hidden items-center gap-8 text-sm font-medium text-black/60 md:flex">
          <a href="#features" className="transition-colors hover:text-[#1A1A1A]">Features</a>
          <a href="#how-it-works" className="transition-colors hover:text-[#1A1A1A]">How it works</a>
        </nav>
        <div className="flex items-center gap-3">
          <a href="/login" className="hidden text-sm font-medium text-black/70 hover:text-[#1A1A1A] sm:block">
            Sign in
          </a>
          <MagneticCTA
            href="/signup"
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-white"
            style={{ background: TEAL }}
          >
            Get Started
          </MagneticCTA>
        </div>
      </div>
    </motion.header>
  );
}

// ---------------------------------------------------------------------------
// Hero — headline/subhead preserved verbatim. Adds typewriter pills,
// mesh background, particles, a mouse-tilted app preview, and primary CTAs.
// ---------------------------------------------------------------------------
function Hero() {
  const pills = [
    { icon: Upload, label: "Upload PDFs" },
    { icon: MessageCircle, label: "Chat with Notes" },
    { icon: Brain, label: "Generate Quizzes" },
    { icon: Layers, label: "Flashcards" },
    { icon: CalendarCheck, label: "Study Planner" },

  ];

  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-20 sm:pt-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(45,61,64,0.06) 0%, rgba(250,248,244,0) 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(rgba(26,26,26,0.12) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(60% 55% at 50% 20%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(60% 55% at 50% 20%, black 0%, transparent 75%)",
        }}
      />
      <MeshBackground />
      <FloatingParticles count={10} />

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <SectionLabel>Your Personal AI Study Partner</SectionLabel>
        </motion.div>

        <motion.h1
          className="font-serif text-4xl font-bold leading-[1.1] sm:text-6xl"
          style={{ color: INK }}
        >
          <motion.span
            className="block"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
          >
            Learn faster with AI that
          </motion.span>
          <motion.span
            className="relative inline-block"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
          >
            understands{" "}
            <span className="relative inline-block">
              your notes
              <svg
                className="absolute -bottom-1 left-0 w-full"
                viewBox="0 0 120 10"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M2 7 Q 60 2 118 7"
                  stroke={GOLD}
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, delay: 0.5 }}
                />
              </svg>
            </span>
            .
          </motion.span>
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-xl text-lg text-black/55"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
        >
          Upload PDFs, lectures, and slides — then chat, quiz, and plan your study sessions with an
                    AI that&apos;s already read everything you have.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.36 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >

          <a
            href="#how-it-works"
            className="inline-flex h-[52px] items-center justify-center rounded-xl border border-black/15 px-8 text-sm font-medium text-black/70 transition-colors hover:border-black/25 hover:text-[#1A1A1A]"
          >
            See how it works
          </a>
        </motion.div>

        <div className="mx-auto mt-5 h-5 text-center text-xs font-medium" style={{ color: TEAL }}>
          <Typewriter
            phrases={["Upload Notes...", "Chat with AI...", "Generate Quiz...", "Create Flashcards...", "Plan Study Schedule..."]}
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-6 flex max-w-2xl flex-wrap items-center justify-center gap-2"
        >
          {pills.map((p, i) => (
            <motion.span
              key={p.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.45 + i * 0.05 }}
              whileHover={{ y: -2 }}
              className="flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-black/60"
              style={{ background: "rgba(255,255,255,0.65)", backdropFilter: "blur(6px)" }}
            >
              <span
                className="flex h-4 w-4 items-center justify-center rounded-full"
                style={{ background: `linear-gradient(135deg, ${TEAL}, ${TEAL_HOVER})` }}
              >
                <p.icon className="h-2.5 w-2.5 text-white" strokeWidth={2} />
              </span>
              {p.label}
            </motion.span>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="relative mx-auto mt-16 max-w-5xl"
        style={{ perspective: 1600 }}
      >
        <AppPreview />
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// App preview — mouse-tilt (item #4). Mirrors the real app's AI Tutor
// welcome screen (sidebar + logo + suggestion cards + input bar).
// ---------------------------------------------------------------------------
function AppPreview() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const reduced = useReducedMotion();

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -8, y: px * 10 });
  };

  const navItems = [
    { icon: Home, label: "Dashboard" },
    { icon: MessageCircle, label: "AI Tutor", active: true },
    { icon: BookOpen, label: "Smart Notes" },
    { icon: Brain, label: "AI Quiz" },
    { icon: Layers, label: "Flashcards" },
    { icon: CalendarCheck , label: "Study Planner" },
  ];

  const suggestions = [
    { icon: BookOpen, title: "Summarize everything I've uploaded", subtitle: "Across all materials." },
    { icon: Lightbulb, title: "What topics should I focus on?", subtitle: "Prioritize your study." },
    { icon: FileText, title: "Compare my documents", subtitle: "Spot overlaps & gaps." },
    { icon: Sparkles, title: "Quiz me on a random topic", subtitle: "Test your knowledge." },
  ];

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      style={{ transformStyle: "preserve-3d", background: CREAM }}
      className="overflow-hidden rounded-2xl border border-black/10 shadow-[0_30px_80px_rgba(0,0,0,0.14)]"
    >
      <div className="flex items-center gap-1.5 border-b border-black/5 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
      </div>
      <div className="flex h-[420px] sm:h-[480px]">
        <div className="hidden w-48 shrink-0 flex-col gap-1 border-r border-black/5 bg-white px-3 py-4 sm:flex">
          {navItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
              style={{
                background: item.active ? TEAL : "transparent",
                color: item.active ? "white" : "rgba(26,26,26,0.6)",
              }}
            >
              <item.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              {item.label}
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-6 sm:px-10">
          <motion.div
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Logo size={30} />
          </motion.div>
          <p className="mt-4 font-serif text-lg font-semibold" style={{ color: INK }}>
            AI Learning Companion
          </p>
          <p className="mt-1 text-xs font-medium" style={{ color: TEAL }}>
            Study Smarter. Learn Faster.
          </p>
          <p className="mt-3 max-w-sm text-center text-[11px] leading-relaxed text-black/45">
            Upload notes, ask questions, generate quizzes and understand concepts faster.
          </p>

          <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-2.5">
            {suggestions.map((s) => (
              <div
                key={s.title}
                className="flex flex-col gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-3 text-left"
              >
                <s.icon className="h-3.5 w-3.5" style={{ color: TEAL }} strokeWidth={1.75} />
                <p className="text-[11px] font-medium leading-snug" style={{ color: INK }}>
                  {s.title}
                </p>
                <p className="text-[10px] text-black/40">{s.subtitle}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex w-full max-w-md items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3">
            <Paperclip className="h-3.5 w-3.5 text-black/30" strokeWidth={1.75} />
            <span className="flex-1 text-xs text-black/30">
              <Typewriter phrases={["Ask anything about your study materials…", "Summarize chapter 4 for me…", "Quiz me on today's notes…"]} />
            </span>
            <Mic className="h-3.5 w-3.5 text-black/30" strokeWidth={1.75} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}



// ---------------------------------------------------------------------------
// Feature card — spotlight, lift, icon rotate, arrow slide. Item #7.
// ---------------------------------------------------------------------------
function FeatureCard({ f }: { f: { icon: any; title: string; desc: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: 50, y: 50, active: false });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setSpot({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100, active: true });
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setSpot((s) => ({ ...s, active: false }))}
      className="group relative overflow-hidden rounded-3xl border border-black/8 bg-white p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(220px circle at ${spot.x}% ${spot.y}%, rgba(184,134,60,0.08), transparent 70%)`,
          opacity: spot.active ? 1 : 0,
        }}
      />
      <motion.div
        className="relative flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{ background: "rgba(45,61,64,0.08)" }}
        whileHover={{ rotate: 8, scale: 1.06 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <f.icon className="h-5.5 w-5.5" style={{ color: TEAL }} strokeWidth={1.75} />
      </motion.div>
      <h3 className="relative mt-5 font-serif text-xl font-semibold" style={{ color: INK }}>
        {f.title}
      </h3>
      <p className="relative mt-2 text-sm leading-relaxed text-black/55">{f.desc}</p>

    </div>
  );
}

function Features() {
  const features = [
    {
      icon: FileText,
      title: "Chat with PDFs",
      desc: "Ask questions straight from your lectures, slides, and notes — get answers grounded in your own material.",
    },
    {
      icon: Brain,
      title: "Generate Quizzes",
      desc: "AI builds practice quizzes instantly from whatever you upload, so revision never starts from a blank page.",
    },
    {
      icon: CalendarCheck ,
      title: "Smart Study Planner",
      desc: "A weekly schedule built around your workload, deadlines, and how you actually learn.",
    },
    {
      icon: Layers,
      title: "Flashcards",
      desc: "Turn dense material into spaced-repetition flashcards for the concepts you keep forgetting.",
    },
  ];

  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="text-center">
            <SectionLabel>What You Get</SectionLabel>
            <h2 className="font-serif text-3xl font-bold sm:text-4xl" style={{ color: INK }}>
              Everything you need to study
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <FeatureCard f={f} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How it works — animated connecting line drawn on scroll. Item #14.
// ---------------------------------------------------------------------------
function HowItWorks() {
  const steps = [
    { label: "Upload Notes", icon: Upload },
    { label: "AI Understands", icon: Brain },
    { label: "Ask Questions", icon: MessageCircle },
    { label: "Practice Quiz", icon: Check },
    { label: "Study Planner", icon: CalendarCheck },
  ];
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section id="how-it-works" className="px-6 py-24" style={{ background: CREAM }}>
      <div className="mx-auto max-w-5xl text-center">
        <Reveal>
          <SectionLabel>How It Works</SectionLabel>
          <h2 className="font-serif text-3xl font-bold sm:text-4xl" style={{ color: INK }}>
            From notes to mastery in five steps
          </h2>
        </Reveal>

        <div ref={sectionRef} className="relative mt-14">
          <svg
            aria-hidden="true"
            className="absolute left-0 top-7 hidden w-full sm:block"
            height="4"
            viewBox="0 0 1000 4"
            preserveAspectRatio="none"
          >
            <motion.line
              x1="60"
              y1="2"
              x2="940"
              y2="2"
              stroke="rgba(184,134,60,0.5)"
              strokeWidth="2"
              strokeDasharray="6 6"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          </svg>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-0">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.15 }}
                className="flex items-center gap-3 sm:flex-col sm:gap-3"
              >
                <div className="relative flex flex-col items-center sm:gap-3">
                  <div
                    className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-white text-sm font-semibold"
                    style={{ borderColor: TEAL, color: TEAL }}
                  >
                    <step.icon className="h-5 w-5" strokeWidth={1.75} />
                    <span
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ background: GOLD }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <p className="text-sm font-medium" style={{ color: INK }}>
                    {step.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Comparison — animated row reveal. Item #13 keeps the table (clearer for
// a direct feature-by-feature contrast than cards) but animates each row.
// ---------------------------------------------------------------------------
function Comparison() {
  const rows = [
    {
      traditional: "Read through everything",
      ai: "Instant AI summaries",
    },
    {
      traditional: "Write notes manually",
      ai: "AI-generated notes",
    },
    {
      traditional: "Create practice questions",
      ai: "AI-generated quizzes",
    },
    {
      traditional: "Track revision yourself",
      ai: "Smart revision reminders",
    },
   {
  traditional: "Create your study plan manually",
  ai: "AI creates a personalized study plan",
},
  ];

  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl text-center">
        <Reveal>
          <SectionLabel>Why Choose Us</SectionLabel>

          <h2
            className="font-serif text-3xl font-bold sm:text-4xl"
            style={{
              color: INK,
            }}
          >
            Spend less time organizing.
            <br />
            More time learning.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-black/55">
            Let AI handle the repetitive work so you can focus on
            understanding, practicing, and making real progress.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-12 overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.04)]">

            {/* Table header */}
            <div className="grid grid-cols-2">
              <div
                className="border-b border-r border-black/8 bg-white px-7 py-5 text-left text-sm font-semibold text-black/45"
              >
                Traditional Study
              </div>

              <div
                className="border-b border-black/8 px-7 py-5 text-left text-sm font-semibold text-white"
                style={{
                  background: `linear-gradient(
                    135deg,
                    ${TEAL},
                    #25383C
                  )`,
                }}
              >
                AI Learning Companion
              </div>
            </div>

            {/* Rows */}
            {rows.map((row, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  x: -12,
                }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                viewport={{
                  once: true,
                  amount: 0.6,
                }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.08,
                }}
                className="grid grid-cols-2"
              >
                {/* Traditional */}
                <div className="flex items-center gap-3 border-r border-black/8 bg-white px-7 py-5 text-left text-sm text-black/45">
                  <Minus
                    className="h-3.5 w-3.5 shrink-0 text-black/20"
                    strokeWidth={2.5}
                  />

                  <span>
                    {row.traditional}
                  </span>
                </div>

                {/* AI */}
                <div
                  className="flex items-center gap-3 border-b border-black/5 px-7 py-5 text-left text-sm font-medium"
                  style={{
                    color: INK,
                    background:
                      "linear-gradient(90deg, #F4F6F5 0%, #F8F9F8 100%)",
                  }}
                >
                  <Check
                    className="h-3.5 w-3.5 shrink-0"
                    style={{
                      color: TEAL,
                    }}
                    strokeWidth={2.5}
                  />

                  <span>
                    {row.ai}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
// ---------------------------------------------------------------------------
// Footer — minimal, clean, and professional
// ---------------------------------------------------------------------------

function Footer() {
  return (
    <footer className="px-6 pb-8 pt-12">
      <div className="mx-auto max-w-5xl border-t border-black/8 pt-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Brand */}
          <div className="text-center sm:text-left">
            <p
              className="font-serif text-lg font-semibold"
              style={{ color: INK }}
            >
              AI Learning Companion
            </p>

            <p className="mt-1 text-xs text-black/45">
              Learn smarter. Study better.
            </p>
          </div>

          {/* Copyright */}
          <p className="text-xs text-black/40">
            © {new Date().getFullYear()} AI Learning Companion. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  const [loading, setLoading] = useState(true);

  return (
    <div
      style={{
        background: CREAM,
      }}
    >
      <AnimatePresence>
        {loading && (
          <LoadingScreen
            onDone={() => setLoading(false)}
          />
        )}
      </AnimatePresence>

      <ScrollProgressBar />

      <CursorGlow />

      <Navbar />

      <Hero />

      <Features />

      <HowItWorks />

      <Comparison />

      <Footer />

    </div>
  );
}