// Web Speech API wrapper — browser-native, no API key needed
// Type declarations for the Web Speech API (not included in standard TS DOM lib)

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    SpeechRecognition:       any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechOptions {
  onResult: (transcript: string, isFinal: boolean) => void;
  onEnd:    (finalTranscript: string) => void;
  onError:  (error: string) => void;
}

let recognition: any = null;
let accumulatedTranscript = "";

export function isSpeechRecognitionSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

export function startListening(options: SpeechOptions): void {
  if (!isSpeechRecognitionSupported()) {
    options.onError(
      "Speech recognition is not supported in this browser. Please use Chrome or Edge."
    );
    return;
  }

  // Clean up any existing session
  stopListening();
  accumulatedTranscript = "";

  const SpeechRecognitionClass =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognitionClass();
  recognition.continuous      = true;
  recognition.interimResults  = true;
  recognition.lang            = "en-US";
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        accumulatedTranscript += result[0].transcript + " ";
      } else {
        interimTranscript += result[0].transcript;
      }
    }

    options.onResult(accumulatedTranscript + interimTranscript, false);
  };

  recognition.onend = () => {
    options.onEnd(accumulatedTranscript.trim());
  };

  recognition.onerror = (event: any) => {
    const msg =
      event.error === "no-speech"
        ? "No speech detected. Try speaking a bit louder."
        : event.error === "not-allowed"
        ? "Microphone access was denied. Please allow microphone access and try again."
        : `Speech error: ${event.error}`;
    options.onError(msg);
  };

  recognition.start();
}

export function stopListening(): string {
  if (recognition) {
    try { recognition.stop(); } catch { /* ignore if already stopped */ }
    recognition = null;
  }
  const final = accumulatedTranscript.trim();
  accumulatedTranscript = "";
  return final;
}
