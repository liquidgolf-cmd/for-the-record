"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllStories, Story } from "@/lib/firestore";

export function useStories(userId: string | null) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAllStories(userId);
      setStories(data);
    } catch (e) {
      setError("Couldn't load stories. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  return { stories, loading, error, refetch: fetchStories };
}
