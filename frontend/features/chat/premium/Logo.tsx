"use client";

import { useState } from "react";
import Image from "next/image";
import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Palette } from "./theme";

interface LogoProps {
  src?: string;
  size?: number;
  className?: string;
  palette?: Palette;
}

export function Logo({
  src = "/logo.png",
  size = 88,
  className,
  palette,
}: LogoProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative flex items-center justify-center">
      {/* Soft Glow */}
      <div
        className="absolute rounded-full blur-3xl opacity-30"
        style={{
          width: size + 40,
          height: size + 40,
          background:
            palette?.accentGlow ??
            "radial-gradient(circle, rgba(212,161,74,.35), transparent 70%)",
        }}
      />

      {/* Logo Container */}
      <div
        className={cn(
          "relative overflow-hidden rounded-full",
          "border border-black/10",
          "bg-white",
          "shadow-[0_15px_40px_rgba(0,0,0,0.15)]",
          className
        )}
        style={{
          width: size,
          height: size,
        }}
      >
        {!failed ? (
          <Image
            src={src}
            alt="AI Learning Companion"
            fill
            priority
            className="object-contain p-2"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BrainCircuit className="h-10 w-10 text-gray-500" />
          </div>
        )}
      </div>
    </div>
  );
}