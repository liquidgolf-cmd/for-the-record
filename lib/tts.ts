// TTS client — calls /api/tts (server-side Google TTS proxy)
//
// Priority chain:
//   1. Google Neural TTS via /api/tts  (best quality, requires API key)
//   2. Browser SpeechSynthesis         (always available, no key needed)
//
// Call unlockAudio() synchronously inside the button click handler so iOS
// Safari allows audio playback after the async fetch completes.

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentFallbackAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

// ── Unlock AudioContext on user gesture (required for iOS Safari) ─────────────
export function unlockAudio(): void {
  try {
    if (typeof window === "undefined") return;
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
  } catch {
    // AudioContext not available — will use HTMLAudioElement or SpeechSynthesis
  }
}

// ── Browser SpeechSynthesis fallback ─────────────────────────────────────────
function speakWithBrowserTTS(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;

    // Cancel anything currently speaking
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate  = 0.9;
    utterance.pitch = 0.95;
    utterance.lang  = "en-US";

    // Pick a warm female voice if available
    const pickVoice = () => {
      const voices = synth.getVoices();
      return (
        voices.find((v) => v.name === "Samantha")                          ||  // iOS/macOS
        voices.find((v) => v.name.includes("Google US English Female"))    ||  // Chrome Android
        voices.find((v) => v.lang === "en-US" && v.name.includes("Female"))||
        voices.find((v) => v.lang === "en-US" && v.localService)           ||
        voices.find((v) => v.lang.startsWith("en"))                        ||
        null
      );
    };

    const assignVoiceAndSpeak = () => {
      const voice = pickVoice();
      if (voice) utterance.voice = voice;
      currentUtterance = utterance;
      utterance.onstart = () => onStart?.();
      utterance.onend   = () => { currentUtterance = null; onEnd?.(); resolve(); };
      utterance.onerror = () => { currentUtterance = null; onEnd?.(); resolve(); };
      synth.speak(utterance);
    };

    // Voices may not be loaded yet on first call
    if (synth.getVoices().length > 0) {
      assignVoiceAndSpeak();
    } else {
      synth.onvoiceschanged = () => {
        synth.onvoiceschanged = null;
        assignVoiceAndSpeak();
      };
      // Fallback if onvoiceschanged never fires (Firefox)
      setTimeout(assignVoiceAndSpeak, 300);
    }
  });
}

// ── Main speak function ───────────────────────────────────────────────────────
export async function speak(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  stopSpeaking();

  // ── Try Google Neural TTS first ──────────────────────────────────────────
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

    // Web Audio API path — survives iOS post-fetch autoplay restrictions
    if (audioCtx) {
      if (audioCtx.state === "suspended") await audioCtx.resume();

      const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      const source  = audioCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(audioCtx.destination);
      currentSource = source;

      return new Promise((resolve) => {
        source.onended = () => { currentSource = null; onEnd?.(); resolve(); };
        onStart?.();
        source.start(0);
      });
    }

    // HTMLAudioElement path — desktop browsers
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

  } catch (googleError) {
    console.warn("[FTR] Google TTS unavailable, using device voice:", googleError);

    // ── Fall back to browser SpeechSynthesis ──────────────────────────────
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        await speakWithBrowserTTS(text, onStart, onEnd);
        return; // Browser TTS worked — don't surface an error
      } catch (browserError) {
        console.error("[FTR] Browser TTS also failed:", browserError);
      }
    }

    // Both failed — tell the session so UI can show a notice
    onError?.(googleError instanceof Error ? googleError : new Error(String(googleError)));
    onEnd?.();
  }
}

// ── Stop all audio ────────────────────────────────────────────────────────────
export function stopSpeaking(): void {
  if (currentSource) {
    try { currentSource.stop(); } catch { /* already ended */ }
    currentSource = null;
  }
  if (currentFallbackAudio) {
    currentFallbackAudio.pause();
    currentFallbackAudio.src = "";
    currentFallbackAudio = null;
  }
  if (currentUtterance && typeof window !== "undefined") {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

export function isSpeaking(): boolean {
  return (
    currentSource !== null ||
    (currentFallbackAudio !== null && !currentFallbackAudio.paused) ||
    (currentUtterance !== null)
  );
}
