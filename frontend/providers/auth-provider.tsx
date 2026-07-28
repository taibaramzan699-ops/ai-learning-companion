"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    // TEMP: clear loading immediately so landing/login can render
    setUser(null);
  }, [setUser]);

  return <>{children}</>;
}