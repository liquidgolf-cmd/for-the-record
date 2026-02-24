"use client";

import { useState, useCallback, useRef } from "react";
import { speak, stopSpeaking }          from "@/lib/tts";
import { startListening, stopListening } from "@/lib/speech";
import { getTodaysOpeningQuestion }      from "@/lib/georgia";
import { TranscriptMessage } from "@/lib/firestore";
import { GeneratedStory }   from "@/lib/georgia";

// Re-export type for components to use
export type { TranscriptMessage };

export type SessionState =
  | "idle"
  | "georgia_speaking"
  | "listening"
  | "processing"
  | "generating_story"
  | "story_preview"
  | "saved"
  | "error";

export interface SessionData {
  state:            SessionState;
  transcript:       TranscriptMessage[];
  currentText:      string;     // Georgia's latest words OR live speech preview
  generatedStory:   GeneratedStory | null;
  error:            string | null;
  turnCount:        number;
  ttsAvailable:     boolean;    // false once a TTS failure is detected
  ttsError:         string | null; // error message from last TTS failure
}

const INITIAL_STATE: SessionData = {
  state:          "idle",
  transcript:     [],
  currentText:    "",
  generatedStory: null,
  error:          null,
  turnCount:      0,
  ttsAvailable:   true,
  ttsError:       null,
};

export function useSession(userId: string | null) {
  const [session, setSession] = useState<SessionData>(INITIAL_STATE);
  const sessionRef = useRef<SessionData>(INITIAL_STATE);

  // Keep ref in sync so callbacks can read latest state
  const updateSession = useCallback((updates: Partial<SessionData>) => {
    setSession((prev) => {
      const next = { ...prev, ...updates };
      sessionRef.current = next;
      return next;
    });
  }, []);

  // ── Step 1: Start session — Georgia opens ────────────
  const startSession = useCallback(async () => {
    updateSession({ state: "georgia_speaking", transcript: [], turnCount: 0, error: null });

    const openingQuestion = getTodaysOpeningQuestion();

    // Add Georgia's opening to transcript
    const georgiaMessage: TranscriptMessage = {
      role:    "georgia",
      content: openingQuestion,
    };
    updateSession({
      transcript:  [georgiaMessage],
      currentText: openingQuestion,
    });

    // Speak it
    await speak(
      openingQuestion,
      () => updateSession({ state: "georgia_speaking" }),
      () => {
        // Audio ended → start listening
        updateSession({ state: "listening", currentText: "" });
        beginListening();
      },
      (e) => updateSession({ ttsAvailable: false, ttsError: e.message })
    );
  }, [updateSession]);

  // ── Step 2: Listen for user ───────────────────────────
  const beginListening = useCallback(() => {
    startListening({
      onResult: (transcript, _isFinal) => {
        updateSession({ currentText: transcript });
      },
      onEnd: (finalTranscript) => {
        if (!finalTranscript.trim()) return; // nothing said
        handleUserResponse(finalTranscript.trim());
      },
      onError: (err) => {
        updateSession({ state: "error", error: err });
      },
    });
  }, []);

  // ── Step 3: Send user response to Georgia API ─────────
  const handleUserResponse = useCallback(async (userText: string) => {
    const current = sessionRef.current;

    const userMessage: TranscriptMessage = { role: "user", content: userText };
    const newTranscript = [...current.transcript, userMessage];
    const newTurnCount  = current.turnCount + 1;

    updateSession({
      state:      "processing",
      transcript: newTranscript,
      turnCount:  newTurnCount,
      currentText: "",
    });

    try {
      // If 4+ user turns, tell Claude to wrap up
      const shouldWrapUp = newTurnCount >= 4;

      const res = await fetch("/api/georgia", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages:   newTranscript,
          wrapUp:     shouldWrapUp,
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();

      if (data.story) {
        // Claude returned a story — go to preview
        updateSession({
          state:          "story_preview",
          generatedStory: data.story,
          transcript:     newTranscript,
        });
      } else {
        // Georgia's next question
        const georgiaMessage: TranscriptMessage = {
          role:    "georgia",
          content: data.message,
        };
        const updatedTranscript = [...newTranscript, georgiaMessage];

        updateSession({
          state:      "georgia_speaking",
          transcript: updatedTranscript,
          currentText: data.message,
        });

        await speak(
          data.message,
          () => updateSession({ state: "georgia_speaking" }),
          () => {
            updateSession({ state: "listening", currentText: "" });
            beginListening();
          },
          (e) => updateSession({ ttsAvailable: false, ttsError: e.message })
        );
      }
    } catch (err) {
      updateSession({
        state: "error",
        error: "Something went wrong. Let's try that again.",
      });
    }
  }, [updateSession, beginListening]);

  // ── Manual "Done" button — stop recording early ───────
  const userClickedDone = useCallback(() => {
    const finalTranscript = stopListening();
    if (finalTranscript.trim()) {
      handleUserResponse(finalTranscript.trim());
    } else {
      // Nothing said — trigger wrap-up directly
      triggerStoryGeneration();
    }
  }, [handleUserResponse]);

  // ── Trigger story generation without further questions ─
  const triggerStoryGeneration = useCallback(async () => {
    const current = sessionRef.current;
    updateSession({ state: "generating_story" });

    try {
      const res = await fetch("/api/georgia", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages: current.transcript,
          wrapUp:   true,
          forceStory: true,
        }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();

      if (data.story) {
        updateSession({
          state:          "story_preview",
          generatedStory: data.story,
        });
      } else {
        throw new Error("No story returned");
      }
    } catch {
      updateSession({
        state: "error",
        error: "Couldn't shape your story. Try again.",
      });
    }
  }, [updateSession]);

  // ── Confirm save → Firestore ──────────────────────────
  const confirmSave = useCallback(async (): Promise<string | null> => {
    const current = sessionRef.current;
    if (!current.generatedStory || !userId) return null;

    const { saveStory } = await import("@/lib/firestore");
    const today = new Date().toISOString().split("T")[0];

    const storyId = await saveStory(userId, {
      ...current.generatedStory,
      tags:              current.generatedStory.themes,
      date:              today,
      sessionTranscript: current.transcript,
    });

    updateSession({ state: "saved" });

    // Speak the save confirmation
    await speak("Saved. That one's worth keeping.");

    return storyId;
  }, [userId, updateSession]);

  // ── Reset back to idle ────────────────────────────────
  const resetSession = useCallback(() => {
    stopSpeaking();
    stopListening();
    setSession(INITIAL_STATE);
    sessionRef.current = INITIAL_STATE;
  }, []);

  return {
    session,
    startSession,
    userClickedDone,
    confirmSave,
    resetSession,
    triggerStoryGeneration,
  };
}
