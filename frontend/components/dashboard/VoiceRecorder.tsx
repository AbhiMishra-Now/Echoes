"use client";

import { Mic, MicOff } from "lucide-react";

export function VoiceRecorder({
  active,
  onClick,
  supported,
}: {
  active: boolean;
  onClick: () => void;
  supported: boolean;
}) {
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? "Stop recording" : "Record voice"}
      className={`p-1.5 transition shrink-0 ${
        active ? "text-red-600 hover:text-red-700 animate-pulse" : "text-[#b5954a] hover:text-[#d4af37]"
      }`}
    >
      {active ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
    </button>
  );
}
