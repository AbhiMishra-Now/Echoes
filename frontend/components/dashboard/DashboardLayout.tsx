"use client";

import Link from "next/link";
import { Eye, Save, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useBiography } from "../../hooks/useBiography";
import { Sidebar } from "./Sidebar";
import { ChatInterface } from "./ChatInterface";
import { BiographyPreview } from "./BiographyPreview";
import { FullscreenEditor } from "./FullscreenEditor";
import { ToastContainer } from "../ui/ToastContainer";
import { ErrorBoundary } from "../ui/ErrorBoundary";
import { useBiographySync } from "../../hooks/useBiographySync";
import { useBiographyStore } from "../../store/biographyStore";
import { structureChapter } from "../../lib/api";
import type { Message } from "../../types/biography";

function Onboarding({ close }: { close: () => void }) {
  return (
    <div className="onboarding">
      <div className="onboarding-card parchment-texture">
        <button className="modal-close" onClick={close}>
          <X />
        </button>
        <p className="eyebrow">WELCOME TO ECHOES</p>
        <h2>Welcome, Legacy Builder</h2>
        <ol>
          <li>
            <b>Glide through your timeline</b> using your mouse wheel.
          </li>
          <li>
            <b>Inscribe notes anywhere</b> by double-clicking on the space.
          </li>
          <li>
            <b>Drag and drop photographs</b> directly onto your life stages.
          </li>
        </ol>
        <button className="magic-button" onClick={close}>
          Begin Your Journey
        </button>
        <button className="text-button" onClick={close}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

export function DashboardLayout() {
  const { chapters, currentChapterId, createChapter, addToast, markSaved } = useBiography();
  const { isInitialLoading } = useBiographySync();
  const store = useBiographyStore();
  const { messages, currentBiographyId, currentUser } = store;

  const [showWelcome, setShowWelcome] = useState(false);
  const [showNewChapterModal, setShowNewChapterModal] = useState(false);
  const [isFullscreenEditor, setIsFullscreenEditor] = useState(false);

  const current = chapters.find((c) => c.id === currentChapterId);

  useEffect(() => setShowWelcome(!localStorage.getItem("echoes_onboarding_complete")), []);

  const save = () => {
    localStorage.setItem("echoes-last-save", new Date().toISOString());
    markSaved();
    addToast({
      title: "Legacy Preserved",
      message: "Your story has been safely kept.",
      variant: "success",
      duration: 3000,
    });
  };

  useEffect(() => {
    const shortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  const newChapter = () => {
    setShowNewChapterModal(true);
  };

  return (
    <ErrorBoundary>
      <main className="dashboard-app flex flex-col h-screen bg-[#14051f] overflow-hidden">

        {/* Dynamic header styled exactly like the design mockup */}
        <header className="sticky top-0 z-30 border-b-2 border-gold/60 bg-gradient-to-r from-[#21002f] via-[#4b075d] to-[#21002f] px-6 py-3.5 flex items-center justify-between shadow-md shrink-0">
          <Link
            href="/"
            className="font-display text-2xl tracking-[0.1em] text-gold-bright hover:scale-105 transition uppercase font-semibold"
          >
            ECHOES
          </Link>
          <span className="font-display text-base tracking-[0.15em] text-gold-bright uppercase font-medium select-none hidden md:inline">
            {current?.title ?? "THE FIRST PAGES"}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFullscreenEditor(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gold/45 bg-white/5 px-3 py-1.5 text-xs text-gold-bright uppercase tracking-wider transition hover:bg-white/10"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview Mode
            </button>
            <button
              onClick={save}
              className="inline-flex items-center gap-2 rounded-lg border border-gold/45 bg-white/5 px-3 py-1.5 text-xs text-gold-bright uppercase tracking-wider transition hover:bg-white/10"
            >
              <Save className="h-3.5 w-3.5" />
              Save Progress
            </button>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/45 text-gold-bright hover:bg-white/10 transition"
              aria-label="Account"
            >
              <UserRound className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* 3-Column structured dashboard grid layout matching classic mockup */}
        <div className="dashboard-body flex-1 grid grid-cols-[280px_1fr_380px] h-full min-h-0 overflow-hidden relative">
          
          {/* LEFT SIDEBAR: Static leather panel */}
          <div className="h-full bg-[#2E0249] relative flex flex-col z-20 shrink-0 select-none border-r-2 border-gold/45 w-[280px] p-4">
            {/* Gold filigree corners */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-gold/40 rounded-tl pointer-events-none" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-gold/40 rounded-tr pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-gold/40 rounded-bl pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-[#d4a853]/40 border-b-2 border-r-2 rounded-br pointer-events-none" />
            
            <div className="flex-1 min-h-0">
              <Sidebar onNew={newChapter} />
            </div>
          </div>

          {/* CENTER PANEL: Skeuomorphic parchment chat scroll on dark wood table background */}
          <div className="flex-1 relative h-full flex flex-col min-h-0 overflow-hidden bg-[#160b06] bg-gradient-to-b from-[#1c0f0a] to-[#120704] p-5 shadow-inner">
            {/* Horizontal wood grain grid lines backdrop simulation */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.15)_1px,transparent_1px)] bg-[size:100%_40px] pointer-events-none opacity-45" />
            
            {/* Scroll Workspace (ChatInterface inside) */}
            <div className="flex-1 relative min-h-0 overflow-hidden flex flex-col">
              <ChatInterface />
            </div>
          </div>

          {/* RIGHT SIDEBAR: Deep Purple Velvet Scroll Preview (Always Open) */}
          <div className="h-full bg-[#190022] border-l-2 border-gold/45 z-20 w-[380px] p-4 flex flex-col shrink-0 relative">
            {/* Floating Stars */}
            <div className="absolute top-8 left-12 w-1 h-1 bg-[#ffd875] rounded-full animate-pulse opacity-60 shadow-[0_0_4px_#ffd875]" />
            <div className="absolute top-24 right-16 w-1 h-1 bg-[#ffd875] rounded-full animate-pulse opacity-85 shadow-[0_0_4px_#ffd875] delay-700" />
            <div className="absolute bottom-32 left-8 w-1 h-1 bg-[#ffd875] rounded-full animate-pulse opacity-40 shadow-[0_0_4px_#ffd875] delay-300" />
            <div className="absolute bottom-16 right-20 w-1.5 h-1.5 bg-[#ffd875] rounded-full animate-pulse opacity-90 shadow-[0_0_4px_#ffd875] delay-1000" />
            
            <div className="flex-1 min-h-0">
              <BiographyPreview onExpand={() => setIsFullscreenEditor(true)} />
            </div>
          </div>

        </div>



        {isInitialLoading && (
          <div className="dashboard-syncing" role="status">
            Opening your archive…
          </div>
        )}

        {showWelcome && (
          <Onboarding
            close={() => {
              localStorage.setItem("echoes_onboarding_complete", "yes");
              setShowWelcome(false);
            }}
          />
        )}

        {showNewChapterModal && (
          <div className="onboarding z-50">
            <div className="onboarding-card bg-parchment paper-texture border-2 border-gold/45 p-6 rounded-2xl relative max-w-sm w-full mx-4 shadow-2xl">
              <button type="button" className="modal-close text-ink/60 hover:text-ink absolute top-4 right-4" onClick={() => setShowNewChapterModal(false)}>
                <X className="h-5 w-5" />
              </button>
              <p className="eyebrow text-gold-dim text-xs tracking-widest font-semibold uppercase mb-1">New Record</p>
              <h2 className="font-display text-2xl text-ink font-bold mb-4">Begin a New Chapter</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const title = data.get("title") as string;
                const era = data.get("era") as string;
                createChapter({
                  id: crypto.randomUUID(),
                  title: title || `Chapter ${chapters.length + 1}`,
                  description: era ? `Memories from ${era}.` : "A fresh page in your story.",
                  timePeriod: era || "Untold",
                  order: chapters.length + 1,
                  createdAt: new Date(),
                  updatedAt: new Date()
                });
                addToast({ title: "New chapter begins", message: title || `Chapter ${chapters.length + 1}`, variant: "info", duration: 3000 });
                setShowNewChapterModal(false);
              }} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1">Chapter Title</label>
                  <input type="text" name="title" required placeholder="e.g. Origins & Childhood" className="w-full bg-[#1c0f2e]/5 border border-[#a87c2e]/30 rounded-lg px-3 py-2 text-ink font-serif text-lg outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-ink/60 mb-1">Time Period (Era)</label>
                  <input type="text" name="era" placeholder="e.g. 1965 - 1980" className="w-full bg-[#1c0f2e]/5 border border-[#a87c2e]/30 rounded-lg px-3 py-2 text-ink font-serif text-lg outline-none focus:border-gold" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="magic-button px-5 py-2.5 bg-gradient-to-r from-gold-bright to-gold text-ink font-semibold rounded-full hover:brightness-110 shadow-md">Inscribe Chapter</button>
                  <button type="button" onClick={() => setShowNewChapterModal(false)} className="text-button text-ink/65 hover:text-ink text-sm font-semibold">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
        <ToastContainer />
        <FullscreenEditor
          isOpen={isFullscreenEditor}
          onClose={() => setIsFullscreenEditor(false)}
          chapterId={currentChapterId}
        />
      </main>
    </ErrorBoundary>
  );
}
