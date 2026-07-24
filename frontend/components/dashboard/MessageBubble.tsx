"use client";

import { Feather, Pencil, MoreHorizontal, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { Message } from "../../types/biography";
import { EditMode } from "./EditMode";
import { useBiographyStore } from "../../store/biographyStore";
import { deleteMemoryApi, generateDraft, structureChapter } from "../../lib/api";
import { DeleteConfirmationModal } from "../ui/DeleteConfirmationModal";

export function MessageBubble({ message }: { message: Message }) {
  const store = useBiographyStore();
  const { editMode, setEditMode, updateMessage, toggleTextVariant, setMessageDraft } = store;
  const ai = message.sender === "ai";
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [failedMediaIds, setFailedMediaIds] = useState<Record<string, boolean>>({});

  // Auto-generate AI polished draft caption for raw user input if not present yet
  useEffect(() => {
    if (!ai && message.content && !message.polishedCaption && !isDrafting) {
      setIsDrafting(true);
      const imgMedia = message.media?.find((m) => m.type === "image");
      generateDraft(message.content, imgMedia?.filename)
        .then((res) => {
          setMessageDraft(message.id, res.polished_caption);
        })
        .catch((err) => {
          console.error("Draft generation error", err);
        })
        .finally(() => setIsDrafting(false));
    }
  }, [ai, message.content, message.polishedCaption, message.id, message.media, isDrafting, setMessageDraft]);

  if (editMode === message.id) {
    return (
      <EditMode
        text={message.content}
        onSave={(text) => {
          updateMessage(message.id, text);
          setEditMode(null);
        }}
        onCancel={() => setEditMode(null)}
      />
    );
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      await deleteMemoryApi(message.id, store.currentUser.id);
      store.removeMessage(message.id);

      // Remove from active chapter layout
      const currentChapter = store.chapters.find((c) => c.id === message.chapterId);
      if (currentChapter?.layout && Array.isArray(currentChapter.layout)) {
        const updatedLayout = currentChapter.layout.filter(
          (el: any) => el.id !== message.id && el.memoryId !== message.id
        );
        store.updateChapterLayout(message.chapterId, updatedLayout);
      }

      setShowDeleteModal(false);
      store.addToast({
        title: "Memory Deleted",
        message: "The memory has been safely removed from your archives.",
        variant: "info",
        duration: 2500,
      });

      try {
        if (store.currentBiographyId) {
          const narrative = await structureChapter(
            store.currentBiographyId,
            message.chapterId,
            store.currentUser.id
          );
          store.updatePreviewNarrative({
            chapterId: message.chapterId,
            chapterTitle: narrative.chapter_title,
            narrativeText: narrative.narrative_text,
            keyThemes: narrative.key_themes,
            suggestedMediaTags: narrative.suggested_media_tags
          });
        }
      } catch (err) {
        console.error("Failed to re-structure chapter narrative", err);
      }
    } catch (err) {
      console.error(err);
      setIsDeleting(false);
      setShowDeleteModal(false);
      store.addToast({
        title: "Delete Failed",
        message: "⚠️ Could not remove memory. Try again.",
        variant: "error",
        duration: 4000,
      });
    }
  };

  const images = message.media?.filter((media) => media.type === "image") ?? [];
  const otherMedia = message.media?.filter((media) => media.type !== "image") ?? [];

  const activeVariant = message.activeVariant || "polished";
  const displayText = activeVariant === "original" ? (message.originalText || message.content) : (message.polishedCaption || message.content);

  return (
    <div className={`flex items-start gap-4 mb-8 ${ai ? "justify-start" : "justify-end"}`}>
      {ai && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-bright to-gold-dim border border-gold shadow-md text-ink">
          <Feather className="h-4.5 w-4.5" />
        </div>
      )}

      <article
        className={`relative max-w-[85%] sm:max-w-[75%] group/msg transition-all duration-500 ${
          isDeleting ? "opacity-0 scale-95" : "opacity-100"
        } ${
          ai
            ? "bg-transparent text-ink font-serif italic text-xl sm:text-2xl leading-relaxed py-2 pl-1 pr-6"
            : "bg-[#251508]/90 text-parchment rounded-2xl border border-gold/20 px-5 py-3.5 shadow-md font-sans"
        } ${images.length ? "bg-white p-3 shadow-lg rounded-xl border border-gold/15" : ""}`}
      >
        {!ai && !images.length && (
          <div className="absolute -top-3 left-6 h-5 w-16 bg-gradient-to-r from-gold-bright/35 to-gold/25 border border-gold/15 shadow-[0_1px_3px_rgba(0,0,0,0.1)] rotate-[-4deg] opacity-75" />
        )}

        {!ai && (
          <div className="absolute top-2 right-2 z-30 flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded hover:bg-white/10 text-gold-bright/60 hover:text-gold-bright opacity-0 group-hover/msg:opacity-100 transition-opacity"
              aria-label="Memory actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-32 rounded-lg bg-[#2e143c] border border-gold/30 shadow-xl py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => {
                      setEditMode(message.id);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-parchment hover:bg-white/5 flex items-center gap-1.5"
                  >
                    <Pencil className="h-3 w-3 text-gold-bright" />
                    Edit Memory
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-white/5 flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Memory
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {ai && (
          <button
            className="absolute top-2 right-2 p-1 rounded hover:bg-black/5 text-[#a67c2e]/60 hover:text-[#d4a853] transition opacity-0 group-hover/msg:opacity-100"
            onClick={() => setEditMode(message.id)}
            aria-label="Edit message"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}

        {/* Polaroid images with tape effect */}
        {images.map((media) => (
          <figure
            className="bg-[#fffdf8] p-3 pb-6 shadow-xl border border-[#e8d9bd] rounded-sm transform rotate-[1.5deg] mb-3 relative"
            key={media.id}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 h-5 w-16 bg-[#eae2d3]/70 border-x border-black/5 rotate-[-2deg] shadow-sm pointer-events-none" />
            {failedMediaIds[media.id] ? (
              <div className="w-full h-48 bg-amber-50/50 flex items-center justify-center border-2 border-dashed border-gold/30 rounded select-none pointer-events-none">
                <span className="text-gold/60 text-xs italic">Photo Keepsake</span>
              </div>
            ) : (
              <img
                src={media.url}
                alt={media.filename}
                className="w-full h-auto max-h-[300px] object-cover rounded-xs"
                onError={() => {
                  setFailedMediaIds((prev) => ({ ...prev, [media.id]: true }));
                  console.error("Failed to load chat image:", media.url);
                }}
              />
            )}
            <figcaption className="mt-3 text-center font-serif italic text-base text-ink">
              {media.filename}
            </figcaption>
          </figure>
        ))}

        {/* User Memory Text Variant Toggle Switch */}
        {!ai && message.content && (
          <div className="mb-2.5 flex items-center justify-between border-b border-gold/15 pb-2">
            <span className="text-[10px] text-gold/60 uppercase tracking-widest font-sans font-bold">
              Memory Inscription
            </span>
            <div className="inline-flex rounded-full bg-black/40 border border-gold/20 p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => toggleTextVariant(message.id)}
                className={`px-2 py-0.5 rounded-full transition ${
                  activeVariant === "original"
                    ? "bg-gold text-ink font-bold shadow-sm"
                    : "text-parchment/60 hover:text-parchment"
                }`}
              >
                Original Voice
              </button>
              <button
                type="button"
                onClick={() => toggleTextVariant(message.id)}
                className={`px-2 py-0.5 rounded-full transition ${
                  activeVariant === "polished"
                    ? "bg-gold text-ink font-bold shadow-sm"
                    : "text-parchment/60 hover:text-parchment"
                }`}
              >
                Biographer's Polish
              </button>
            </div>
          </div>
        )}

        {/* Message Content with Font Styling based on Variant */}
        {message.content && (
          <p
            className={
              ai
                ? "text-ink font-garamond font-serif italic text-xl sm:text-2xl"
                : activeVariant === "original"
                ? "text-[#fffdf9] font-caveat font-sans text-xl leading-relaxed"
                : "text-gold-bright font-garamond font-serif italic text-lg leading-relaxed font-medium"
            }
          >
            {displayText}
          </p>
        )}

        {otherMedia.map((media) => (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/20 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-wider text-gold-bright mt-2"
            key={media.id}
          >
            ✦ {media.filename}
          </span>
        ))}

        <time className={`block mt-2 text-[10px] uppercase tracking-wider ${ai ? "text-[#8a6420]/80" : "text-parchment/40"}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
          {message.isEdited ? " · edited" : ""}
        </time>
      </article>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
}
