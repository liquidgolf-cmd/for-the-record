"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { useRouter }   from "next/navigation";
import { useAuth }     from "@/hooks/useAuth";
import { useStories }  from "@/hooks/useStories";
import StoryCard       from "@/components/StoryCard";
import SearchBar       from "@/components/SearchBar";
import Image           from "next/image";
import { Story }       from "@/lib/firestore";

export default function ArchivePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const { stories, loading: storiesLoading, error } = useStories(
    user?.uid ?? null
  );

  const [search,      setSearch]      = useState("");
  const [moodFilter,  setMoodFilter]  = useState("");
  const [themeFilter, setThemeFilter] = useState("");
  const [viewMode,    setViewMode]    = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  // Collect unique moods and themes
  const availableMoods = useMemo(() => {
    const moods = stories.map((s) => s.mood).filter(Boolean);
    return Array.from(new Set(moods)).sort();
  }, [stories]);

  const availableThemes = useMemo(() => {
    const themes = stories.flatMap((s) => s.themes ?? []);
    return Array.from(new Set(themes)).sort();
  }, [stories]);

  // Filter stories
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return stories.filter((s: Story) => {
      const matchSearch = !q || [
        s.title,
        s.body,
        ...(s.tags    ?? []),
        ...(s.themes  ?? []),
        ...(s.threeWords ?? []),
      ].some((text) => text?.toLowerCase().includes(q));

      const matchMood  = !moodFilter  || s.mood === moodFilter;
      const matchTheme = !themeFilter || (s.themes ?? []).includes(themeFilter);

      return matchSearch && matchMood && matchTheme;
    });
  }, [stories, search, moodFilter, themeFilter]);

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
    <div className="min-h-screen bg-studio">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-5 py-0 border-b border-cream/[0.06]">
        <a href="/">
          <Image src="/ftr-logo-horiz.png" alt="For the Record" width={172} height={132} />
        </a>
        <div className="flex items-center gap-5">
          <span className="text-sm text-cream/70 font-sans">Archive</span>
          <a href="/settings" className="text-sm text-cream/40 hover:text-amber transition-warm">
            Settings
          </a>
          <a href="https://loamstrategy.com" className="text-sm text-cream/40 hover:text-amber transition-warm">loamstrategy.com</a>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-georgia text-3xl text-cream mb-1">
            {"Everything you've recorded, right here."}
          </h1>
          {stories.length > 0 && (
            <p className="text-cream/40 text-sm font-sans">
              {stories.length} {stories.length === 1 ? "story" : "stories"}
            </p>
          )}
        </div>

        {/* Search & Filters */}
        {stories.length > 0 && (
          <>
            <SearchBar
              value={search}
              onChange={setSearch}
              moodFilter={moodFilter}
              onMoodChange={setMoodFilter}
              themeFilter={themeFilter}
              onThemeChange={setThemeFilter}
              availableMoods={availableMoods}
              availableThemes={availableThemes}
            />

            {/* View toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setViewMode("grid")}
                className={`text-xs px-3 py-1.5 rounded border transition-warm ${
                  viewMode === "grid"
                    ? "border-amber text-amber"
                    : "border-cream/10 text-cream/30 hover:border-cream/30"
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`text-xs px-3 py-1.5 rounded border transition-warm ${
                  viewMode === "list"
                    ? "border-amber text-amber"
                    : "border-cream/10 text-cream/30 hover:border-cream/30"
                }`}
              >
                List
              </button>
            </div>
          </>
        )}

        {/* Loading */}
        {storiesLoading && (
          <div className="flex items-center justify-center py-20">
            <span className="georgia-text text-cream/30 animate-pulse">
              Loading your stories…
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red/60 text-sm">{error}</p>
        )}

        {/* Empty state */}
        {!storiesLoading && stories.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center animate-fade-up">
            <p className="georgia-text text-xl text-cream/40 mb-4 italic">
              {"Your first story starts whenever you're ready."}
            </p>
            <a href="/" className="btn-primary">
              Begin a session
            </a>
          </div>
        )}

        {/* No results */}
        {!storiesLoading && stories.length > 0 && filtered.length === 0 && (
          <p className="text-cream/40 text-sm py-10 text-center">
            No stories match your search.
          </p>
        )}

        {/* Story grid */}
        {filtered.length > 0 && (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-3"
            }
          >
            {filtered.map((story) => (
              <div key={story.id} className="animate-fade-up">
                <StoryCard story={story} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
