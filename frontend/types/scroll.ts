export interface NarrativeChapter { id: string; title: string; text: string; images?: { url: string; caption: string; position: number }[]; }
export interface MemoryItem { id: string; type: "image" | "video" | "audio"; url: string; chapterIndex: number; timestamp: number; }
export interface ScrollViewerProps { biographyId: string; chapters: NarrativeChapter[]; memories: MemoryItem[]; onMemoryClick?: (memory: MemoryItem) => void; mode?: "preview" | "fullscreen"; }
