"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Chapter, MediaItem, Message, Toast, User } from "../types/biography";

const now = new Date();
const opening: Chapter = { id: "chapter-1", title: "The First Pages", description: "Beginnings, family, and the memories that made you.", timePeriod: "The beginning", order: 1, createdAt: now, updatedAt: now };
const mediaOnlyMessage = (chapterId: string, media: MediaItem): Message => ({ id: crypto.randomUUID(), chapterId, sender: "user", content: "", media: [media], timestamp: new Date(), isEdited: false });

export type NarrativeData = { chapterTitle: string; narrativeText: string; keyThemes: string[]; suggestedMediaTags: string[]; chapterId: string };
type State = {
  currentUser: User; currentBiographyId: string | null; chapters: Chapter[]; currentChapterId: string; messages: Message[]; narrativeByChapter: Record<string, NarrativeData>; mediaUploadProgress: number; isLoading: boolean; isTyping: boolean; isRecording: boolean; previewMode: "scroll" | "timeline"; editMode: string | null; toasts: Toast[]; lastSaved: Date | null; unsavedChanges: boolean;
  addMessage: (message: Message) => void; addStreamingToken: (token: string) => void; completeAiMessage: (content: string) => void; updateMessage: (id: string, content: string) => void; updateMessageMetadata: (id: string, metadata: any) => void; setChapters: (chapters: Chapter[]) => void; setBiographyId: (id: string) => void; createChapter: (chapter: Chapter) => void; switchChapter: (id: string) => void; setLoading: (value: boolean) => void; setTyping: (value: boolean) => void; setPreviewMode: (value: "scroll" | "timeline") => void; setEditMode: (value: string | null) => void; setRecording: (value: boolean) => void; setMediaUploadProgress: (percent: number) => void; attachMedia: (media: MediaItem) => void; updatePreviewNarrative: (narrative: NarrativeData) => void; syncToBackend: () => Promise<void>; addToast: (toast: Omit<Toast, "id">) => void; dismissToast: (id: string) => void; markSaved: () => void;
  removeChapter: (chapterId: string) => void; removeMessage: (messageId: string) => void; updateChapterLayout: (chapterId: string, layout: any[]) => void;
};

export const useBiographyStore = create<State>()(persist((set) => ({
  currentUser: { id: "local-legacy-builder", name: "Legacy Builder", email: "you@echoes.app" }, currentBiographyId: null, chapters: [opening], currentChapterId: opening.id, messages: [], narrativeByChapter: {}, mediaUploadProgress: 0, isLoading: false, isTyping: false, isRecording: false, previewMode: "scroll", editMode: null, toasts: [], lastSaved: null, unsavedChanges: false,
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message], unsavedChanges: true })),
  addStreamingToken: (token) => set((state) => { const index = state.messages.map((message) => message.sender).lastIndexOf("ai"); if (index < 0) return state; const messages = [...state.messages]; messages[index] = { ...messages[index], content: messages[index].content + token }; return { messages }; }),
  completeAiMessage: (content) => set((state) => { const index = state.messages.map((message) => message.sender).lastIndexOf("ai"); if (index < 0) return state; const messages = [...state.messages]; messages[index] = { ...messages[index], content }; return { messages, isLoading: false, isTyping: false }; }),
  updateMessage: (id, content) => set((state) => ({ messages: state.messages.map((message) => message.id === id ? { ...message, content, isEdited: true } : message), unsavedChanges: true })),
  updateMessageMetadata: (id, metadata) => set((state) => ({ messages: state.messages.map((m) => m.id === id ? { ...m, metadata: { ...(m.metadata ?? {}), ...metadata } } : m), unsavedChanges: true })),
  setChapters: (chapters) => set({ chapters, currentChapterId: chapters[0]?.id ?? opening.id }), setBiographyId: (currentBiographyId) => set({ currentBiographyId }), createChapter: (chapter) => set((state) => ({ chapters: [...state.chapters, chapter], currentChapterId: chapter.id, unsavedChanges: true })), switchChapter: (currentChapterId) => set({ currentChapterId }), setLoading: (isLoading) => set({ isLoading }), setTyping: (isTyping) => set({ isTyping }), setPreviewMode: (previewMode) => set({ previewMode }), setEditMode: (editMode) => set({ editMode }), setRecording: (isRecording) => set({ isRecording }), setMediaUploadProgress: (mediaUploadProgress) => set({ mediaUploadProgress }),
  attachMedia: (media) => set((state) => { const index = state.messages.map((message) => message.sender).lastIndexOf("user"); if (index < 0 || state.messages[index]?.chapterId !== state.currentChapterId) return { messages: [...state.messages, mediaOnlyMessage(state.currentChapterId, media)], unsavedChanges: true }; const messages = [...state.messages]; messages[index] = { ...messages[index], media: [...(messages[index].media ?? []), media] }; return { messages, unsavedChanges: true }; }),
  updatePreviewNarrative: (narrative) => set((state) => ({ narrativeByChapter: { ...state.narrativeByChapter, [narrative.chapterId]: narrative } })), syncToBackend: async () => { set({ lastSaved: new Date(), unsavedChanges: false }); }, addToast: (toast) => set((state) => ({ toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }] })), dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })), markSaved: () => set({ lastSaved: new Date(), unsavedChanges: false }),
  removeChapter: (chapterId) => set((state) => {
    const chapters = state.chapters.filter((c) => c.id !== chapterId);
    const nextChapterId = state.currentChapterId === chapterId ? (chapters[0]?.id ?? opening.id) : state.currentChapterId;
    return {
      chapters,
      currentChapterId: nextChapterId,
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
    unsavedChanges: true
  })),
}), { name: "echoes-biography-v1" }));
