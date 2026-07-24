"use client";

import React, { useState } from "react";
import { X, Download, Share2, Check, BookOpen, Sparkles } from "lucide-react";
import { useBiographyStore } from "../../store/biographyStore";
import { exportBook } from "../../lib/api";

interface ExportBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportBookModal({ isOpen, onClose }: ExportBookModalProps) {
  const store = useBiographyStore();
  const { chapters, currentChapterId, addToast, currentSpread } = store;
  const currentChapter = chapters.find((c) => c.id === currentChapterId);
  const activeMessages = store.messages.filter((m) => m.chapterId === currentChapterId);

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPDF = async () => {
    const spread = currentChapter?.layout || currentSpread || [];
    const activeLayout = spread.filter((el: any) => el.type === "text" || el.type === "image");
    
    // 1. Map memories from layout spread (direct preview mode elements)
    const memoriesFromLayout = activeLayout.map((el: any) => {
      const msg = activeMessages.find((m) => m.id === el.id || m.id === el.memoryId || m.id === el.memory_id);
      return {
        id: el.id,
        imageUrl: el.type === "image" ? el.url : undefined,
        originalText: msg ? (msg.originalText || msg.content) : (el.content || ""),
        polishedCaption: msg ? (msg.polishedCaption || msg.content) : (el.content || ""),
        activeVariant: msg ? (msg.activeVariant || "original") : (el.textVariant || "polished")
      };
    });

    // 2. Map memories from chat history that have not been placed on the layout spread
    const memoriesFromChat = activeMessages
      .filter((m) => {
        const alreadyInLayout = memoriesFromLayout.some((lm) => lm.id === m.id);
        if (alreadyInLayout) return false;
        return m.content || m.media?.some((med) => med.type === "image");
      })
      .map((m) => {
        const imageUrl = m.media?.find((med) => med.type === "image")?.url;
        return {
          id: m.id,
          imageUrl,
          originalText: m.originalText || m.content || "",
          polishedCaption: m.polishedCaption || m.content || "",
          activeVariant: m.activeVariant || "original"
        };
      });

    // Combined output list
    const activeMemories = [...memoriesFromLayout, ...memoriesFromChat];

    if (activeMemories.length === 0) {
      addToast({
        title: "Export Blocked",
        message: "Add some memories to your scrapbook spread before exporting.",
        variant: "error",
        duration: 3500,
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const { generateLegacyBookPDF } = await import("../../lib/pdfGenerator");
      await generateLegacyBookPDF({
        memories: activeMemories,
        chapterTitle: currentChapter?.title || "My Memoir",
        userName: "Legacy Builder",
        onProgress: setExportProgress
      });
      
      addToast({
        title: "✨ Legacy Book Downloaded",
        message: "Your heirloom legacy book PDF has been compiled successfully.",
        variant: "success",
        duration: 3000,
      });
    } catch (err: any) {
      console.error("PDF Export failed", err);
      addToast({
        title: "Export Failed",
        message: err.message || "Failed to generate legacy book. Please try again.",
        variant: "error",
        duration: 4000,
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/dashboard/preview`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    addToast({
      title: "Link Copied",
      message: "Digital read-only link copied to clipboard.",
      variant: "success",
      duration: 2500,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1b0227] border-2 border-gold/45 p-6 rounded-3xl max-w-lg w-full shadow-2xl relative text-parchment paper-texture overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-parchment/60 hover:text-parchment transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-2 pb-6 border-b border-gold/15 mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gold-bright to-gold-dim text-[#1b0227] mb-3 shadow-md">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="font-display text-2xl text-gold-bright font-bold uppercase tracking-wider">
            Export Legacy Book
          </h2>
          <p className="font-serif italic text-sm text-parchment/75 mt-1">
            Publish your life journey into an heirloom book or share with loved ones.
          </p>
        </div>

        {/* Export Options Grid */}
        <div className="space-y-4 mb-6">
          {/* Download PDF Option */}
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="w-full text-left p-4 rounded-2xl border border-gold/30 bg-white/[0.03] hover:bg-white/[0.07] hover:border-gold-bright transition duration-200 group flex items-start gap-4 shadow-md"
          >
            <div className="p-3 rounded-xl bg-gold/10 text-gold-bright border border-gold/20 group-hover:scale-105 transition">
              <Download className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base text-gold-bright font-bold uppercase tracking-wide">
                  Download Heirloom PDF
                </h3>
                <span className="text-[10px] bg-gold/20 text-gold-bright px-2 py-0.5 rounded-full uppercase tracking-wider font-sans font-semibold">
                  A4 Landscape 300DPI
                </span>
              </div>
              <p className="text-xs text-parchment/70 font-sans mt-1 leading-relaxed">
                Renders all saved spreads into a high-resolution printable document formatted with embedded Cinzel, Cormorant Garamond, and Caveat typography.
              </p>
            </div>
          </button>

          {/* Share Digital Link Option */}
          <button
            onClick={handleCopyShareLink}
            className="w-full text-left p-4 rounded-2xl border border-gold/30 bg-white/[0.03] hover:bg-white/[0.07] hover:border-gold-bright transition duration-200 group flex items-start gap-4 shadow-md"
          >
            <div className="p-3 rounded-xl bg-gold/10 text-gold-bright border border-gold/20 group-hover:scale-105 transition">
              {copied ? <Check className="h-6 w-6 text-green-400" /> : <Share2 className="h-6 w-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-base text-gold-bright font-bold uppercase tracking-wide">
                  Share Digital Link
                </h3>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-sans font-semibold">
                  Interactive Web Link
                </span>
              </div>
              <p className="text-xs text-parchment/70 font-sans mt-1 leading-relaxed">
                Generate a unique read-only link to share your unrolled living scroll and scrapbook spreads with family and friends.
              </p>
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-2 border-t border-gold/15 flex items-center justify-center gap-1.5 text-xs text-gold/60 font-sans">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Curated by your Royal AI Biographer</span>
        </div>
      </div>

      {/* Progress overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[250000] print-hide">
          <div className="bg-[#1b0227] border border-gold/45 p-8 rounded-3xl max-w-md w-full mx-4 text-center relative shadow-2xl">
            <h3 className="font-display text-xl mb-4 text-gold-bright font-bold uppercase tracking-wider">
              Compiling Legacy Book
            </h3>
            <div className="w-full bg-white/10 rounded-full h-2.5 mb-4 overflow-hidden border border-gold/20">
              <div 
                className="bg-gradient-to-r from-gold-dim to-gold-bright h-full rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <p className="text-sm text-parchment/80 font-sans leading-relaxed">
              Assembling your spreads into an A4 landscape PDF... {exportProgress}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
