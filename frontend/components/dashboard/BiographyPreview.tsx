"use client";

import Link from "next/link";
import { Expand, Share2, Upload } from "lucide-react";
import { useRef } from "react";
import { useBiographyStore } from "../../store/biographyStore";
import { ScrollViewer as LivingScrollViewer } from "../scroll-viewer/ScrollViewer";
import type { MemoryItem, NarrativeChapter } from "../../types/scroll";
import { useMediaUpload } from "../../hooks/useMediaUpload";
import { TimelineView } from "./TimelineView";
import { PreviewSkeleton } from "../ui/PreviewSkeleton";

export function BiographyPreview({ onExpand }: { onExpand?: () => void }) {
  const {
    chapters,
    previewMode,
    setPreviewMode,
    switchChapter,
    isLoading,
    narrativeByChapter,
    messages,
    currentBiographyId,
    addToast,
    currentChapterId,
  } = useBiographyStore();

  const input = useRef<HTMLInputElement>(null);
  const upload = useMediaUpload(currentChapterId);

  const scrollChapters: NarrativeChapter[] = chapters.map((chapter) => {
    const chapterMessages = messages.filter((message) => message.chapterId === chapter.id);
    const writtenText = chapterMessages
      .filter((message) => message.sender === "user" && message.content.trim())
      .map((message) => message.content.trim())
      .join("\n\n");
    const images = chapterMessages.flatMap((message) =>
      (message.media ?? [])
        .filter((media) => media.type === "image")
        .map((media, index) => ({
          url: media.url,
          caption: media.filename,
          position: index,
        }))
    );
    return {
      id: chapter.id,
      title: narrativeByChapter[chapter.id]?.chapterTitle ?? chapter.title,
      text:
        narrativeByChapter[chapter.id]?.narrativeText ??
        writtenText ??
        chapter.description,
      images,
    };
  });

  const memories: MemoryItem[] = messages.flatMap((message) =>
    (message.media ?? [])
      .filter(
        (media) =>
          media.type === "image" || media.type === "video" || media.type === "audio"
      )
      .map((media) => ({
        id: media.id,
        type: media.type as MemoryItem["type"],
        url: media.url,
        chapterIndex: Math.max(
          0,
          chapters.findIndex((chapter) => chapter.id === message.chapterId)
        ),
        timestamp: Math.min(
          0.94,
          Math.max(
            0.06,
            (new Date(message.timestamp).getTime() % 1000) / 1000
          )
        ),
      }))
  );

  return (
    <aside className="biography-preview relative flex flex-col h-full min-h-0 bg-[#190022] border border-gold/45 shadow-[inset_0_0_20px_rgba(0,0,0,0.8),-5px_8px_20px_rgba(0,0,0,0.6)] rounded-3xl p-5 text-parchment overflow-hidden">
      {/* Header */}
      <header className="mb-4 text-center">
        <h2 className="font-script text-3xl text-gold-bright tracking-wide">
          Your Living Scroll
        </h2>
        <div className="ornament-line mx-auto mt-1 w-24" />
        {isLoading && (
          <span className="inline-block mt-2 text-[10px] uppercase tracking-wider text-gold-bright animate-pulse">
            Updating Scroll…
          </span>
        )}
      </header>

      {/* WebGL 3D Scroll Scene or Timeline View */}
      <div className="flex-1 min-h-0 bg-black/35 rounded-2xl border border-gold/20 overflow-hidden relative shadow-inner group hover:shadow-[0_0_20px_rgba(212,168,83,0.25)] transition-all duration-300">
        {/* Pulsing interactive glow beacon */}
        {previewMode === "scroll" && !isLoading && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#d4a853]/20 border border-[#d4a853]/40 rounded-full px-2.5 py-0.5 z-10 text-[9px] text-gold-bright tracking-widest uppercase font-sans select-none pointer-events-none shadow-[0_0_8px_rgba(212,168,83,0.2)]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold-bright"></span>
            </span>
            <span>Interactive 3D</span>
          </div>
        )}

        {/* Latest memories thumbnails overlay on the scroll surface */}
        {previewMode === "scroll" && !isLoading && memories.length > 0 && (
          <div className="absolute bottom-3 left-3 flex gap-1.5 z-10 bg-black/60 border border-gold/25 p-1.5 rounded-xl backdrop-blur-sm shadow-lg">
            {memories.slice(-3).map((mem, i) => (
              <div key={i} className="h-8 w-8 rounded-lg overflow-hidden border border-gold/30 hover:border-gold-bright transition duration-200">
                <img src={mem.url} alt="thumbnail" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {isLoading ? (
          <PreviewSkeleton isVisible />
        ) : previewMode === "scroll" ? (
          <LivingScrollViewer
            biographyId={currentBiographyId ?? "local-preview"}
            chapters={scrollChapters}
            memories={memories}
            onMemoryClick={(memory) =>
              addToast({
                title: "Memory Knot",
                message: `Opening ${memory.type} memory…`,
                variant: "info",
                duration: 2500,
              })
            }
          />
        ) : (
          <TimelineView chapters={chapters} onSelect={switchChapter} />
        )}
      </div>

      {/* Slider under 3D scroll scene */}
      {previewMode === "scroll" && (
        <div className="mt-3 px-2 flex items-center gap-3">
          <span className="text-[10px] text-parchment/40">0%</span>
          <div className="flex-1 h-1 bg-black/40 rounded-full border border-gold/10 relative">
            <div className="absolute top-1/2 -translate-y-1/2 left-[30%] h-3 w-3 rounded-full bg-gold border border-gold-bright shadow-md editor-pointer" />
          </div>
          <span className="text-[10px] text-parchment/40">100%</span>
        </div>
      )}

      {/* View Switcher Tabs (Scroll | Timeline) */}
      <div className="mt-4 flex rounded-xl border border-gold/25 bg-black/40 p-1">
        <button
          type="button"
          onClick={() => setPreviewMode("scroll")}
          className={`flex-1 text-center py-2 text-xs font-display font-bold uppercase tracking-widest rounded-lg transition ${
            previewMode === "scroll"
              ? "bg-[#d4a853] text-[#1a1028] shadow-md"
              : "text-parchment/65 hover:text-parchment hover:bg-white/[0.03]"
          }`}
        >
          Scroll
        </button>
        <button
          type="button"
          onClick={() => setPreviewMode("timeline")}
          className={`flex-1 text-center py-2 text-xs font-display font-bold uppercase tracking-widest rounded-lg transition ${
            previewMode === "timeline"
              ? "bg-[#d4a853] text-[#1a1028] shadow-md"
              : "text-parchment/65 hover:text-parchment hover:bg-white/[0.03]"
          }`}
        >
          Timeline
        </button>
      </div>

      {/* Mockup matching footer design control box */}
      <div className="mt-4 border border-gold/25 bg-[#1b0227]/60 rounded-2xl p-4 flex items-center justify-between shadow-inner relative overflow-hidden">
        {/* Expand icon on the left */}
        <button
          type="button"
          onClick={onExpand}
          className="text-gold-bright hover:scale-110 transition p-1"
          title="Full Screen Editor Mode"
        >
          <Expand className="h-5 w-5" />
        </button>
        
        {/* Visual style selectors (three thumbnails) in a sub-group */}
        <div className="flex items-center gap-1 bg-black/40 border border-gold/15 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setPreviewMode("scroll")}
            className="h-7 w-8 bg-white/[0.04] border border-gold/20 rounded-lg flex items-center justify-center text-[11px] text-gold-bright hover:bg-white/10 transition"
          >
            ☷
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("scroll")}
            className="h-7 w-8 bg-gold-bright text-ink rounded-lg flex items-center justify-center text-xs hover:brightness-105 transition"
          >
            📄
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode("timeline")}
            className="h-7 w-8 bg-white/[0.04] border border-gold/20 rounded-lg flex items-center justify-center text-[11px] text-gold-bright hover:bg-white/10 transition"
          >
            ☷
          </button>
        </div>
        
        {/* Share icon on the right */}
        <button
          type="button"
          onClick={() => {
            addToast({
              title: "Share Legacy",
              message: "Copying legacy scroll link to clipboard...",
              variant: "success",
              duration: 2500,
            });
          }}
          className="text-gold-bright hover:scale-110 transition p-1"
          title="Share Legacy"
        >
          <Share2 className="h-5 w-5" />
        </button>

        {/* Pulsing decoration star overlay */}
        <div className="absolute right-4 top-2 text-gold/30 text-base animate-pulse pointer-events-none select-none">
          ✦
        </div>
      </div>

      <input
        ref={input}
        hidden
        type="file"
        accept="image/*,video/*,audio/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload.upload(file);
        }}
      />
    </aside>
  );
}
