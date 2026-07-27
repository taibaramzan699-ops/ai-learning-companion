"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { sendPasswordReset, friendlyAuthError } from "@/features/auth/auth-actions";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

const underlineInputClass =
  "w-full border-0 border-b border-black/15 bg-transparent px-0 py-2 text-sm text-[#1A1A1A] " +
  "placeholder:text-black/25 outline-none transition-colors focus:border-[#2D3D40]";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await sendPasswordReset(data.email);
      setSent(true);
    } catch (err) {
      setServerError(friendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F8F8] px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <Logo size={40} />

        {sent ? (
          <>
            <h1 className="mt-6 text-2xl font-semibold text-[#1A1A1A]">Check your email</h1>
            <p className="mt-1 text-sm text-black/50">
              If an account exists for that email, we&apos;ve sent a link to reset your password.
            </p>
            <Link
              href="/login"
              className="mt-6 block w-full rounded-lg bg-[#2D3D40] py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-[#3C5256]"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-6 text-2xl font-semibold text-[#1A1A1A]">Forgot password?</h1>
            <p className="mt-1 text-sm text-black/50">Enter your email and we&apos;ll send you a reset link.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-black/40">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className={underlineInputClass}
                  {...register("email")}
                />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>

              {serverError && <p className="text-sm text-red-600">{serverError}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 w-full rounded-lg bg-[#2D3D40] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3C5256] disabled:opacity-60"
              >
                {isSubmitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="mt-6 text-center text-sm text-black/50">
          Remembered your password?{" "}
          <Link href="/login" className="font-medium text-[#2D3D40] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
