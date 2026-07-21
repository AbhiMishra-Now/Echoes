"use client";

import { Paperclip } from "lucide-react";
import { useRef } from "react";

export function MediaUploader({ onFiles }: { onFiles: (files: File[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      aria-label="Upload media"
      className="p-1.5 text-[#b5954a] hover:text-[#d4af37] transition shrink-0"
    >
      <Paperclip className="h-5 w-5" />
      <input
        ref={ref}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        style={{ display: "none" }}
        onChange={(e) => e.target.files && onFiles(Array.from(e.target.files))}
      />
    </button>
  );
}
