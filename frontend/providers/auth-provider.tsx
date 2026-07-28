"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth-store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!auth) {
      // Firebase env vars weren't available at build time — fail safe
      // instead of hanging on "Loading…" forever. AuthGuard will treat
      // user:null as signed-out and redirect to /login.
      console.error(
        "Firebase auth failed to initialize — check that NEXT_PUBLIC_FIREBASE_* env vars were set at build time."
      );
      setUser(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, [setUser]);

  return <>{children}</>;
}
