"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Trash2, Type, Image as ImageIcon, Sparkles, Save, ChevronLeft, ChevronRight, Pencil, BookOpen } from "lucide-react";
import { useBiographyStore, useUiStore } from "../../store/biographyStore";
import { useMediaUpload } from "../../hooks/useMediaUpload";
import { deleteMemoryApi, generateLayout, updateChapter } from "../../lib/api";
import { DeleteConfirmationModal } from "../ui/DeleteConfirmationModal";
import { ExportBookModal } from "./ExportBookModal";
import { LivingScrollOverlay } from "./LivingScrollOverlay";

interface LayoutElement {
  id: string;
  type: "text" | "image" | "sticker";
  content?: string;
  url?: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
  isUserModified?: boolean;
  textVariant?: "original" | "polished";
}

interface FullscreenEditorProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
}

const MAGICAL_STICKERS = [
  { id: "seal", emoji: "👑", name: "Royal Wax Seal" },
  { id: "quill", emoji: "✒️", name: "Golden Quill" },
  { id: "star", emoji: "✦", name: "Magical Star" },
  { id: "moon", emoji: "🌙", name: "Crescent Moon" },
  { id: "scroll_border", emoji: "📜", name: "Scroll Bracket" },
];

const THEME_COLORS = [
  { name: "Parchment", color: "#FDFBF7" },
  { name: "Sage Green", color: "#F4F6F0" },
  { name: "Soft Blue", color: "#F0F3F7" },
  { name: "Vintage Rose", color: "#F7F3F4" },
  { name: "Antique Gold", color: "#FAF6ED" },
];

