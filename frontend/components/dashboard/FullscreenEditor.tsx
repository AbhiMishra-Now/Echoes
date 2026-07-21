"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Trash2, Type, Image as ImageIcon, Sparkles, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { useBiographyStore } from "../../store/biographyStore";
import { useMediaUpload } from "../../hooks/useMediaUpload";
import { updateChapter } from "../../lib/api";

interface LayoutElement {
  id: string;
  type: "text" | "image" | "sticker";
  content?: string;
  url?: string;
  x: number;
  y: number;
  width: number;
  rotation: number;
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

export function FullscreenEditor({ isOpen, onClose, chapterId }: FullscreenEditorProps) {
  const store = useBiographyStore();
  const { currentBiographyId, currentUser, messages, chapters, addToast } = store;
  const currentChapter = chapters.find((c) => c.id === chapterId);

  const [elements, setElements] = useState<LayoutElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showStickers, setShowStickers] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const upload = useMediaUpload(chapterId);

  // Load layout from current chapter on open
  useEffect(() => {
    if (isOpen && currentChapter) {
      if (currentChapter.layout && Array.isArray(currentChapter.layout)) {
        setElements(currentChapter.layout as LayoutElement[]);
      } else {
        // Build initial layout from chapter messages if no layout saved
        const initialElements: LayoutElement[] = [];
        let yOffset = 80;
        
        const chapterMessages = messages.filter((m) => m.chapterId === chapterId);
        
        // Add AI/User text
        const combinedText = chapterMessages
          .filter((m) => m.sender === "user" && m.content.trim())
          .map((m) => m.content.trim())
          .join("\n\n");

        if (combinedText) {
          initialElements.push({
            id: "initial-text",
            type: "text",
            content: combinedText,
            x: 100,
            y: yOffset,
            width: 500,
            rotation: -1,
          });
          yOffset += 240;
        }

        // Add photos
        const images = chapterMessages.flatMap((m) => m.media ?? []).filter((media) => media.type === "image");
        images.forEach((img, index) => {
          initialElements.push({
            id: `initial-img-${index}`,
            type: "image",
            url: img.url,
            x: 150 + index * 80,
            y: yOffset,
            width: 250,
            rotation: (index % 2 === 0 ? 3 : -3),
          });
          yOffset += 220;
        });

        setElements(initialElements);
      }
    }
  }, [isOpen, chapterId, currentChapter, messages]);

  // Debounced auto-save every 5 seconds
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const saveLayout = useCallback(async (currentElements: LayoutElement[], silent = false) => {
    if (!currentBiographyId || !currentChapter) return;
    try {
      // Save locally in store chapter
      store.updateChapterLayout(chapterId, currentElements);
      // Save in S3/DynamoDB database
      await updateChapter(currentBiographyId, chapterId, currentUser.id, {
        layout: currentElements
      });
      if (!silent) {
        addToast({
          title: "Layout Preserved",
          message: "Your scrapbook layout has been safely inscribed.",
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

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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
    setElements((prev) => prev.filter((el) => el.id !== id));
    if (selectedId === id) setSelectedId(null);
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
          className="relative min-h-[1600px] w-[1000px] bg-[#fdfbf7] shadow-[0_25px_60px_rgba(0,0,0,0.6)] rounded-2xl border border-gold/30 paper-texture select-none shrink-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(166,124,46,0.03) 1.5px, transparent 1.5px)",
            backgroundSize: "20px 20px"
          }}
        >
          {/* Scroll Wooden rollers styling top & bottom */}
          <div className="absolute -top-3 inset-x-12 h-6 rounded-full bg-gradient-to-b from-[#eedcb4] via-[#c4a675] to-[#7c5d32] border border-gold/30 shadow-md" />
          <div className="absolute -bottom-3 inset-x-12 h-6 rounded-full bg-gradient-to-b from-[#eedcb4] via-[#c4a675] to-[#7c5d32] border border-gold/30 shadow-md" />

          {/* Golden Filigree margins */}
          <div className="absolute left-6 inset-y-12 w-0.5 bg-gold/15" />
          <div className="absolute right-6 inset-y-12 w-0.5 bg-gold/15" />

          {/* Heading Title of current chapter */}
          <div className="text-center pt-16 pb-8">
            <h1 className="font-display text-4xl text-[#744c09] uppercase tracking-widest font-extrabold mb-1">
              {currentChapter?.title ?? "The First Pages"}
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#a67c2e] font-sans font-bold">
              {currentChapter?.timePeriod ?? "Memoir Chapter Record"}
            </p>
          </div>

          {/* Layout Elements Container */}
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

        <div className="w-px h-6 bg-gold/20 mx-1" />

        <button
          onClick={() => saveLayout(elements)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#d4a853] text-[#1b0227] rounded-full hover:brightness-105 active:scale-95 transition text-xs font-sans font-bold uppercase tracking-widest shadow-md"
        >
          <Save className="h-4 w-4" />
          <span>Save Layout</span>
        </button>

        <button
          onClick={onClose}
          className="flex items-center justify-center h-9 w-9 bg-white/5 border border-red-500/30 text-red-400 rounded-full hover:bg-red-500/10 active:scale-95 transition"
          title="Exit Fullscreen Editor"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        hidden
      />
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
                defaultValue={element.content}
                onBlur={(e) => {
                  onChangeContent(e.target.value);
                  setIsEditing(false);
                }}
                className="w-full bg-[#fbf8f0]/90 border border-gold/45 rounded-lg p-2.5 text-lg font-serif italic text-[#2c1e16] focus:outline-none resize-none leading-relaxed"
                style={{ height: "160px" }}
              />
            ) : (
              <p className="font-serif italic text-lg sm:text-xl text-[#2c1e16] leading-relaxed break-words whitespace-pre-wrap">
                {element.content}
              </p>
            )}
            <p className="text-[9px] font-sans text-gold-dim/60 mt-1 uppercase select-none pointer-events-none opacity-0 group-hover/wrapper:opacity-100 transition">
              Double click text block to edit description
            </p>
          </div>
        )}

        {/* Render IMAGE block type (Polaroid layout style) */}
        {element.type === "image" && (
          <div className="bg-white p-3 pb-8 shadow-xl border border-black/[0.04] relative">
            {/* Top Tape overlay decoration mockup sticker style */}
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-20 h-5 bg-[#eae2d3]/50 border-x border-black/5 rotate-[-2deg] shadow-sm pointer-events-none select-none" />

            <div className="w-full aspect-[4/3] bg-parchment/30 overflow-hidden border border-black/5 rounded">
              <img
                src={element.url}
                alt="scrapbook image keepsake"
                className="w-full h-full object-cover pointer-events-none select-none"
              />
            </div>
            
            <div className="absolute bottom-2 left-3 font-serif text-[10px] italic text-gray-500 tracking-wide select-none">
              Inscribed Keepsake Memory
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
