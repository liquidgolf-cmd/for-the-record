"use client";

import { SessionState } from "@/hooks/useSession";

interface OnAirButtonProps {
  state:    SessionState;
  onStart:  () => void;
}


export default function OnAirButton({ state, onStart }: OnAirButtonProps) {
  const isActive = state !== "idle";
  const isListening = state === "listening";
  const isProcessing = state === "processing" || state === "generating_story";

  return (
    <button
      onClick={state === "idle" ? onStart : undefined}
      aria-label={state === "idle" ? "Begin your story session" : "Session in progress"}
      disabled={isProcessing}
      className={[
        // Base styles
        "relative flex flex-col items-center justify-center",
        "w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56",
        "rounded-2xl select-none",
        "transition-all duration-350",
        "font-georgia font-bold tracking-widest uppercase",

        // Active (recording in progress)
        isActive
          ? [
              "bg-red cursor-default",
              isListening
                ? "animate-on-air-pulse shadow-red-glow"
                : "shadow-red-glow",
            ].join(" ")
          : [
              // Idle — dark, inviting
              "bg-[#2A1010] border border-red/30",
              "cursor-pointer hover:bg-[#3A1A1A] hover:border-red/60",
              "hover:shadow-red-glow",
            ].join(" "),
      ].join(" ")}
    >
      {/* Badge text */}
      <span
        className={[
          "text-xl sm:text-2xl leading-none",
          isActive ? "text-white" : "text-red",
        ].join(" ")}
      >
        ON AIR
      </span>

      {/* Activity indicator dot */}
      <span
        className={[
          "mt-3 w-3 h-3 rounded-full",
          isListening  ? "bg-white animate-pulse" : "",
          isProcessing ? "bg-amber animate-pulse" : "",
          !isActive    ? "bg-red/40" : "",
          isActive && !isListening && !isProcessing ? "bg-white" : "",
        ].join(" ")}
      />

      {/* State sub-label */}
      <span
        className={[
          "mt-2 text-xs tracking-widest uppercase",
          isActive ? "text-white/70" : "text-red/50",
        ].join(" ")}
      >
        {isListening  ? "Listening"  : ""}
        {isProcessing ? "Thinking…"  : ""}
        {state === "georgia_speaking" ? "Speaking" : ""}
        {state === "idle" ? "Tap to begin" : ""}
        {state === "story_preview" || state === "saved" ? "Done" : ""}
      </span>
    </button>
  );
}
