"use client";

import { useSession }           from "@/hooks/useSession";
import { useStories }           from "@/hooks/useStories";
import { getTodaysOpeningQuestion } from "@/lib/georgia";
import Image                   from "next/image";

interface SessionManagerProps {
  userId: string;
}


function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

export default function SessionManager({ userId }: SessionManagerProps) {
  const {
    session,
    startSession,
    userClickedDone,
    confirmSave,
    resetSession,
    triggerStoryGeneration,
  } = useSession(userId);

  const { stories } = useStories(userId);
  const { state, transcript, currentText, generatedStory, error } = session;

  const isListening   = state === "listening";
  const isProcessing  = state === "processing" || state === "generating_story";
  const isSpeaking    = state === "georgia_speaking";
  const isActive      = state !== "idle" && state !== "saved";

  // Georgia text shown prominently above button
  const openingQuestion = getTodaysOpeningQuestion();
  const georgiaText = (() => {
    if (state === "idle" || state === "saved") return openingQuestion;
    if (isSpeaking && currentText) return currentText;
    if (isListening || isProcessing) {
      return [...transcript].reverse().find(t => t.role === "georgia")?.content || openingQuestion;
    }
    return openingQuestion;
  })();

  // User's last / live response shown in the response card
  const lastUserText = [...transcript].reverse().find(t => t.role === "user")?.content || "";
  const responseText = isListening && currentText ? currentText : lastUserText;

  // Recent 3 stories for the bottom grid
  const recentStories = stories.slice(0, 3);

  // ── Story preview state ───────────────────────────────────
  if (state === "story_preview" && generatedStory) {
    return (
      <div className="flex flex-col items-center w-full max-w-xl mx-auto gap-6 px-5 py-10 animate-fade-up">
        <p className="font-georgia text-base text-center text-cream/50 italic">
          {"Here's what we captured."}
        </p>
        <div className="story-card w-full p-6">
          <h2 className="font-georgia text-2xl font-bold text-dark-brown mb-3">
            {generatedStory.title}
          </h2>
          <p className="text-tobacco text-sm leading-relaxed line-clamp-4">
            {generatedStory.body}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {generatedStory.threeWords.map((w: string) => (
              <span key={w} className="tag-pill">{w}</span>
            ))}
            <span className="tag-pill opacity-60">{generatedStory.mood}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={async () => { await confirmSave(); }} className="btn-primary">
            Save this story
          </button>
          <button onClick={resetSession} className="btn-ghost">
            Start over
          </button>
        </div>
      </div>
    );
  }

  // ── Main session layout ───────────────────────────────────
  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto gap-6 px-5 py-6">

      {/* ON AIR status pill */}
      <div className="flex justify-center">
        <div className={[
          "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border",
          "text-[10px] tracking-[0.2em] uppercase font-sans select-none transition-all duration-300",
          isListening ? "border-red/40 text-red/60"
          : isActive  ? "border-amber/30 text-amber/50"
          :             "border-cream/[0.08] text-cream/25",
        ].join(" ")}>
          <span className={[
            "w-1.5 h-1.5 rounded-full transition-all duration-300",
            isListening ? "bg-red animate-pulse"
            : isActive  ? "bg-amber animate-pulse"
            :             "bg-cream/20",
          ].join(" ")} />
          ON AIR
        </div>
      </div>

      {/* Status message (shown after save) */}
      {state === "saved" && (
        <div className="text-center animate-fade-in">
          <p className="text-amber text-[10px] tracking-[0.2em] uppercase font-sans mb-1">
            {"That's saved. Ready whenever you want to tell another."}
          </p>
          <a href="/archive" className="text-xs text-cream/30 hover:text-amber/60 transition-warm underline">
            View in archive →
          </a>
        </div>
      )}

      {/* Error message */}
      {state === "error" && (
        <p className="text-red/70 text-sm text-center animate-fade-in">
          {error || "Something went wrong. Let's try that again."}
        </p>
      )}

      {/* Georgia's text — large italic serif */}
      <p className={[
        "font-georgia text-2xl md:text-3xl italic text-center leading-snug max-w-xl mx-auto animate-fade-in",
        isProcessing ? "text-cream/35" : "text-cream",
      ].join(" ")}>
        &ldquo;{isProcessing ? "Just a moment…" : georgiaText}&rdquo;
      </p>

      {/* Circular BEGIN button */}
      <div className="flex justify-center">
        <button
          onClick={!isProcessing && !isSpeaking ? startSession : undefined}
          disabled={isProcessing || isSpeaking}
          aria-label={state === "idle" ? "Begin session" : "Session in progress"}
          className={[
            "w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center gap-1.5",
            "border transition-all duration-300 select-none",
            isListening
              ? "bg-red/15 border-red/50 animate-on-air-pulse cursor-default"
              : isProcessing || isSpeaking
              ? "bg-amber/[0.06] border-amber/15 cursor-default opacity-50"
              : "bg-[#1E1E10] border-amber/20 hover:border-amber/50 hover:bg-[#252515] cursor-pointer",
          ].join(" ")}
        >
          <Image
            src="/ftr-mic.png"
            alt=""
            width={38}
            height={67}
            className={[
              "transition-opacity duration-300",
              isListening  ? "opacity-100"
              : isActive    ? "opacity-40"
              :               "opacity-90",
            ].join(" ")}
          />
          <span className={[
            "text-[10px] tracking-[0.18em] uppercase font-sans mt-0.5 transition-colors duration-300",
            isListening  ? "text-red/60"
            : isActive    ? "text-amber/35"
            :               "text-amber/55",
          ].join(" ")}>
            {isListening   ? "Listening"
             : isProcessing ? "Thinking"
             : isSpeaking   ? "Speaking"
             : state === "saved" ? "Begin"
             : "Begin"}
          </span>
        </button>
      </div>

      {/* Listening controls */}
      {isListening && (
        <div className="flex flex-col items-center gap-2 animate-fade-in">
          <button onClick={userClickedDone} className="btn-primary">
            Done speaking
          </button>
          <button
            onClick={triggerStoryGeneration}
            className="text-xs text-cream/30 hover:text-cream/60 transition-warm underline"
          >
            End session &amp; save story
          </button>
        </div>
      )}

      {/* Error restart */}
      {state === "error" && (
        <div className="flex justify-center">
          <button onClick={resetSession} className="btn-ghost">Start over</button>
        </div>
      )}

      {/* YOUR RESPONSE */}
      <div className="w-full">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-cream/[0.06]" />
          <span className="text-cream/25 text-[10px] tracking-[0.2em] uppercase font-sans">
            Your Response
          </span>
          <div className="h-px flex-1 bg-cream/[0.06]" />
        </div>
        <div className="bg-[#1A160E] border border-cream/[0.06] rounded-lg px-4 py-3 min-h-[72px]">
          {responseText ? (
            <p className="text-cream/70 text-sm leading-relaxed font-sans">{responseText}</p>
          ) : (
            <p className="text-cream/20 text-sm italic font-georgia">
              Tap Begin to start your session with Georgia…
            </p>
          )}
        </div>
        {(state === "idle" || state === "saved") && (
          <p className="mt-3 text-center text-sm text-cream/25">
            Or{" "}
            <a href="/archive" className="text-amber/50 hover:text-amber transition-warm underline">
              type your story instead
            </a>
          </p>
        )}
      </div>

      {/* RECENT STORIES */}
      {(state === "idle" || state === "saved") && recentStories.length > 0 && (
        <div className="w-full mt-2">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-cream/25 text-[10px] tracking-[0.2em] uppercase font-sans">
              Recent Stories
            </span>
            <div className="h-px flex-1 bg-cream/[0.06]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {recentStories.map(story => (
              <a
                key={story.id}
                href={`/story/${story.id}`}
                className="block bg-[#1E1A12] border border-cream/[0.06] rounded-lg p-3 hover:border-amber/20 transition-warm group"
              >
                <p className="text-amber/40 text-[10px] tracking-widest uppercase font-sans mb-1.5">
                  {formatDate(story.date)}
                </p>
                <p className="text-cream/70 text-sm font-georgia leading-snug line-clamp-2 group-hover:text-cream transition-warm">
                  {story.title}
                </p>
                {story.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {story.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="text-amber/40 text-[9px] tracking-widest uppercase border border-amber/15 px-1.5 py-0.5 rounded-sm font-sans"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
