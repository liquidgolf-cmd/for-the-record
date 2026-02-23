"use client";

import { useSession }    from "@/hooks/useSession";
import OnAirButton       from "./OnAirButton";
import TranscriptDisplay from "./TranscriptDisplay";

interface SessionManagerProps {
  userId: string;
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

  const { state, transcript, currentText, generatedStory, error } = session;

  return (
    <div className="flex flex-col items-center w-full px-4">

      {/* ── Greeting / Idle prompt ── */}
      {state === "idle" && (
        <p className="georgia-text text-xl text-center mb-10 text-cream/70 animate-fade-in">
          Ready when you are.
        </p>
      )}

      {/* ── Georgia's current words (before transcript scrolls) ── */}
      {state === "georgia_speaking" && currentText && transcript.length <= 1 && (
        <p className="georgia-text text-xl text-center mb-10 max-w-lg animate-fade-in">
          {currentText}
        </p>
      )}

      {/* ── ON AIR Button ── */}
      {state !== "story_preview" && state !== "saved" && (
        <OnAirButton state={state} onStart={startSession} />
      )}

      {/* ── Saved confirmation ── */}
      {state === "saved" && (
        <div className="text-center animate-fade-up">
          <p className="georgia-text text-2xl text-amber mb-2">
            Saved.
          </p>
          <p className="text-cream/60 text-base mb-8">
            {"That one's worth keeping."}
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/archive" className="btn-primary">
              View in archive
            </a>
            <button onClick={resetSession} className="btn-ghost">
              New session
            </button>
          </div>
        </div>
      )}

      {/* ── Transcript ── */}
      {state !== "idle" && state !== "saved" && state !== "story_preview" && (
        <TranscriptDisplay
          transcript={transcript}
          liveText={currentText}
          state={state}
        />
      )}

      {/* ── Listening controls ── */}
      {state === "listening" && (
        <div className="mt-8 flex flex-col items-center gap-3 animate-fade-in">
          <button
            onClick={userClickedDone}
            className="btn-primary"
          >
            Done speaking
          </button>
          <button
            onClick={triggerStoryGeneration}
            className="text-sm text-cream/40 hover:text-cream/70 transition-warm underline"
          >
            End session &amp; save story
          </button>
        </div>
      )}

      {/* ── Story Preview ── */}
      {state === "story_preview" && generatedStory && (
        <div className="w-full max-w-xl mt-4 animate-fade-up">
          <p className="georgia-text text-base text-center text-cream/50 mb-6 italic">
            {"Here's what we captured."}
          </p>

          {/* Preview card */}
          <div className="story-card p-6 mb-6">
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
              <span className="tag-pill opacity-70">{generatedStory.mood}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={async () => { await confirmSave(); }}
              className="btn-primary"
            >
              Save this story
            </button>
            <button
              onClick={resetSession}
              className="btn-ghost"
            >
              Start over
            </button>
          </div>
        </div>
      )}

      {/* ── Text fallback link ── */}
      {state === "idle" && (
        <p className="mt-8 text-sm text-cream/30">
          <a href="/archive/new" className="hover:text-cream/60 transition-warm underline">
            Type instead
          </a>
        </p>
      )}

      {/* ── Error state ── */}
      {state === "error" && (
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-red/80 text-sm mb-4">
            {error || "Something didn't save. Let's try that again."}
          </p>
          <button onClick={resetSession} className="btn-ghost">
            Start over
          </button>
        </div>
      )}
    </div>
  );
}
