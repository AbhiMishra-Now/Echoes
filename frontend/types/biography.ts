export interface User { id: string; name: string; email: string; avatar?: string; }
export interface Chapter { id: string; title: string; description: string; timePeriod?: string; coverImage?: string; order: number; createdAt: Date; updatedAt: Date; layout?: any[]; bookSpreads?: any[][]; messages?: Message[]; }
export interface MediaItem { id: string; type: "image" | "video" | "gif" | "audio" | "document"; url: string; thumbnailUrl?: string; filename: string; size: number; uploadedAt: Date; }
export interface Message { id: string; chapterId: string; sender: "user" | "ai"; content: string; originalText?: string; polishedCaption?: string; activeVariant?: "original" | "polished"; isUserModified?: boolean; media?: MediaItem[]; category?: string; timestamp: Date; isEdited: boolean; metadata?: { voiceNote?: boolean; transcription?: string; }; }
export interface Biography { id: string; userId: string; title: string; chapters: Chapter[]; createdAt: Date; updatedAt: Date; isPublic: boolean; }
export type ToastVariant = "success" | "error" | "info";
export interface Toast { id: string; title: string; message?: string; variant: ToastVariant; duration: number; }
