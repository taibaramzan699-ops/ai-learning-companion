"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  src?: string;
  size?: number;
  className?: string;
}

/**
 * Universal brand mark. The uploaded artwork is already a complete circular
 * icon (book + spark + crescent), so this just frames it cleanly and falls
 * back to a plain placeholder if the file is missing.
 */
export function Logo({ src = "/logo.png", size = 64, className }: LogoProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn("relative flex shrink-0 items-center justify-center overflow-hidden rounded-full", className)}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <Image
          src={src}
          alt="AI Learning Companion"
          fill
          className="object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full border border-dashed border-black/20 bg-white">
          <span className="text-[9px] font-medium uppercase tracking-wide text-black/40">Logo</span>
        </div>
      )}
    </div>
  );
}
