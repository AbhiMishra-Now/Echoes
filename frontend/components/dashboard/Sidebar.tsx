"use client";

import { BookOpen, Share2, Settings, Image, Sparkles, Trash2 } from "lucide-react";
import { useBiographyStore } from "../../store/biographyStore";
import { deleteChapter as deleteChapterApi } from "../../lib/api";

export function Sidebar({ onNew }: { onNew: () => void }) {
  const store = useBiographyStore();
  const { currentUser, chapters, currentChapterId, switchChapter, messages } = store;

  // Find index of current chapter
  const currentIndex = chapters.findIndex((c) => c.id === currentChapterId);
  const activeChapterNumber = currentIndex !== -1 ? currentIndex + 1 : 1;

  // Calculate progress percent
  const completeChapters = chapters.filter(
    (c) => messages.filter((m) => m.chapterId === c.id).length >= 5
  ).length;
  const progressPercent = Math.round((completeChapters / Math.max(chapters.length, 8)) * 100);

  // Count total memories (user messages or attached media)
  const totalMemories = messages.filter((m) => m.sender === "user").length;

  const handleDeleteChapter = async (id: string, title: string) => {
    const ok = window.confirm(`Delete this chapter "${title}" forever? This cannot be undone.`);
    if (!ok) return;
    try {
      if (store.currentBiographyId) {
        await deleteChapterApi(store.currentBiographyId, id, store.currentUser.id);
      }
      store.removeChapter(id);
      store.addToast({
        title: "Chapter Deleted",
        message: `"${title}" has vanished from your legacy.`,
        variant: "info",
        duration: 3500,
      });
    } catch (err) {
      console.error(err);
      store.addToast({
        title: "Delete Failed",
        message: "The magic link failed. Could not delete chapter.",
        variant: "error",
        duration: 4000,
      });
    }
  };

  return (
    <aside className="dashboard-sidebar relative flex flex-col h-full min-h-0 bg-leather border border-gold/45 shadow-[inset_0_0_20px_rgba(0,0,0,0.8),5px_8px_20px_rgba(0,0,0,0.6)] rounded-3xl p-5 text-parchment overflow-hidden">
      {/* Profile Card */}
      <div className="flex items-center gap-3 border-b border-gold/15 pb-4 mb-4">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-royal-mid to-royal-deep border-2 border-gold font-display text-base text-gold-bright shadow-lg">
          LB
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg text-parchment truncate font-semibold leading-tight">
            {currentUser.name}
          </p>
          <p className="text-xs text-gold/70 tracking-wider">Legacy Builder</p>
        </div>
      </div>

      {/* Progress Box */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gold-bright font-display font-semibold mb-1">
          <span>Scroll Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 w-full bg-[#1b0227] rounded-full border border-gold/20 overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-gold-bright via-gold to-gold-dim rounded-full shadow-[0_0_8px_#ffe69a]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats Counter Boxes */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-[#1b0227]/50 rounded-xl border border-gold/15 p-2.5 text-center shadow-inner">
          <p className="text-[10px] text-gold/60 font-semibold tracking-wider uppercase mb-0.5">
            Memories
          </p>
          <p className="font-display text-2xl text-gold-bright font-bold">
            {totalMemories}
          </p>
        </div>
        <div className="bg-[#1b0227]/50 rounded-xl border border-gold/15 p-2.5 text-center shadow-inner">
          <p className="text-[10px] text-gold/60 font-semibold tracking-wider uppercase mb-0.5">
            Chapters
          </p>
          <p className="font-display text-2xl text-gold-bright font-bold">
            {chapters.length}
          </p>
        </div>
      </div>

      {/* Chapter Navigator Archive */}
      <nav className="archive-scrollbar flex-1 overflow-y-auto pr-1 flex flex-col gap-2 mb-4">
        {chapters.map((chapter, index) => {
          const isActive = chapter.id === currentChapterId;
          return (
            <div
              key={chapter.id}
              className={`relative flex items-center justify-between group/item w-full rounded-xl transition ${
                isActive
                  ? "bg-white/[0.04] border border-gold/45 shadow-md shadow-black/25"
                  : "hover:bg-white/[0.02] border border-transparent"
              }`}
            >
              <button
                type="button"
                onClick={() => switchChapter(chapter.id)}
                className="flex-1 text-left px-3 py-3 select-none min-w-0"
              >
                <div className="flex items-center gap-2 min-w-0 pr-8">
                  <span className="font-display text-base text-gold-bright/80 font-bold shrink-0">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-medium text-sm text-parchment truncate">
                    {chapter.title}
                  </span>
                </div>
              </button>

              {/* Delete Chapter Button */}
              {chapters.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChapter(chapter.id, chapter.title);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-parchment/40 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition duration-150 z-20"
                  title="Delete Chapter"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}

              {/* Bookmark Ribbon on Active Chapter */}
              {isActive && (
                <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 z-10 pointer-events-none select-none group-hover/item:opacity-0 transition">
                  <div className="relative">
                    {/* Ribbon box */}
                    <div className="bg-gradient-to-r from-gold-bright to-gold h-5 w-7 rounded-l shadow-md flex items-center justify-center font-display text-[9px] text-ink font-bold">
                      ✦
                    </div>
                    {/* Triangle cuts */}
                    <div className="absolute right-0 top-0 h-0 w-0 border-y-[10px] border-y-transparent border-r-[6px] border-r-[#2a1048]" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Add New Chapter Button styled like a red wax bar */}
      <button
        type="button"
        onClick={onNew}
        className="group relative w-full flex items-center justify-between rounded-xl border border-gold/40 bg-gradient-to-r from-[#6e161c] via-[#aa2f38] to-[#6e161c] px-4 py-3 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_0_8px_#ff9e87] text-left text-sm font-semibold transition hover:brightness-110 mb-4"
      >
        <span className="text-white text-shadow-sm font-display tracking-wide uppercase text-xs">
          ＋ Add New Chapter
        </span>
        <div className="relative shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-gold-bright to-gold-dim border border-gold shadow-[0_2px_4px_rgba(0,0,0,0.4)] text-[10px] text-royal font-bold group-hover:scale-105 transition-transform">
          👑
        </div>
      </button>

      {/* Bottom Actions */}
      <div className="mt-auto border-t border-gold/15 pt-3 flex flex-col gap-2">
        <button className="flex items-center gap-2 text-xs text-parchment/75 hover:text-gold-bright transition">
          <BookOpen className="h-4 w-4 text-gold-bright/80" />
          <span>Export as Book</span>
        </button>
        <button className="flex items-center gap-2 text-xs text-parchment/75 hover:text-gold-bright transition">
          <Share2 className="h-4 w-4 text-gold-bright/80" />
          <span>Share Legacy</span>
        </button>
        <button className="flex items-center gap-2 text-xs text-parchment/75 hover:text-gold-bright transition">
          <Settings className="h-4 w-4 text-gold-bright/80" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
