"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Logo } from "@/components/logo";
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  sendPasswordReset,
  friendlyAuthError,
} from "@/features/auth/auth-actions";

const signUpSchema = z.object({
  name: z.string().min(1, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

type Mode = "signup" | "login";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.92l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11C3.25 21.3 7.31 24 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.27a12 12 0 0 0 0 10.74l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.63l4 3.1C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

function UnderlineField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wide text-black/40">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const underlineInputClass =
  "w-full border-0 border-b border-black/15 bg-transparent px-0 py-2 text-sm text-[#1A1A1A] " +
  "placeholder:text-black/25 outline-none transition-colors focus:border-[#2D3D40]";

/**
 * Fresh instance per mode switch (mounted via key={mode} in the parent's
 * AnimatePresence), so react-hook-form always validates against the correct
 * schema — no stale resolver issues from toggling mode on a persistent form.
 */
function FormPanel({ mode, onSwitchMode }: { mode: Mode; onSwitchMode: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();

  const schema = mode === "signup" ? signUpSchema : signInSchema;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        const { name, email, password } = data as z.infer<typeof signUpSchema>;
        await signUpWithEmail(name, email, password);
      } else {
        const { email, password } = data as z.infer<typeof signInSchema>;
        await signInWithEmail(email, password);
      }
      router.push("/app/materials");
    } catch (err) {
      setServerError(friendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      router.push("/app/materials");
    } catch (err) {
      setServerError(friendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setServerError(null);
    setIsSubmitting(true);
    try {
      await sendPasswordReset(resetEmail);
      setResetSent(true);
    } catch (err) {
      setServerError(friendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-lg">
      {showReset ? (
        <>
          <h2 className="text-2xl font-semibold text-[#1A1A1A]">Reset your password</h2>
          <p className="mt-1.5 text-sm text-black/50">
            {resetSent
              ? "If an account exists for that email, we've sent a reset link."
              : "Enter your email and we'll send you a reset link."}
          </p>

          {!resetSent && (
            <form onSubmit={handleResetSubmit} className="mt-7 flex flex-col gap-5">
              <UnderlineField label="Email" htmlFor="reset-email">
                <input
                  id="reset-email"
                  type="email"
                  placeholder="you@example.com"
                  className={underlineInputClass}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </UnderlineField>

              {serverError && <p className="text-sm text-red-600">{serverError}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 h-[52px] w-full rounded-xl bg-[#2D3D40] text-sm font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:bg-[#3C5256] disabled:opacity-60 disabled:hover:scale-100"
              >
                {isSubmitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-black/50">
            <button
              onClick={() => {
                setShowReset(false);
                setResetSent(false);
                setResetEmail("");
                setServerError(null);
              }}
              className="font-medium text-[#2D3D40] hover:underline"
            >
              Back to sign in
            </button>
          </p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold text-[#1A1A1A]">
            {mode === "signup" ? "Create account" : "Welcome back"}
          </h2>
          <p className="mt-1 text-sm text-black/50">
            {mode === "signup" ? "Start turning your material into a study system." : "Sign in to continue"}
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={isSubmitting}
            className="mt-5 flex h-[48px] w-full items-center justify-center gap-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm font-medium text-[#1A1A1A] transition-colors hover:bg-black/[0.02] disabled:opacity-60"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="my-4 flex items-center gap-3 text-xs text-black/30">
            <div className="h-px flex-1 bg-black/10" />
            or
            <div className="h-px flex-1 bg-black/10" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {mode === "signup" && (
              <UnderlineField label="Name" htmlFor="name" error={(errors as any).name?.message}>
                <input id="name" placeholder="Taiba Ramzan" className={underlineInputClass} {...register("name" as never)} />
              </UnderlineField>
            )}

            <UnderlineField label="Email" htmlFor="email" error={(errors as any).email?.message}>
              <input id="email" type="email" placeholder="you@example.com" className={underlineInputClass} {...register("email" as never)} />
            </UnderlineField>

            <UnderlineField label="Password" htmlFor="password" error={(errors as any).password?.message}>
              <input id="password" type="password" placeholder="••••••••" className={underlineInputClass} {...register("password" as never)} />
            </UnderlineField>

            {mode === "login" && (
              <div className="-mt-1 text-right">
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-xs text-black/40 hover:text-[#2D3D40]"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {serverError && <p className="text-sm text-red-600">{serverError}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-[48px] w-full rounded-xl bg-[#2D3D40] text-sm font-medium text-white transition-all duration-300 hover:scale-[1.02] hover:bg-[#3C5256] disabled:opacity-60 disabled:hover:scale-100"
            >
              {isSubmitting ? "Please wait…" : mode === "signup" ? "Create account" : "Login"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-black/50">
            {mode === "signup" ? (
              <>
                Already have an account?{" "}
                <button onClick={onSwitchMode} className="font-medium text-[#2D3D40] hover:underline">
                  Sign in
                </button>
              </>
            ) : (
              <>
                New user?{" "}
                <button onClick={onSwitchMode} className="font-medium text-[#2D3D40] hover:underline">
                  Sign up
                </button>
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}

export function AuthForm({ mode: initialMode }: { mode: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const router = useRouter();

  function switchMode() {
    const next = mode === "login" ? "signup" : "login";
    setMode(next);
    // keep the URL in sync for bookmarking/sharing, without blocking the animation
    setTimeout(() => router.replace(`/${next}`), 450);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] px-4 py-8">
      <div className="flex w-full max-w-3xl flex-col gap-4 lg:h-[590px] lg:flex-row">
        {/* LEFT CARD — brand. Fixed height + equal width with the right
            card, so it never resizes when the form flips between
            login (shorter) and signup (taller, extra Name field). */}
        <div
          className="relative flex shrink-0 flex-col items-center justify-center gap-5 overflow-hidden rounded-3xl px-8 py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.10)] lg:w-1/2 lg:py-0"
          style={{
            background: "linear-gradient(160deg, #2F1F0F 0%, #324247 55%, #2D3D40 100%)",
          }}
        >
          {/* Ambient background glow — adds depth without competing with the content */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle, #4A6469 0%, transparent 70%)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-12 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, #6B4526 0%, transparent 70%)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-1/3 h-48 w-48 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #E8DCC8 0%, transparent 70%)" }}
          />

          <div className="relative flex flex-col items-center gap-4">
            <Logo size={96} />
            <div>
              <h1 className="text-4xl font-bold leading-tight text-white">
                AI Learning
                <br />
                Companion
              </h1>
              <p className="mt-2 text-base font-medium text-white/80">Your AI-powered study partner.</p>
            </div>
          </div>
        </div>

        {/* RIGHT CARD — form, flips between login/signup. Fixed height at
            every breakpoint (not just inherited from the row) so it never
            grows/shrinks when the form flips between login and signup —
            this matters on mobile too, where the cards stack instead of
            sitting side by side. overflow-hidden stays on this outer,
            rounded element; the actual scrolling happens on the inner
            wrapper below, so a scrollbar (if content overflows) never
            squares off the rounded corner. */}
        <div
          className="relative flex h-[620px] w-full items-center overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.10)] lg:h-full lg:w-1/2"
          style={{ perspective: 1200 }}
        >
          <div
            className="max-h-full w-full overflow-y-auto px-6 py-8 sm:px-10 lg:py-10 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mode}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -90, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d", backfaceVisibility: "hidden", width: "100%" }}
              >
                <FormPanel mode={mode} onSwitchMode={switchMode} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
