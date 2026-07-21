"use client";

import { Send, Sparkles } from "lucide-react";
import { useState } from "react";
import { MediaUploader } from "./MediaUploader";
import { VoiceRecorder } from "./VoiceRecorder";
import { useVoiceRecognition } from "../../hooks/useVoiceRecognition";

export function InputArea({
  onSend,
  onFiles,
  loading,
}: {
  onSend: (text: string) => void;
  onFiles: (files: File[]) => void;
  loading: boolean;
}) {
  const [value, setValue] = useState("");
  const voice = useVoiceRecognition((text) => setValue((v) => `${v} ${text}`.trim()));

  const send = () => {
    if (!value.trim() || loading) return;
    onSend(value);
    setValue("");
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Curved white input box resembling the attached design mockup */}
      <div className="flex items-center gap-3 bg-[#fffdf9] border-2 border-gold/45 rounded-full px-5 py-2.5 shadow-[0_6px_16px_rgba(0,0,0,0.15)] transition-shadow focus-within:shadow-[0_6px_20px_rgba(212,175,55,0.25)]">
        {/* Attachment clip */}
        <MediaUploader onFiles={onFiles} />

        {/* Microphone recorder */}
        <VoiceRecorder
          active={voice.listening}
          onClick={voice.toggle}
          supported={voice.supported}
        />

        {/* Choose memory type (Sparkles) button */}
        <button
          type="button"
          aria-label="Choose memory type"
          className="p-1.5 text-[#b5954a] hover:text-[#d4af37] transition shrink-0"
        >
          <Sparkles className="h-5 w-5" />
        </button>

        {/* Text Area */}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Share your memory, thought, or story..."
          aria-label="Your memory"
          maxLength={4000}
          rows={1}
          className="flex-1 bg-transparent border-0 outline-none resize-none text-ink placeholder-ink/40 text-lg font-serif leading-relaxed h-[28px] max-h-[140px] overflow-y-auto"
        />

        {/* Character count */}
        {value.length > 0 && (
          <span className="text-[10px] text-ink/40 font-mono self-center pr-1 shrink-0">
            {value.length}/4000
          </span>
        )}

        {/* Send paper airplane button */}
        <button
          type="button"
          onClick={send}
          disabled={!value.trim() || loading}
          aria-label="Send memory"
          className="p-1 text-[#b5954a] hover:text-[#d4af37] transition disabled:opacity-30 disabled:hover:text-[#b5954a] shrink-0"
        >
          <Send className="h-5 w-5 rotate-45 -translate-y-[1px]" />
        </button>
      </div>

      {voice.listening && (
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-red-700 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md animate-pulse">
          Listening…
        </span>
      )}
    </div>
  );
}
