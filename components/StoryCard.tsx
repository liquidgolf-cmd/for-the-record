"use client";

import Link from "next/link";
import { Story } from "@/lib/firestore";

interface StoryCardProps {
  story: Story;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      month: "long",
      day:   "numeric",
      year:  "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function StoryCard({ story }: StoryCardProps) {
  const firstLine = story.body?.split("\n")[0]?.slice(0, 140) || "";

  return (
    <Link href={`/story/${story.id}`} className="block">
      <article className="story-card p-5 cursor-pointer h-full flex flex-col">
        {/* Date */}
        <time
          dateTime={story.date}
          className="text-xs text-tobacco/70 font-sans uppercase tracking-wider mb-2"
        >
          {formatDate(story.date)}
        </time>

        {/* Title */}
        <h3 className="font-georgia text-lg font-bold text-dark-brown leading-snug mb-2">
          {story.title}
        </h3>

        {/* First line */}
        {firstLine && (
          <p className="text-tobacco text-sm leading-relaxed flex-1 mb-3 line-clamp-3">
            {firstLine}
            {story.body.length > 140 && "…"}
          </p>
        )}

        {/* Three words */}
        {story.threeWords?.filter(Boolean).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-tobacco/20">
            {story.threeWords.filter(Boolean).map((word, i) => (
              <span key={i} className="tag-pill text-xs">
                {word}
              </span>
            ))}
            {story.mood && (
              <span className="tag-pill text-xs opacity-60">
                {story.mood}
              </span>
            )}
          </div>
        )}
      </article>
    </Link>
  );
}
