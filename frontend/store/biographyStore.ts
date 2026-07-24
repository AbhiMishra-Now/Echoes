"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Chapter, MediaItem, Message, Toast, User } from "../types/biography";

const now = new Date();
const opening: Chapter = { id: "chapter-1", title: "The First Pages", description: "Beginnings, family, and the memories that made you.", timePeriod: "The beginning", order: 1, createdAt: now, updatedAt: now };
const mediaOnlyMessage = (chapterId: string, media: MediaItem): Message => ({ id: crypto.randomUUID(), chapterId, sender: "user", content: "", media: [media], timestamp: new Date(), isEdited: false });

export type NarrativeData = { chapterTitle: string; narrativeText: string; keyThemes: string[]; suggestedMediaTags: string[]; chapterId: string };
type State = {
  currentUser: User; currentBiographyId: string | null; chapters: Chapter[]; currentChapterId: string; messages: Message[]; narrativeByChapter: Record<string, NarrativeData>; mediaUploadProgress: number; isLoading: boolean; isTyping: boolean; isRecording: boolean; previewMode: "scroll" | "timeline"; editMode: string | null; toasts: Toast[]; lastSaved: Date | null; unsavedChanges: boolean; currentSpread: any[]; isLivingScrollOpen: boolean;
  addMessage: (message: Message) => void; addStreamingToken: (token: string) => void; completeAiMessage: (content: string) => void; updateMessage: (id: string, content: string) => void; updateMessageMetadata: (id: string, metadata: any) => void; setChapters: (chapters: Chapter[]) => void; setBiographyId: (id: string) => void; createChapter: (chapter: Chapter) => void; switchChapter: (id: string) => void; setLoading: (value: boolean) => void; setTyping: (value: boolean) => void; setPreviewMode: (value: "scroll" | "timeline") => void; setEditMode: (value: string | null) => void; setRecording: (value: boolean) => void; setMediaUploadProgress: (percent: number) => void; attachMedia: (media: MediaItem) => void; updatePreviewNarrative: (narrative: NarrativeData) => void; syncToBackend: () => Promise<void>; addToast: (toast: Omit<Toast, "id">) => void; dismissToast: (id: string) => void; markSaved: () => void;
  removeChapter: (chapterId: string) => void; removeMessage: (messageId: string) => void; updateChapterLayout: (chapterId: string, layout: any[]) => void;
  toggleTextVariant: (messageId: string) => void; setMessageDraft: (messageId: string, polishedCaption: string) => void;
  saveSpread: (chapterId: string, spread: any[]) => void; updateChapterTitle: (chapterId: string, title: string) => void;
  setIsLivingScrollOpen: (value: boolean) => void;
};

