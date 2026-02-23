"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { getAuthInstance } from "@/lib/firebase";

export function useAuth() {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // useEffect only runs in the browser — getAuthInstance() is safe here
    let unsubscribe: (() => void) | undefined;
    try {
      const authInstance = getAuthInstance();
      unsubscribe = onAuthStateChanged(authInstance, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      });
    } catch {
      // Firebase not configured (e.g. missing .env.local)
      setLoading(false);
    }
    return () => unsubscribe?.();
  }, []);

  return { user, loading };
}
