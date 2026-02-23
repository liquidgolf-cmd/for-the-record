"use client";

export const dynamic = "force-dynamic";

import { useEffect }    from "react";
import { useRouter }    from "next/navigation";
import { useAuth }      from "@/hooks/useAuth";
import { useStories }   from "@/hooks/useStories";
import SessionManager   from "@/components/SessionManager";
import Image            from "next/image";
import { Story }        from "@/lib/firestore";

function computeStreak(stories: Story[]): number {
  if (stories.length === 0) return 0;
  const dates = Array.from(new Set(stories.map(s => s.date))).sort().reverse();
  const today     = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dates[0] !== today && dates[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + "T12:00:00");
    const curr = new Date(dates[i]     + "T12:00:00");
    if (Math.round((prev.getTime() - curr.getTime()) / 86400000) === 1) streak++;
    else break;
  }
  return streak;
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const { stories } = useStories(user?.uid ?? null);
  const streak      = computeStreak(stories);
  const total       = stories.length;

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-studio flex items-center justify-center">
        <span className="georgia-text text-cream/30 text-lg animate-pulse">
          For the Record
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-studio flex flex-col">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-5 py-4 border-b border-cream/[0.06]">
        <a href="/">
          <Image src="/ftr-text.png" alt="For the Record" width={140} height={25} />
        </a>
        <div className="flex items-center gap-5">
          <a href="/archive"  className="text-sm text-cream/40 hover:text-amber transition-warm">Archive</a>
          <a href="/settings" className="text-sm text-cream/40 hover:text-amber transition-warm">Settings</a>
        </div>
      </nav>

      {/* ── Session ── */}
      <main className="flex-1 flex flex-col">
        <SessionManager userId={user.uid} />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-cream/[0.06] px-5 py-3 flex items-center justify-between">
        <p className="text-xs text-cream/20 font-sans">© 2026 For the Record</p>
        {total > 0 && (
          <p className="text-xs text-cream/30 font-sans flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber/40 inline-block" />
            {streak} day streak · {total} {total === 1 ? "story" : "stories"} captured
          </p>
        )}
      </footer>
    </div>
  );
}