export const useBiographyStore = create<State>()(persist((set) => ({
  currentUser: { id: "local-legacy-builder", name: "Legacy Builder", email: "you@echoes.app" }, currentBiographyId: null, chapters: [opening], currentChapterId: opening.id, messages: [], narrativeByChapter: {}, mediaUploadProgress: 0, isLoading: false, isTyping: false, isRecording: false, previewMode: "scroll", editMode: null, toasts: [], lastSaved: null, unsavedChanges: false, currentSpread: [], isLivingScrollOpen: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, { activeVariant: "polished", originalText: message.originalText || message.content, ...message }], unsavedChanges: true })),
  addStreamingToken: (token) => set((state) => { const index = state.messages.map((message) => message.sender).lastIndexOf("ai"); if (index < 0) return state; const messages = [...state.messages]; messages[index] = { ...messages[index], content: messages[index].content + token }; return { messages }; }),
  completeAiMessage: (content) => set((state) => { const index = state.messages.map((message) => message.sender).lastIndexOf("ai"); if (index < 0) return state; const messages = [...state.messages]; messages[index] = { ...messages[index], content }; return { messages, isLoading: false, isTyping: false }; }),
  updateMessage: (id, content) => set((state) => ({ messages: state.messages.map((message) => message.id === id ? { ...message, content, originalText: content, isEdited: true } : message), unsavedChanges: true })),
  updateMessageMetadata: (id, metadata) => set((state) => ({ messages: state.messages.map((m) => m.id === id ? { ...m, metadata: { ...(m.metadata ?? {}), ...metadata } } : m), unsavedChanges: true })),
  setChapters: (chapters) => set((state) => {
    const firstChapter = chapters[0];
    const allMessages = chapters.flatMap((c) => c.messages || []).map((m: any) => ({
      id: m.id || crypto.randomUUID(),
      chapterId: m.chapterId || firstChapter?.id || opening.id,
      sender: m.role === "assistant" ? "ai" : (m.sender || "user"),
      content: m.content || "",
      originalText: m.originalText || m.content || "",
      polishedCaption: m.polishedCaption || m.content || "",
      activeVariant: m.activeVariant || "polished",
      timestamp: new Date(m.timestamp || m.created_at || new Date()),
      isEdited: m.isEdited || false,
      media: m.media || []
    }));
    return {
      chapters,
      currentChapterId: firstChapter?.id ?? opening.id,
      messages: allMessages,
      currentSpread: firstChapter?.layout ?? (firstChapter?.bookSpreads?.[firstChapter.bookSpreads.length - 1] ?? [])
    };
  }), setBiographyId: (currentBiographyId) => set({ currentBiographyId }), createChapter: (chapter) => set((state) => ({ chapters: [...state.chapters, chapter], currentChapterId: chapter.id, currentSpread: chapter.layout ?? [], unsavedChanges: true })), switchChapter: (currentChapterId) => set((state) => { const chapter = state.chapters.find((c) => c.id === currentChapterId); return { currentChapterId, currentSpread: chapter?.layout ?? (chapter?.bookSpreads?.[chapter.bookSpreads.length - 1] ?? []) }; }), setLoading: (isLoading) => set({ isLoading }), setTyping: (isTyping) => set({ isTyping }), setPreviewMode: (previewMode) => set({ previewMode }), setEditMode: (editMode) => set({ editMode }), setRecording: (isRecording) => set({ isRecording }), setMediaUploadProgress: (mediaUploadProgress) => set({ mediaUploadProgress }), setIsLivingScrollOpen: (isLivingScrollOpen) => set({ isLivingScrollOpen }),
  attachMedia: (media) => set((state) => { const index = state.messages.map((message) => message.sender).lastIndexOf("user"); if (index < 0 || state.messages[index]?.chapterId !== state.currentChapterId) return { messages: [...state.messages, mediaOnlyMessage(state.currentChapterId, media)], unsavedChanges: true }; const messages = [...state.messages]; messages[index] = { ...messages[index], media: [...(messages[index].media ?? []), media] }; return { messages, unsavedChanges: true }; }),
  updatePreviewNarrative: (narrative) => set((state) => ({ narrativeByChapter: { ...state.narrativeByChapter, [narrative.chapterId]: narrative } })), syncToBackend: async () => { set({ lastSaved: new Date(), unsavedChanges: false }); }, addToast: (toast) => set((state) => ({ toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }] })), dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })), markSaved: () => set({ lastSaved: new Date(), unsavedChanges: false }),
  removeChapter: (chapterId) => set((state) => {
    const chapters = state.chapters.filter((c) => c.id !== chapterId);
    const nextChapterId = state.currentChapterId === chapterId ? (chapters[0]?.id ?? opening.id) : state.currentChapterId;
    const nextChapter = chapters.find((c) => c.id === nextChapterId);
    return {
      chapters,
      currentChapterId: nextChapterId,
      currentSpread: nextChapter?.layout ?? (nextChapter?.bookSpreads?.[nextChapter.bookSpreads.length - 1] ?? []),
      messages: state.messages.filter((m) => m.chapterId !== chapterId),
      unsavedChanges: true
    };
  }),
  removeMessage: (messageId) => set((state) => ({
    messages: state.messages.filter((m) => m.id !== messageId),
    unsavedChanges: true
  })),
  updateChapterLayout: (chapterId, layout) => set((state) => ({
    chapters: state.chapters.map((c) => c.id === chapterId ? { ...c, layout } : c),
    currentSpread: state.currentChapterId === chapterId ? layout : state.currentSpread,
    unsavedChanges: true
  })),
  toggleTextVariant: (messageId) => set((state) => ({
    messages: state.messages.map((m) => m.id === messageId ? { ...m, activeVariant: m.activeVariant === "original" ? "polished" : "original" } : m),
    unsavedChanges: true
  })),
  setMessageDraft: (messageId, polishedCaption) => set((state) => ({
    messages: state.messages.map((m) => m.id === messageId ? { ...m, polishedCaption, activeVariant: m.activeVariant || "polished" } : m),
    unsavedChanges: true
  })),
  saveSpread: (chapterId, spread) => set((state) => ({
    chapters: state.chapters.map((c) => c.id === chapterId ? { ...c, bookSpreads: [...(c.bookSpreads || []), spread] } : c),
    currentSpread: state.currentChapterId === chapterId ? spread : state.currentSpread,
    unsavedChanges: true
  })),
  updateChapterTitle: (chapterId, title) => set((state) => ({
    chapters: state.chapters.map((c) => c.id === chapterId ? { ...c, title } : c),
    unsavedChanges: true
  })),
}), { name: "echoes-biography-v1" }));

export const useUiStore = create<{
  isLivingScrollOpen: boolean;
  setIsLivingScrollOpen: (val: boolean) => void;
}>((set) => ({
  isLivingScrollOpen: false,
  setIsLivingScrollOpen: (isLivingScrollOpen) => set({ isLivingScrollOpen }),
}));
