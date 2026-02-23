"use client";

import { useEffect, useRef } from "react";
import { TranscriptMessage } from "@/hooks/useSession";
import { SessionState } from "@/hooks/useSession";

interface TranscriptDisplayProps {
  transcript:  TranscriptMessage[];
  liveText:    string;
  state:       SessionState;
}

export default function TranscriptDisplay({
  transcript,
  liveText,
  state,
}: TranscriptDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, liveText]);

  if (transcript.length === 0 && !liveText) return null;

  return (
    <div className="w-full max-w-xl mx-auto mt-8 space-y-4 animate-fade-in">
      {transcript.map((msg, i) => (
        <div
          key={i}
          className={[
            "animate-fade-up",
            msg.role === "georgia"
              ? "text-left"
              : "text-right pl-8",
          ].join(" ")}
        >
          {msg.role === "georgia" ? (
            <p className="georgia-text text-lg">
              {msg.content}
            </p>
          ) : (
            <p className="text-cream/75 text-base font-sans leading-relaxed">
              {msg.content}
            </p>
          )}
        </div>
      ))}

      {/* Live speech preview */}
      {liveText && state === "listening" && (
        <div className="text-right pl-8 animate-fade-in">
          <p className="text-cream/50 text-base font-sans italic leading-relaxed">
            {liveText}
            <span className="inline-block w-1 h-4 bg-amber ml-1 animate-pulse align-middle" />
          </p>
        </div>
      )}

      {/* Processing indicator */}
      {state === "processing" && (
        <div className="text-left animate-fade-in">
          <p className="georgia-text text-lg text-cream/40">
            <span className="inline-flex gap-1">
              <span className="animate-bounce [animation-delay:0ms]">·</span>
              <span className="animate-bounce [animation-delay:150ms]">·</span>
              <span className="animate-bounce [animation-delay:300ms]">·</span>
            </span>
          </p>
        </div>
      )}

      {/* Generating story indicator */}
      {state === "generating_story" && (
        <div className="text-left animate-fade-in">
          <p className="georgia-text text-base text-amber/70 italic">
            Shaping your story…
          </p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
