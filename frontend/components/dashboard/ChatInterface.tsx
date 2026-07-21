"use client";

import { FileDropZone } from "../ui/FileDropZone";
import { AIThinkingIndicator } from "../ui/AIThinkingIndicator";
import { MessageSkeleton } from "../ui/MessageSkeleton";
import { TypingIndicator } from "../ui/TypingIndicator";
import { useBiographyStore } from "../../store/biographyStore";
import { useChatStream } from "../../hooks/useChatStream";
import { useMediaUpload } from "../../hooks/useMediaUpload";
import { useAutoScroll } from "../../hooks/useAutoScroll";
import { EmptyState } from "./EmptyState";
import { InputArea } from "./InputArea";
import { MessageBubble } from "./MessageBubble";

export function ChatInterface() {
  const {
    messages,
    currentChapterId,
    currentBiographyId,
    currentUser,
    isLoading,
    isTyping,
    chapters,
  } = useBiographyStore();

  const currentChapter = chapters.find((c) => c.id === currentChapterId);

  const stream = useChatStream({
    userId: currentUser.id,
    bioId: currentBiographyId ?? "",
    chapterId: currentChapterId,
  });

  const media = useMediaUpload(currentChapterId);
  const visible = messages.filter((m) => m.chapterId === currentChapterId);
  const scroll = useAutoScroll(`${visible.length}-${isLoading}`);

  const uploadFiles = async (files: File[]) => {
    for (const file of files) await media.upload(file);
  };

  // Determine dynamic prompt header based on current chapter or fallback
  const promptHeader = currentChapter?.description || "Tell me about your childhood...";

  return (
    <FileDropZone onFiles={uploadFiles}>
      <section className="relative flex flex-col h-full min-h-[550px] bg-[#100018] rounded-3xl border border-gold/30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Scroll Roller at the top (top cylinder) */}
        <div className="absolute top-0 inset-x-4 z-20 h-6 rounded-full bg-gradient-to-b from-[#eedcb4] via-[#c4a675] to-[#7c5d32] border-b border-gold/30 shadow-[0_4px_10px_rgba(0,0,0,0.35)]" />

        {/* The main parchment scroll body */}
        <div className="relative flex-1 flex flex-col bg-parchment mx-5 mt-3 mb-6 rounded-b-2xl shadow-inner overflow-hidden border-x border-b border-[#a87c2e]/20">
          {/* Paper texture overlay */}
          <div className="absolute inset-0 paper-texture opacity-60 pointer-events-none" />
          <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#d4a853]/15 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#d4a853]/15 to-transparent pointer-events-none" />

          {/* Scribe Header / Ink Splash */}
          <header className="relative z-10 px-6 pt-7 pb-2 text-center select-none">
            <div className="relative mx-auto max-w-lg flex items-center justify-center min-h-[70px]">
              {/* Dynamic Ink Splash SVG */}
              <svg
                className="absolute inset-0 w-full h-full text-[#1c1424] filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
                viewBox="0 0 350 70"
                fill="currentColor"
                preserveAspectRatio="none"
              >
                <path d="M 10 35 C 30 15, 90 8, 175 14 C 260 8, 320 15, 340 35 C 320 55, 260 62, 175 55 C 90 62, 30 55, 10 35 Z" />
                <circle cx="28" cy="18" r="3" />
                <circle cx="320" cy="50" r="2.5" />
                <path d="M 40 45 C 42 48, 48 46, 45 42 Z" />
              </svg>
              {/* Ink Text */}
              <span className="relative z-10 text-parchment font-serif italic text-base sm:text-lg tracking-wide px-8 py-2 text-center max-w-[85%] truncate">
                {promptHeader}
              </span>
            </div>
          </header>

          {/* Chat scroll space inside the parchment */}
          <div
            className="flex-1 overflow-y-auto scroll-hide px-6 py-4 relative z-10"
            ref={scroll.ref}
            onScroll={scroll.check}
          >
            {visible.length === 0 ? (
              <EmptyState onPrompt={stream.sendMessage} />
            ) : (
              <div className="messages max-w-2xl mx-auto">
                {visible.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
                {stream.isLoading && (
                  <>
                    <MessageSkeleton />
                    <TypingIndicator />
                  </>
                )}
                <AIThinkingIndicator isVisible={isTyping} />
              </div>
            )}
          </div>

          {/* Scroll to Latest Button */}
          {!scroll.atBottom && (
            <button
              onClick={scroll.scrollToBottom}
              className="absolute bottom-16 right-6 z-20 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gold-bright via-gold to-gold-dim border border-gold/25 px-4 py-2 text-xs font-semibold text-ink shadow-lg hover:scale-105 transition"
            >
              ↓ Scroll to Latest
            </button>
          )}

          {/* Diagonally resting physical writing quill pen at bottom-right corner as seen in mockup */}
          <div className="absolute bottom-14 right-2 z-20 pointer-events-none select-none w-28 h-20 opacity-85 rotate-[12deg] filter drop-shadow-[2px_4px_6px_rgba(0,0,0,0.3)]">
            <svg
              viewBox="0 0 120 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-gold-dim"
            >
              {/* Feather quill stem */}
              <path
                d="M10 70 C30 65, 80 40, 110 10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Feather barbules */}
              <path
                d="M110 10 C90 18, 70 25, 45 35 C55 32, 70 28, 85 24 M100 14 C85 22, 60 30, 35 40 C45 37, 65 32, 75 28 M90 18 C75 26, 50 34, 25 45 C35 42, 55 36, 65 32 M80 22 C65 30, 40 38, 15 50"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Gold nib tip */}
              <path
                d="M8 71 L5 75 L11 74 Z"
                fill="#d4a853"
                stroke="#a67c2e"
                strokeWidth="0.75"
              />
            </svg>
          </div>

          {/* Curved text input box */}
          <div className="relative z-20 mt-auto bg-gradient-to-t from-parchment via-parchment/95 to-transparent pt-4">
            <InputArea
              onSend={stream.sendMessage}
              onFiles={uploadFiles}
              loading={stream.isLoading}
            />
          </div>
        </div>

        {/* Media upload progress indicator */}
        {media.isUploading && (
          <div
            className="absolute bottom-0 inset-x-0 h-1 bg-black/30 z-30"
            role="status"
            aria-live="polite"
          >
            <div
              className="h-full bg-gradient-to-r from-gold-bright via-gold to-gold-dim transition-all duration-300"
              style={{ width: `${media.progress}%` }}
            />
          </div>
        )}
      </section>
    </FileDropZone>
  );
}
