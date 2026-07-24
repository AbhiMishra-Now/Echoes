"use client";

import React, { useState } from "react";
import { BookOpen, Share2, Settings, Image, Sparkles, Trash2, Pencil, Home, PlusCircle } from "lucide-react";
import { useBiographyStore } from "../../store/biographyStore";
import { deleteChapter as deleteChapterApi, updateChapter } from "../../lib/api";

interface SidebarProps {
  onNew: () => void;
  onOpenExport?: () => void;
  isExpanded?: boolean;
  setIsExpanded?: (val: boolean) => void;
}

export function Sidebar({ onNew, onOpenExport, isExpanded = false, setIsExpanded }: SidebarProps) {
  const store = useBiographyStore();
  const { currentUser, chapters, currentChapterId, switchChapter, messages } = store;

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");

  const handleStartRename = (chapterId: string, currentTitle: string) => {
    setRenamingId(chapterId);
    setRenameInput(currentTitle);
  };

  const handleSaveRename = async (chapterId: string) => {
    if (!renameInput.trim()) return;
    try {
      if (store.currentBiographyId) {
        await updateChapter(store.currentBiographyId, chapterId, store.currentUser.id, {
          title: renameInput.trim()
        });
      }
      store.updateChapterTitle(chapterId, renameInput.trim());
      store.addToast({
        title: "Chapter Renamed",
        message: `✨ Legacy chapter has been updated to "${renameInput.trim()}".`,
        variant: "success",
        duration: 2000,
      });
    } catch (err) {
      console.error(err);
      store.addToast({
        title: "Rename Failed",
        message: "Failed to persist the new chapter title.",
        variant: "error",
        duration: 3000,
      });
    } finally {
      setRenamingId(null);
    }
  };

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

  // Helper Tooltip subcomponent using pure Tailwind/CSS delay hover
  const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
    <div className="relative group/tooltip flex items-center justify-center">
      {children}
      <div className="absolute left-14 bg-[#1b0227] border border-gold/45 text-gold-bright text-[11px] uppercase tracking-wider rounded-lg px-3 py-2 opacity-0 group-hover/tooltip:delay-500 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-50 font-sans">
        {text}
      </div>
    </div>
  );

  if (!isExpanded) {
    return (
      <aside className="dashboard-sidebar relative flex flex-col items-center h-full min-h-0 w-full text-parchment overflow-hidden py-4 gap-5 select-none">
        {/* Avatar Branding */}
        <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-royal-mid to-royal-deep border-2 border-gold font-display text-sm text-gold-bright shadow-lg">
          LB
        </div>

        <div className="w-full border-t border-gold/15" />

        {/* Navigation Group */}
        <div className="flex flex-col gap-5 items-center w-full">
          <Tooltip text="Your Journey">
            <button
              onClick={() => setIsExpanded?.(true)}
              className="relative p-2 rounded-lg text-gold-bright hover:scale-110 transition duration-150 codex-pointer"
            >
              <Home className="h-6 w-6 hover:drop-shadow-[0_0_8px_#d4af37]" />
              {/* Active Dot Indicator */}
              <span className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-2 h-2 bg-gradient-to-r from-gold-bright to-gold-dim rounded-full shadow-[0_0_6px_#ffe69a]" />
            </button>
          </Tooltip>

          <Tooltip text="Add New Chapter">
            <button
              onClick={onNew}
              className="p-2 rounded-lg text-gold-bright hover:scale-110 transition duration-150 codex-pointer"
            >
              <PlusCircle className="h-6 w-6 hover:drop-shadow-[0_0_8px_#d4af37]" />
            </button>
          </Tooltip>
        </div>

        <div className="w-full border-t border-gold/15" />

        {/* Actions Group */}
        <div className="flex flex-col gap-5 items-center w-full">
          <Tooltip text="Export as Book">
            <button
              onClick={onOpenExport}
              className="p-2 rounded-lg text-gold-bright hover:scale-110 transition duration-150 codex-pointer"
            >
              <BookOpen className="h-6 w-6 hover:drop-shadow-[0_0_8px_#d4af37]" />
            </button>
          </Tooltip>

          <Tooltip text="Share Legacy">
            <button
              onClick={onOpenExport}
              className="p-2 rounded-lg text-gold-bright hover:scale-110 transition duration-150 codex-pointer"
            >
              <Share2 className="h-6 w-6 hover:drop-shadow-[0_0_8px_#d4af37]" />
            </button>
          </Tooltip>
        </div>

        <div className="w-full border-t border-gold/15 mt-auto" />

        {/* Settings at the bottom */}
        <Tooltip text="Settings">
          <button className="p-2 rounded-lg text-gold-bright hover:scale-110 transition duration-150 codex-pointer mb-2">
            <Settings className="h-6 w-6 hover:drop-shadow-[0_0_8px_#d4af37]" />
          </button>
        </Tooltip>
      </aside>
    );
  }

  return (
    <aside className="dashboard-sidebar relative flex flex-col h-full min-h-0 min-w-10 text-parchment overflow-hidden">
      {/* Profile Card */}
      <div className="flex items-center gap-3 border-b border-gold/15 pb-4 mb-6">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-royal-mid to-royal-deep border-2 border-gold font-display text-base text-gold-bright shadow-lg">
          LB
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg text-parchment truncate font-semibold leading-tight">
            {currentUser.name}
          </p>
          <p className="font-display text-[10px] text-gold/70 tracking-widest uppercase mt-0.5">Legacy Builder</p>
        </div>
      </div>

      {/* Progress Box */}
      <div className="mb-6">
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
      <div className="grid grid-cols-2 gap-2 mb-8">
        <div className="bg-[#1b0227]/30 rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-gold/50 font-bold tracking-widest uppercase mb-1">
            Memories
          </p>
          <p className="font-display text-3xl text-gold-bright font-extrabold">
            {totalMemories}
          </p>
        </div>
        <div className="bg-[#1b0227]/30 rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-gold/50 font-bold tracking-widest uppercase mb-1">
            Chapters
          </p>
          <p className="font-display text-3xl text-gold-bright font-extrabold">
            {chapters.length}
          </p>
        </div>
      </div>

      {/* Your Journey Header */}
      <h3 className="font-display text-[11px] tracking-[0.2em] text-gold/70 uppercase font-semibold mb-4">
        Your Journey
      </h3>

      {/* Chapter Navigator Archive */}
      <nav className="archive-scrollbar flex-1 overflow-y-auto pr-1 flex flex-col gap-3 mb-6">
        {chapters.map((chapter, index) => {
          const isActive = chapter.id === currentChapterId;
          const isRenaming = chapter.id === renamingId;
          return (
            <div
              key={chapter.id}
              className={`relative flex items-center justify-between group/item w-full rounded-xl transition ${
                isActive
                  ? "bg-white/[0.04] border border-gold/45 shadow-md shadow-black/25"
                  : "hover:bg-white/[0.02] border border-transparent"
              }`}
            >
              {isRenaming ? (
                <div className="flex-1 px-3 py-2 flex items-center gap-2 z-30">
                  <input
                    type="text"
                    value={renameInput}
                    onChange={(e) => setRenameInput(e.target.value)}
                    onBlur={() => handleSaveRename(chapter.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveRename(chapter.id);
                      } else if (e.key === "Escape") {
                        setRenamingId(null);
                      }
                    }}
                    autoFocus
                    className="flex-1 bg-[#1b0227] border border-gold/45 text-parchment px-2 py-1 rounded text-sm outline-none focus:border-gold-bright"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => switchChapter(chapter.id)}
                  className="flex-1 text-left px-3 py-3 select-none min-w-0 pr-14"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-8">
                    <span className="font-display text-base text-gold-bright/80 font-bold shrink-0">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-medium text-[13px] text-parchment/90 truncate">
                      {chapter.title}
                    </span>
                  </div>
                </button>
              )}

              {/* Action Buttons: Rename / Delete */}
              {!isRenaming && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition duration-150 z-20">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(chapter.id, chapter.title);
                    }}
                    className="p-1 text-parchment/40 hover:text-gold-bright transition duration-150"
                    title="Rename Chapter"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {chapters.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChapter(chapter.id, chapter.title);
                      }}
                      className="p-1 text-parchment/40 hover:text-red-400 transition duration-150"
                      title="Delete Chapter"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Bookmark Ribbon on Active Chapter */}
              {isActive && !isRenaming && (
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
        className="group relative w-full flex items-center justify-between rounded-xl border border-gold/40 bg-gradient-to-r from-[#6e161c] via-[#aa2f38] to-[#6e161c] px-4 py-4 shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_0_8px_#ff9e87] text-left text-sm font-semibold transition hover:brightness-110 mb-6"
      >
        <span className="text-white text-shadow-sm font-display tracking-wide uppercase text-xs">
          ＋ Add New Chapter
        </span>
        <div className="relative shrink-0 flex items-center justify-center h-8 w-8 mr-1 rounded-full bg-gradient-to-br from-gold-bright to-gold-dim border border-gold shadow-[0_2px_4px_rgba(0,0,0,0.4)] text-[11px] text-royal font-bold group-hover:scale-105 transition-transform">
          👑
        </div>
      </button>

      {/* Bottom Actions */}
      <div className="mt-auto border-t border-gold/15 pt-4 flex flex-col gap-3.5">
        <button
          onClick={onOpenExport}
          className="flex items-center gap-2.5 text-[11px] text-parchment/65 hover:text-gold-bright transition tracking-wider uppercase"
        >
          <BookOpen className="h-3.5 w-3.5 text-gold-bright/70" />
          <span>Export as Book</span>
        </button>
        <button
          onClick={onOpenExport}
          className="flex items-center gap-2.5 text-[11px] text-parchment/65 hover:text-gold-bright transition tracking-wider uppercase"
        >
          <Share2 className="h-3.5 w-3.5 text-gold-bright/70" />
          <span>Share Legacy</span>
        </button>
        <button className="flex items-center gap-2.5 text-[11px] text-parchment/65 hover:text-gold-bright transition tracking-wider uppercase">
          <Settings className="h-3.5 w-3.5 text-gold-bright/70" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