export function FullscreenEditor({ isOpen, onClose, chapterId }: FullscreenEditorProps) {
  const store = useBiographyStore();
  const { currentBiographyId, currentUser, messages, chapters, addToast, currentSpread } = store;
  const isLivingScrollOpen = useUiStore((state) => state.isLivingScrollOpen);
  const setIsLivingScrollOpen = useUiStore((state) => state.setIsLivingScrollOpen);
  const currentChapter = chapters.find((c) => c.id === chapterId);

  const [elements, setElements] = useState<LayoutElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showStickers, setShowStickers] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(currentChapter?.title || "");
  const [isMobile, setIsMobile] = useState(false);
  const [selectedBgColor, setSelectedBgColor] = useState("#FDFBF7");
  const [showExport, setShowExport] = useState(false);
  const seedRef = useRef(0);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useMediaUpload(chapterId);

  useEffect(() => {
    if (currentChapter?.title) setTitleInput(currentChapter.title);
  }, [currentChapter?.title]);

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (titleInput.trim() && currentChapter) {
      store.updateChapterTitle(chapterId, titleInput.trim());
      addToast({
        title: "Title Inscribed",
        message: `Chapter title saved as "${titleInput.trim()}".`,
        variant: "success",
        duration: 2000,
      });
    }
  };

  // Debounced auto-save every 5 seconds
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const saveLayout = useCallback(async (currentElements: LayoutElement[], silent = false, customBgColor?: string) => {
    if (!currentBiographyId || !currentChapter) return;
    try {
      const bgColorToSave = customBgColor ?? selectedBgColor;
      const payloadLayout = [
        ...currentElements.filter((el) => el.id !== "layout-metadata"),
        { id: "layout-metadata", type: "metadata", backgroundColor: bgColorToSave } as any
      ];

      // Save locally in store chapter
      store.updateChapterLayout(chapterId, payloadLayout);
      store.saveSpread(chapterId, payloadLayout);
      // Save in S3/DynamoDB database
      await updateChapter(currentBiographyId, chapterId, currentUser.id, {
        layout: payloadLayout
      });
      if (!silent) {
        addToast({
          title: "Spread Saved to Legacy Book",
          message: "✨ Your scrapbook spread has been preserved for export.",
          variant: "success",
          duration: 2500,
        });
      }
    } catch (err) {
      console.error("Layout save failed", err);
      if (!silent) {
        addToast({
          title: "Save Failed",
          message: "The magic scroll layout failed to write.",
          variant: "error",
          duration: 3000,
        });
      }
    }
  }, [currentBiographyId, chapterId, currentChapter, currentUser.id, store, addToast]);

  useEffect(() => {
    if (elements.length > 0) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        void saveLayout(elements, true);
      }, 5000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [elements, saveLayout]);

  useEffect(() => {
    if (isOpen) {
      import("../pdf/fonts").then(({ loadWebFonts }) => {
        loadWebFonts();
      }).catch(err => {
        console.error("Failed to load web fonts dynamically:", err);
      });
    }
  }, [isOpen]);

  // Load layout from current chapter on open, dynamic merging and auto AI layout
  useEffect(() => {
    if (!isOpen) {
      hasInitializedRef.current = false;
      return;
    }
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initLayout = async () => {
      const state = useBiographyStore.getState();
      const currentChapter = state.chapters.find((c) => c.id === chapterId);
      if (!currentChapter) return;

      const activeMessages = state.messages.filter((m) => m.chapterId === chapterId);
      const savedLayout = (currentChapter.layout && Array.isArray(currentChapter.layout))
        ? (currentChapter.layout as LayoutElement[])
        : [];

      // Extract metadata if present
      const metadataItem = savedLayout.find((el) => el.id === "layout-metadata");
      if (metadataItem && (metadataItem as any).backgroundColor) {
        setSelectedBgColor((metadataItem as any).backgroundColor);
      } else {
        setSelectedBgColor("#FDFBF7");
      }

      // Filter out elements that belong to deleted messages and omit metadata block from elements state
      const activeLayout = savedLayout.filter((el) => {
        if (el.id === "layout-metadata") return false;
        if (el.id === "chapter-title" || el.type === "sticker") return true;
        return activeMessages.some(
          (m) => m.id === el.id || m.id === (el as any).memoryId || m.id === (el as any).memory_id
        );
      });

      // Find messages that don't have an element yet
      const missingMessages = activeMessages.filter((m) => {
        return !activeLayout.some(
          (el) => el.id === m.id || (el as any).memoryId === m.id || (el as any).memory_id === m.id
        );
      });

      if (activeLayout.length === 0 && activeMessages.length > 0) {
        // First entry, empty layout: run the AI layout engine!
        try {
          const memoriesSummary = activeMessages.map((m) => ({
            id: m.id,
            type: m.media?.some((med) => med.type === "image") ? "image" : "text",
            polished_caption: m.polishedCaption || m.content,
            original_text: m.originalText || m.content,
            image_url: m.media?.find((med) => med.type === "image")?.url,
          }));

          const layoutItems = await generateLayout(chapterId, memoriesSummary, seedRef.current);
          const autoElements: LayoutElement[] = activeMessages.map((m, i) => {
            const match = layoutItems.find((item) => item.memory_id === m.id) || layoutItems[i % Math.max(1, layoutItems.length)];
            const xPos = match ? Math.round((match.x_percent / 100) * 800) : 150 + (i * 30) % 300;
            const yPos = match ? Math.round((match.y_percent / 100) * 1000) + 120 : 200 + (i * 50) % 400;
            const widthVal = match ? Math.max(120, Math.round((match.width_percent / 100) * 800)) : 320;
            const rotationVal = match ? match.rotation_deg : (i % 2 === 0 ? 3 : -3);
            const imageObj = m.media?.find((med) => med.type === "image");

            return {
              id: m.id,
              memoryId: m.id,
              type: imageObj ? "image" : "text",
              url: imageObj?.url || "",
              content: m.content,
              x: xPos,
              y: yPos,
              width: widthVal,
              rotation: rotationVal,
              textVariant: m.activeVariant || "polished"
            } as any;
          });

          setElements(autoElements);
          saveLayout(autoElements, false);
        } catch (err) {
          console.error("Auto AI layout failed", err);
          const fallbackList = activeMessages.map((m, i) => {
            const imageObj = m.media?.find((med) => med.type === "image");
            return {
              id: m.id,
              memoryId: m.id,
              type: imageObj ? "image" : "text",
              url: imageObj?.url || "",
              content: m.content,
              x: 150 + (i * 30) % 300,
              y: 200 + (i * 50) % 400,
              width: 320,
              rotation: i % 2 === 0 ? 3 : -3,
              textVariant: m.activeVariant || "polished"
            } as any;
          });
          setElements(fallbackList);
          saveLayout(fallbackList, false);
        }
      } else if (missingMessages.length > 0) {
        // Layout exists but we have new messages: append them dynamically
        const newElements = [...activeLayout];
        missingMessages.forEach((m) => {
          const imageObj = m.media?.find((med) => med.type === "image");
          newElements.push({
            id: m.id,
            memoryId: m.id,
            type: imageObj ? "image" : "text",
            url: imageObj?.url || "",
            content: m.content,
            x: 150 + (newElements.length * 30) % 300,
            y: 200 + (newElements.length * 45) % 400,
            width: imageObj ? 320 : 420,
            rotation: newElements.length % 2 === 0 ? 3.5 : -3.5,
            textVariant: m.activeVariant || "polished"
          } as any);
        });

        setElements(newElements);
        saveLayout(newElements, false);
      } else {
        setElements(activeLayout);
      }
    };

    initLayout();
  }, [isOpen, chapterId, saveLayout]);

  // Handle ESC key to exit fullscreen and Delete key to delete selected element
  const [elementToDelete, setElementToDelete] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !isEditingTitle) {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== "input" && activeTag !== "textarea") {
          setElementToDelete(selectedId);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedId, isEditingTitle, onClose]);

  const confirmDeleteElement = async () => {
    if (!elementToDelete) return;
    const targetId = elementToDelete;
    setElementToDelete(null);

    const updated = elements.filter((el) => el.id !== targetId);
    setElements(updated);
    if (selectedId === targetId) setSelectedId(null);

    // Sync deletion to chat store & backend API
    const matchingMsg = messages.find(
      (m) => m.id === targetId || m.id === (elements.find((el) => el.id === targetId) as any)?.memoryId
    );
    if (matchingMsg) {
      try {
        await deleteMemoryApi(matchingMsg.id, currentUser.id);
        store.removeMessage(matchingMsg.id);
      } catch (err) {
        console.error("Delete sync error", err);
      }
    }

    saveLayout(updated, true);
    addToast({
      title: "Element Removed",
      message: "The element has been removed from your scrapbook spread and archives.",
      variant: "info",
      duration: 2000,
    });
  };

  const handleAddText = () => {
    const newEl: LayoutElement = {
      id: crypto.randomUUID(),
      type: "text",
      content: "Click to write your memory description...",
      x: 200,
      y: 150,
      width: 350,
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
  };

  const handleAddSticker = (emoji: string) => {
    const newEl: LayoutElement = {
      id: crypto.randomUUID(),
      type: "sticker",
      content: emoji,
      x: 300,
      y: 200,
      width: 80,
      rotation: 0,
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(newEl.id);
    setShowStickers(false);
  };

  const handleBgColorChange = (color: string) => {
    setSelectedBgColor(color);
    void saveLayout(elements, true, color);
  };

  const handleUploadImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        addToast({
          title: "Uploading Image",
          message: "Sending scrapbook photograph to archives...",
          variant: "info",
          duration: 2500,
        });
        const media = await upload.upload(file);
        const newEl: LayoutElement = {
          id: crypto.randomUUID(),
          type: "image",
          url: media.url,
          x: 250,
          y: 180,
          width: 260,
          rotation: 0,
        };
        setElements((prev) => [...prev, newEl]);
        setSelectedId(newEl.id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteElement = (id: string) => {
    setElementToDelete(id);
  };

  const updateElementProp = (id: string, updates: Partial<LayoutElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  // Drag interaction logic
  const dragStartRef = useRef<{ startX: number; startY: number; elX: number; elY: number } | null>(null);
  
  const handleDragStart = (e: React.MouseEvent, el: LayoutElement) => {
    e.stopPropagation();
    setSelectedId(el.id);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elX: el.x,
      elY: el.y,
    };

    const handleMouseMove = (moveEvt: MouseEvent) => {
      if (!dragStartRef.current) return;
      const diffX = moveEvt.clientX - dragStartRef.current.startX;
      const diffY = moveEvt.clientY - dragStartRef.current.startY;
      
      // Snap to 10px increments
      let newX = dragStartRef.current.elX + diffX;
      let newY = dragStartRef.current.elY + diffY;
      newX = Math.round(newX / 10) * 10;
      newY = Math.round(newY / 10) * 10;

      updateElementProp(el.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Resize interaction logic
  const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleResizeStart = (e: React.MouseEvent, el: LayoutElement) => {
    e.stopPropagation();
    e.preventDefault();
    resizeStartRef.current = {
      startX: e.clientX,
      startWidth: el.width,
    };

    const handleMouseMove = (moveEvt: MouseEvent) => {
      if (!resizeStartRef.current) return;
      const diffX = moveEvt.clientX - resizeStartRef.current.startX;
      let newWidth = resizeStartRef.current.startWidth + diffX;
      newWidth = Math.max(80, Math.round(newWidth / 10) * 10);
      updateElementProp(el.id, { width: newWidth });
    };

    const handleMouseUp = () => {
      resizeStartRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Rotate interaction logic
  const rotateStartRef = useRef<{ centerX: number; centerY: number; startAngle: number; startRotation: number } | null>(null);

  const handleRotateStart = (e: React.MouseEvent, el: LayoutElement, elRef: HTMLDivElement | null) => {
    e.stopPropagation();
    e.preventDefault();
    if (!elRef) return;

    const rect = elRef.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    
    rotateStartRef.current = {
      centerX,
      centerY,
      startAngle,
      startRotation: el.rotation,
    };

    const handleMouseMove = (moveEvt: MouseEvent) => {
      if (!rotateStartRef.current) return;
      const angle = Math.atan2(
        moveEvt.clientY - rotateStartRef.current.centerY,
        moveEvt.clientX - rotateStartRef.current.centerX
      );
      const angleDiff = angle - rotateStartRef.current.startAngle;
      const rotationDeg = rotateStartRef.current.startRotation + (angleDiff * 180) / Math.PI;
      updateElementProp(el.id, { rotation: Math.round(rotationDeg) });
    };

    const handleMouseUp = () => {
      rotateStartRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Filter messages images for draggable side drawer
  const availableImages = messages
    .filter((m) => m.chapterId === chapterId)
    .flatMap((m) => m.media ?? [])
    .filter((media) => media.type === "image");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#100018] flex select-none overflow-hidden font-serif">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      {/* Background stardust glow simulation */}
      <div className="absolute inset-0 bg-[#150220] bg-gradient-to-b from-[#210230] via-[#100018] to-[#07000c] pointer-events-none" />
      <div className="absolute top-16 left-1/4 w-96 h-96 rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-96 h-96 rounded-full bg-yellow-600/5 blur-[120px] pointer-events-none" />

      {/* Main Workspace Scrapbook Canvas */}
      <div 
        className="flex-1 overflow-auto p-12 relative flex justify-center items-start scroll-hide"
        onClick={() => setSelectedId(null)}
      >
        {/* Infinite Parchment Scroll Sheet (Grid snap backdrop simulated) */}
        <div
          className="relative min-h-[1600px] w-[1000px] shadow-[0_25px_60px_rgba(0,0,0,0.6)] rounded-2xl border border-gold/30 paper-texture select-none shrink-0"
          style={{
            backgroundColor: selectedBgColor,
            backgroundImage: "radial-gradient(circle, rgba(166,124,46,0.03) 1.5px, transparent 1.5px)",
            backgroundSize: "20px 20px",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact"
          } as any}
        >
          {/* Scroll Wooden rollers styling top & bottom */}
          <div className="absolute -top-3 inset-x-12 h-6 rounded-full bg-gradient-to-b from-[#eedcb4] via-[#c4a675] to-[#7c5d32] border border-gold/30 shadow-md" />
          <div className="absolute -bottom-3 inset-x-12 h-6 rounded-full bg-gradient-to-b from-[#eedcb4] via-[#c4a675] to-[#7c5d32] border border-gold/30 shadow-md" />

          {/* Golden Filigree margins */}
          <div className="absolute left-6 inset-y-12 w-0.5 bg-gold/15" />
          <div className="absolute right-6 inset-y-12 w-0.5 bg-gold/15" />

          {/* Heading Title of current chapter with inline edit protection */}
          <div className="text-center pt-16 pb-8 select-none">
            <div className="group relative inline-block">
              {isEditingTitle ? (
                <input
                  autoFocus
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                  className="font-display text-4xl text-[#744c09] uppercase tracking-widest font-extrabold bg-transparent border-b-2 border-[#744c09] outline-none text-center px-2 py-1 max-w-xl"
                />
              ) : (
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="font-display text-4xl text-[#744c09] uppercase tracking-widest font-extrabold mb-1 codex-pointer hover:text-[#5a3a06] transition flex items-center justify-center gap-2 group"
                  title="Click to edit chapter title"
                >
                  <span>{currentChapter?.title ?? "The First Pages"}</span>
                  <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#a67c2e]" />
                </h1>
              )}
            </div>
            <p className="text-xs uppercase tracking-widest text-[#a67c2e] font-sans font-bold mt-1">
              {currentChapter?.timePeriod ?? "Memoir Chapter Record"}
            </p>
          </div>

          {/* Layout Elements Container (Mobile Vertical Stack Fallback vs Desktop Freeform Canvas) */}
          {isMobile ? (
            <div className="w-full space-y-4 p-4 max-w-md mx-auto overflow-y-auto pb-20">
              {elements.map((el) => {
                const memory = messages.find((m) => m.id === el.id || m.id === (el as any).memoryId);
                const variant = memory?.activeVariant || el.textVariant || "polished";
                const textVal = memory
                  ? (variant === "original" ? (memory.originalText || memory.content) : (memory.polishedCaption || memory.content))
                  : el.content;
                const fontClass = variant === "original" ? "font-script font-sans text-[#3E2723]" : "font-serif italic text-[#2c1e16]";

                return (
                  <div key={el.id} className="bg-white p-4 rounded-xl shadow-lg border border-gold/20 relative">
                    <button
                      onClick={() => handleDeleteElement(el.id)}
                      className="absolute top-2 right-2 text-red-400 p-1 hover:bg-red-50 rounded"
                      title="Delete element"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {el.type === "text" && (
                      <p className={`${fontClass} text-base pr-6`}>{textVal}</p>
                    )}
                    {el.type === "image" && (
                      <div className="space-y-2">
                        <img src={el.url} alt="Mobile keepsake" className="w-full h-auto rounded-lg object-cover" />
                        {textVal && (
                          <p className={`${fontClass} text-sm text-center italic mt-2`}>{textVal}</p>
                        )}
                      </div>
                    )}
                    {el.type === "sticker" && (
                      <span className="text-4xl block text-center">{el.content}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="relative w-full min-h-[1300px]">
              {elements.map((el) => {
                const isSelected = selectedId === el.id;
                
                return (
                  <ScrapbookElementWrapper
                    key={el.id}
                    element={el}
                    isSelected={isSelected}
                    onSelect={(e) => {
                      e.stopPropagation();
                      setSelectedId(el.id);
                    }}
                    onDragStart={(e) => handleDragStart(e, el)}
                    onResizeStart={(e) => handleResizeStart(e, el)}
                    onRotateStart={(e, ref) => handleRotateStart(e, el, ref)}
                    onDelete={() => handleDeleteElement(el.id)}
                    onChangeContent={(val) => updateElementProp(el.id, { content: val })}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR (In Fullscreen): Available assets to drag/click onto canvas */}
      <div
        className={`h-full border-l border-gold/25 bg-[#1b0227]/95 transition-all duration-300 relative flex flex-col z-40 shrink-0 ${
          sidebarOpen ? "w-[320px]" : "w-0"
        }`}
      >
        <div className={`w-[320px] h-full p-5 flex flex-col min-h-0 ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none overflow-hidden"}`}>
          {/* Header */}
          <div className="pb-4 border-b border-gold/15 mb-4 flex justify-between items-center">
            <h3 className="font-display text-gold-bright text-xs uppercase tracking-widest font-bold">
              Scrapbook Assets
            </h3>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-white/5 rounded text-parchment/65 hover:text-parchment transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Available Keepsakes */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 scroll-hide">
            <div>
              <p className="text-[10px] text-gold/60 font-sans uppercase font-bold tracking-wider mb-2">
                Chapter Images ({availableImages.length})
              </p>
              {availableImages.length === 0 ? (
                <div className="border border-dashed border-gold/15 rounded-xl p-6 text-center text-xs text-parchment/45 italic">
                  Upload photos inside dashboard to populate here
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const newEl: LayoutElement = {
                          id: crypto.randomUUID(),
                          type: "image",
                          url: img.url,
                          x: 200 + (i * 20),
                          y: 250,
                          width: 250,
                          rotation: 0,
                        };
                        setElements((prev) => [...prev, newEl]);
                        setSelectedId(newEl.id);
                      }}
                      className="border border-gold/20 hover:border-gold-bright rounded-lg overflow-hidden group shadow-md transition"
                    >
                      <img
                        src={img.url}
                        alt="keepsake thumbnail"
                        className="h-20 w-full object-cover group-hover:scale-105 transition duration-200"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-[10px] text-gold/60 font-sans uppercase font-bold tracking-wider mb-2">
                Magical Embellishments
              </p>
              <div className="grid grid-cols-2 gap-2">
                {MAGICAL_STICKERS.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handleAddSticker(st.emoji)}
                    className="border border-gold/15 hover:border-gold/45 rounded-xl bg-white/[0.02] p-3 text-center transition flex flex-col items-center gap-1 hover:bg-white/[0.05]"
                  >
                    <span className="text-2xl">{st.emoji}</span>
                    <span className="text-[10px] text-parchment/65 font-sans tracking-wide">
                      {st.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Backdrop Canvas Theme Selector */}
            <div className="border-t border-gold/15 pt-4">
              <p className="text-[10px] text-gold/60 font-sans uppercase font-bold tracking-wider mb-2.5">
                Canvas Backdrop Color
              </p>
              <div className="flex flex-wrap gap-2">
                {THEME_COLORS.map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => handleBgColorChange(c.color)}
                    className={`w-7 h-7 rounded-full border-2 transition hover:scale-110 active:scale-95 flex items-center justify-center ${
                      selectedBgColor === c.color ? "border-gold-bright ring-1 ring-gold shadow-md" : "border-gold/30 hover:border-gold/60"
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  >
                    {selectedBgColor === c.color && (
                      <span className="text-[10px] text-black font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Toggle Edge Tab */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-12 left-[-20px] h-12 w-5 bg-[#1b0227] border-y border-l border-gold/45 text-gold-bright flex items-center justify-center rounded-l-md shadow-md hover:brightness-110 transition z-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Floating Bottom Toolbar (Gold Pill Shape) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#160220]/90 border border-gold/30 px-6 py-3.5 rounded-full flex items-center gap-3.5 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-md">
        <button
          onClick={handleAddText}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-gold/20 rounded-full text-gold-bright hover:bg-white/10 active:scale-95 transition text-xs font-sans font-bold uppercase tracking-wider"
        >
          <Type className="h-4 w-4" />
          <span>Add Text</span>
        </button>

        <button
          onClick={handleUploadImage}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-gold/20 rounded-full text-gold-bright hover:bg-white/10 active:scale-95 transition text-xs font-sans font-bold uppercase tracking-wider"
        >
          <ImageIcon className="h-4 w-4" />
          <span>Upload Image</span>
        </button>

        <button
          onClick={() => setShowStickers(!showStickers)}
          className="relative flex items-center gap-2 px-4 py-2 bg-white/5 border border-gold/20 rounded-full text-gold-bright hover:bg-white/10 active:scale-95 transition text-xs font-sans font-bold uppercase tracking-wider"
        >
          <Sparkles className="h-4 w-4" />
          <span>Add Sticker</span>

          {showStickers && (
            <div className="absolute bottom-14 left-0 bg-[#160220] border border-gold/35 rounded-2xl p-3 flex gap-2.5 shadow-2xl z-50">
              {MAGICAL_STICKERS.map((st) => (
                <button
                  key={st.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddSticker(st.emoji);
                  }}
                  className="text-2xl hover:scale-125 transition duration-150"
                  title={st.name}
                >
                  {st.emoji}
                </button>
              ))}
            </div>
          )}
        </button>


        <button
          onClick={() => {
            console.log('Living Scroll triggered', { memoriesCount: currentSpread.length });
            setIsLivingScrollOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#B8860B] text-[#1b0227] rounded-full hover:brightness-105 active:scale-95 transition text-xs font-sans font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(212,175,55,0.45)] hover:shadow-[0_0_25px_rgba(212,175,55,0.8)]"
        >
          <Sparkles className="h-4 w-4" />
          <span>View Living Scroll</span>
        </button>

        <button
          onClick={() => saveLayout(elements)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#d4a853] text-[#1b0227] rounded-full hover:brightness-105 active:scale-95 transition text-xs font-sans font-bold uppercase tracking-widest shadow-md"
        >
          <Save className="h-4 w-4" />
          <span>Save Layout</span>
        </button>

        <button
          onClick={() => setShowExport(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-900 border border-gold/45 text-gold-bright rounded-full hover:brightness-110 active:scale-95 transition text-xs font-sans font-bold uppercase tracking-widest shadow-md"
        >
          <BookOpen className="h-4 w-4" />
          <span>Export Book</span>
        </button>

        <button
          onClick={onClose}
          className="flex items-center justify-center h-9 w-9 bg-white/5 border border-red-500/30 text-red-400 rounded-full hover:bg-red-500/10 active:scale-95 transition"
          title="Exit Fullscreen Editor"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <DeleteConfirmationModal
        isOpen={!!elementToDelete}
        onClose={() => setElementToDelete(null)}
        onConfirm={confirmDeleteElement}
        title="Remove Element From Spread?"
        description="This element will be deleted from your active chapter spread. This cannot be undone."
      />

      <ExportBookModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
      />

      {isLivingScrollOpen && (
        <LivingScrollOverlay
          memories={elements
            .filter((el) => el.type === "text" || el.type === "image")
            .map((el) => {
              const msg = messages.find((m) => m.id === el.id);
              return {
                id: el.id,
                imageUrl: el.type === "image" ? el.url : undefined,
                originalText: msg ? (msg.originalText || msg.content || "") : (el.content || ""),
                polishedCaption: msg ? (msg.polishedCaption || msg.content || "") : (el.content || ""),
                activeVariant: msg ? (msg.activeVariant || "polished") : (el.textVariant || "polished"),
                rotation: el.rotation,
              };
            })}
          chapterTitle={currentChapter?.title || "Untold Story"}
          onClose={() => setIsLivingScrollOpen(false)}
        />
      )}
    </div>
  );
}

// Subcomponent to handle scrapbook elements positioning, resizing, rotating, and editing
interface ScrapbookElementWrapperProps {
  element: LayoutElement;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
  onRotateStart: (e: React.MouseEvent, ref: HTMLDivElement | null) => void;
  onDelete: () => void;
  onChangeContent: (val: string) => void;
}

function ScrapbookElementWrapper({
  element,
  isSelected,
  onSelect,
  onDragStart,
  onResizeStart,
  onRotateStart,
  onDelete,
  onChangeContent,
}: ScrapbookElementWrapperProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [imgError, setImgError] = useState(false);

  const messages = useBiographyStore((state) => state.messages);
  const matchingMemory = messages.find(
    (m) => m.id === element.id || m.id === (element as any).memoryId || m.id === (element as any).memory_id
  );

  const activeVariant = matchingMemory?.activeVariant || element.textVariant || "polished";
  const displayContent = matchingMemory
    ? (activeVariant === "original"
        ? (matchingMemory.originalText || matchingMemory.content)
        : (matchingMemory.polishedCaption || matchingMemory.content))
    : (element.content || "");

  const fontStyleClass = activeVariant === "original"
    ? "font-script font-sans text-[#3E2723]"
    : "font-serif italic text-[#2c1e16]";

  // Stop double-click inside wrapper from bubbling
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (element.type === "text") {
      setIsEditing(true);
    }
  };

  return (
    <div
      ref={elRef}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      className={`absolute select-none editor-move group/wrapper ${
        isSelected ? "ring-2 ring-[#d4a853]/60 shadow-[0_0_15px_rgba(212,168,83,0.3)] z-50" : "hover:ring-1 hover:ring-gold/30 z-30"
      }`}
      style={{
        transform: `translate3d(${element.x}px, ${element.y}px, 0px) rotate(${element.rotation}deg)`,
        width: `${element.width}px`,
        transformOrigin: "center center",
        transition: "none",
      }}
    >
      {/* Rotator handle link at top center */}
      {isSelected && (
        <div
          onMouseDown={(e) => onRotateStart(e, elRef.current)}
          className="absolute -top-8 left-1/2 -translate-x-1/2 h-5 w-5 bg-gold border border-gold-bright rounded-full flex items-center justify-center editor-alias shadow-md hover:scale-110 transition z-50"
          title="Drag to rotate"
        >
          <span className="text-[9px] text-ink">⟳</span>
        </div>
      )}

      {/* Delete/trash floating icon */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-8 right-0 p-1.5 bg-red-800 text-white rounded-full hover:bg-red-700 transition shadow-md z-50"
          title="Delete element"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Main Drag Handle Container */}
      <div 
        onMouseDown={onDragStart}
        className="w-full h-full relative"
      >
        {/* Render TEXT block type */}
        {element.type === "text" && (
          <div className="p-4 bg-transparent select-text">
            {isEditing ? (
              <textarea
                autoFocus
                defaultValue={displayContent}
                onBlur={(e) => {
                  onChangeContent(e.target.value);
                  setIsEditing(false);
                }}
                className="w-full bg-[#fbf8f0]/90 border border-gold/45 rounded-lg p-2.5 text-lg font-serif italic text-[#2c1e16] focus:outline-none resize-none leading-relaxed"
                style={{ height: "160px" }}
              />
            ) : (
              <p className={`${fontStyleClass} text-lg sm:text-xl leading-relaxed break-words whitespace-pre-wrap`}>
                {displayContent}
              </p>
            )}
            <p className="text-[9px] font-sans text-gold-dim/60 mt-1 uppercase select-none pointer-events-none opacity-0 group-hover/wrapper:opacity-100 transition">
              Double click text block to edit description
            </p>
          </div>
        )}

        {/* Render IMAGE block type (Polaroid layout style) */}
        {element.type === "image" && (
          <div className="bg-white p-3 pb-9 shadow-xl border border-black/[0.04] relative flex flex-col justify-between">
            {/* Top Tape overlay decoration mockup sticker style */}
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-20 h-5 bg-[#eae2d3]/50 border-x border-black/5 rotate-[-2deg] shadow-sm pointer-events-none select-none" />

            <div className="w-full aspect-[4/3] bg-parchment/30 overflow-hidden border border-black/5 rounded">
              {imgError ? (
                <div className="w-full h-full bg-[#fcf8f0] flex items-center justify-center border border-dashed border-gold/30 rounded select-none pointer-events-none">
                  <span className="text-gold/50 text-xs italic">Image Keepsake</span>
                </div>
              ) : (
                <img
                  src={element.url}
                  alt="scrapbook image keepsake"
                  className="w-full h-full object-cover pointer-events-none select-none"
                  onError={() => {
                    setImgError(true);
                    console.error("Failed to load scrapbook layout image:", element.url);
                  }}
                />
              )}
            </div>
            
            <div className={`mt-3 text-center px-1 break-words select-text ${fontStyleClass} text-sm sm:text-base leading-relaxed`}>
              {displayContent || "Inscribed Keepsake"}
            </div>
          </div>
        )}

        {/* Render STICKER block type */}
        {element.type === "sticker" && (
          <div className="text-center p-2 relative flex items-center justify-center">
            <span 
              className="select-none pointer-events-none"
              style={{ fontSize: `${element.width / 1.5}px`, lineHeight: 1 }}
            >
              {element.content}
            </span>
          </div>
        )}
      </div>

      {/* Resize corner handle at bottom-right */}
      {isSelected && (
        <div
          onMouseDown={onResizeStart}
          className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-gold border border-gold-bright rounded-full editor-se-resize shadow-md hover:scale-110 transition z-50"
          title="Drag to resize"
        />
      )}
    </div>
  );
}
