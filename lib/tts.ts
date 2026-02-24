// TTS client — calls /api/tts (server-side Google TTS proxy)
// Returns a playable Audio object

let currentAudio: HTMLAudioElement | null = null;

export async function speak(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: Error) => void
): Promise<void> {
  // Stop any in-progress audio
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

    const blob = await response.blob();
    const url  = URL.createObjectURL(blob);

    currentAudio = new Audio(url);

    return new Promise((resolve, reject) => {
      currentAudio!.onplay  = () => onStart?.();
      currentAudio!.onended = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
        onEnd?.();
        resolve();
      };
      currentAudio!.onerror = () => {
        URL.revokeObjectURL(url);
        currentAudio = null;
        reject(new Error("Audio playback failed"));
      };

      currentAudio!.play().catch(reject);
    });
  } catch (error) {
    console.error("[FTR] TTS speak error:", error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
    // Still advance — Georgia's words are shown on screen
    onEnd?.();
  }
}

export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

export function isSpeaking(): boolean {
  return currentAudio !== null && !currentAudio.paused;
}
