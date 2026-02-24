// TTS client — calls /api/tts (server-side Google TTS proxy)
//
// Uses Web Audio API for playback. AudioContext must be created/resumed
// synchronously inside a user gesture (call unlockAudio() on button tap)
// before any async work — this is what makes iOS Safari work correctly.

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentFallbackAudio: HTMLAudioElement | null = null;

// ── Call this SYNCHRONOUSLY inside the button click handler ──────────────────
// Creates (or resumes) the AudioContext while the gesture is still active.
// Once the context is running, speak() can play audio after any amount of
// async work — iOS won't block it.
export function unlockAudio(): void {
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  } catch {
    // AudioContext not available — will fall back to HTMLAudioElement
  }
}

// ── Main speak function ───────────────────────────────────────────────────────
export async function speak(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  stopSpeaking();

  try {
    const response = await fetch("/api/tts", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    // ── Web Audio API path (preferred — works on iOS after unlockAudio()) ──
    if (audioCtx) {
      if (audioCtx.state === "suspended") await audioCtx.resume();

      // decodeAudioData mutates the buffer, so pass a copy
      const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      const source  = audioCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(audioCtx.destination);
      currentSource = source;

      return new Promise((resolve) => {
        source.onended = () => {
          currentSource = null;
          onEnd?.();
          resolve();
        };
        onStart?.();
        source.start(0);
      });
    }

    // ── HTMLAudioElement fallback (desktop browsers without gesture issue) ─
    const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
    const url  = URL.createObjectURL(blob);
    currentFallbackAudio = new Audio(url);

    return new Promise((resolve, reject) => {
      currentFallbackAudio!.onplay  = () => onStart?.();
      currentFallbackAudio!.onended = () => {
        URL.revokeObjectURL(url);
        currentFallbackAudio = null;
        onEnd?.();
        resolve();
      };
      currentFallbackAudio!.onerror = () => {
        URL.revokeObjectURL(url);
        currentFallbackAudio = null;
        reject(new Error("Audio playback failed"));
      };
      currentFallbackAudio!.play().catch(reject);
    });

  } catch (error) {
    console.error("[FTR] TTS speak error:", error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
    // Still advance — Georgia's words are shown on screen
    onEnd?.();
  }
}

// ── Stop whatever is currently playing ───────────────────────────────────────
export function stopSpeaking(): void {
  if (currentSource) {
    try { currentSource.stop(); } catch { /* already stopped */ }
    currentSource = null;
  }
  if (currentFallbackAudio) {
    currentFallbackAudio.pause();
    currentFallbackAudio.src = "";
    currentFallbackAudio = null;
  }
}

export function isSpeaking(): boolean {
  return currentSource !== null || (
    currentFallbackAudio !== null && !currentFallbackAudio.paused
  );
}
