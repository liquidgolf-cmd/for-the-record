"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth }     from "@/hooks/useAuth";
import { getStory }    from "@/lib/firestore";
import { Story }       from "@/lib/firestore";
import StoryDetail     from "@/components/StoryDetail";

export default function StoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [story,         setStory]         = useState<Story | null>(null);
  const [storyLoading,  setStoryLoading]  = useState(true);
  const [notFound,      setNotFound]      = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !id) return;

    getStory(user.uid, id).then((s) => {
      if (!s) setNotFound(true);
      else setStory(s);
      setStoryLoading(false);
    });
  }, [user, id]);

  if (loading || storyLoading) {
    return (
      <div className="min-h-screen bg-studio flex items-center justify-center">
        <span className="georgia-text text-cream/30 text-lg animate-pulse">
          For the Record
        </span>
      </div>
    );
  }

  if (notFound || !story || !user) {
    return (
      <div className="min-h-screen bg-studio flex flex-col items-center justify-center text-center px-4">
        <p className="georgia-text text-xl text-cream/40 mb-6 italic">
          {"This story wasn't found."}
        </p>
        <a href="/archive" className="btn-primary">
          Back to archive
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-studio">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-5 py-4 border-b border-cream/[0.06]">
        <a href="/" className="font-georgia text-amber tracking-wide text-base font-bold">
          For the Record
        </a>
        <a href="/archive" className="text-sm text-cream/40 hover:text-amber transition-warm">
          Archive
        </a>
      </nav>

      <StoryDetail story={story} userId={user.uid} />
    </div>
  );
}
