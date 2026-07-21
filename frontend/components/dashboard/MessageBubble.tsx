"use client";

import { Feather, Pencil, MoreHorizontal, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Message } from "../../types/biography";
import { EditMode } from "./EditMode";
import { useBiographyStore } from "../../store/biographyStore";
import { deleteMessage as deleteMessageApi, structureChapter } from "../../lib/api";

export function MessageBubble({ message }: { message: Message }) {
  const store = useBiographyStore();
  const { editMode, setEditMode, updateMessage } = store;
  const ai = message.sender === "ai";
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    const ok = window.confirm("Delete this memory forever? This cannot be undone.");
    if (!ok) return;

    setIsDeleting(true);
    // Wait for the opacity fade out animation to finish (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      if (store.currentBiographyId) {
        await deleteMessageApi(
          store.currentBiographyId,
          message.chapterId,
          message.id,
          store.currentUser.id
        );
      }
      store.removeMessage(message.id);
      store.addToast({
        title: "Memory Deleted",
        message: "The memory has been removed from the archives.",
        variant: "info",
        duration: 3000,
      });

      // Re-structure narrative after deletion to update the 3D scroll
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
      store.addToast({
        title: "Delete Failed",
        message: "Failed to delete the memory. Please try again.",
        variant: "error",
        duration: 4000,
      });
    }
  };

  const images = message.media?.filter((media) => media.type === "image") ?? [];
  const otherMedia = message.media?.filter((media) => media.type !== "image") ?? [];

  return (
    <div className={`flex items-start gap-4 mb-8 ${ai ? "justify-start" : "justify-end"}`}>
      {/* AI Message Avatar / Feather icon badge as seen in the mockup */}
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
        {/* Washi Tape on User notes */}
        {!ai && !images.length && (
          <div className="absolute -top-3 left-6 h-5 w-16 bg-gradient-to-r from-gold-bright/35 to-gold/25 border border-gold/15 shadow-[0_1px_3px_rgba(0,0,0,0.1)] rotate-[-4deg] opacity-75" />
        )}

        {/* Menu Actions (Edit / Delete) for User message */}
        {!ai && (
          <div className="absolute top-2 right-2 z-30">
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
                      handleDelete();
                      setMenuOpen(false);
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

        {/* Edit Button for AI messages if editable, otherwise hidden */}
        {ai && (
          <button
            className="absolute top-2 right-2 p-1 rounded hover:bg-black/5 text-[#a67c2e]/60 hover:text-[#d4a853] transition opacity-0 group-hover/msg:opacity-100"
            onClick={() => setEditMode(message.id)}
            aria-label="Edit message"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}

        {/* Media / Polaroid */}
        {images.map((media) => (
          <figure
            className="bg-[#fffdf8] p-2.5 pb-6 shadow-md border border-[#e8d9bd] rounded-sm transform rotate-[1.5deg] mb-3"
            key={media.id}
          >
            <img
              src={media.url}
              alt={media.filename}
              className="w-full h-auto max-h-[300px] object-cover rounded-xs"
            />
            <figcaption className="mt-3 text-center font-script text-lg text-ink">
              {media.filename}
            </figcaption>
          </figure>
        ))}

        {/* Message Content */}
        {message.content && (
          <p className={ai ? "text-ink font-serif italic" : "text-parchment leading-relaxed text-sm sm:text-base"}>
            {message.content}
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
    </div>
  );
}
