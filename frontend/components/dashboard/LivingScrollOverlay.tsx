"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles, X, ChevronLeft, ChevronRight } from "lucide-react";
import * as THREE from "three";

import { generateScrollTexture } from "../../lib/scrollTextureGenerator";

// 1. Starry Void Particle Background (Instanced rendering, max 100)
function StarryVoid() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 150;

  // Stable parameters for particles
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 15,
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 4 - 2,
        speed: Math.random() * 0.012 + 0.006,
        noiseX: Math.random() * 100,
        noiseSpeed: Math.random() * 0.015 + 0.005
      });
    }
    return temp;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Mouse parallax reaction
    const mouseX = state.pointer.x * 0.6;
    const mouseY = state.pointer.y * 0.6;

    particles.forEach((p, i) => {
      // Float upward slowly
      p.y += p.speed;
      if (p.y > 6) p.y = -6;

      // Horizontal wander using sine wave
      const xWander = Math.sin(state.clock.getElapsedTime() * p.noiseSpeed + p.noiseX) * 0.08;

      dummy.position.set(p.x + xWander + mouseX, p.y + mouseY, p.z);
      const scale = ((p.z + 4) / 4) * 0.05;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[null as any, null as any, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#ffdf7c" transparent opacity={0.55} />
    </instancedMesh>
  );
}

// 2. 3D Scroll Plane Mesh
function ThreeScroll({
  texture,
  pageChangeTrigger,
  isNextDirection,
}: {
  texture: THREE.CanvasTexture;
  pageChangeTrigger: number;
  isNextDirection: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const animProgress = useRef(1);

  useEffect(() => {
    if (pageChangeTrigger > 0) {
      animProgress.current = 0; // Trigger page-turn slide animation
    }
  }, [pageChangeTrigger]);

  useFrame(() => {
    if (!meshRef.current || !materialRef.current) return;

    if (animProgress.current < 1) {
      animProgress.current += 0.05; // 600ms page-turn slide
      const t = animProgress.current;
      const easeOutCubic = 1 - Math.pow(1 - t, 3);

      // Slide and fade transition
      meshRef.current.position.x = (1 - easeOutCubic) * 6 * (isNextDirection ? 1 : -1);
      materialRef.current.opacity = easeOutCubic;
    } else {
      meshRef.current.position.x = 0;
      materialRef.current.opacity = 1;
    }
  });

  return (
    <group>
      {/* Ambient occlusion scroll shadow */}
      <mesh position={[0, -0.15, -0.2]}>
        <planeGeometry args={[5.0, 6.6]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>

      {/* Main Parchment scroll */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <planeGeometry args={[4.8, 6.4]} />
        <meshBasicMaterial ref={materialRef} map={texture} transparent />
      </mesh>

      {/* Ornate Gold Cylindrical Rollers */}
      <mesh position={[0, 3.32, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 5.2, 24]} />
        <meshStandardMaterial
          color="#d4af37"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      <mesh position={[0, -3.32, 0.02]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.13, 0.13, 5.2, 24]} />
        <meshStandardMaterial
          color="#d4af37"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

// Main Overlay Component
export interface ScrollMemory {
  id: string;
  imageUrl?: string;
  originalText: string;
  polishedCaption: string;
  activeVariant: 'original' | 'polished';
  rotation?: number;
}

interface LivingScrollOverlayProps {
  memories: ScrollMemory[];
  chapterTitle: string;
  onClose: () => void;
}

export function LivingScrollOverlay({
  memories,
  chapterTitle,
  onClose,
}: LivingScrollOverlayProps) {
  // Pagination splits memories (max 5 per page)
  const totalPages = Math.max(1, Math.ceil(memories.length / 5));
  const [currentPage, setCurrentPage] = useState(0);

  const currentPageMemories = useMemo(() => {
    return memories.slice(currentPage * 5, (currentPage + 1) * 5);
  }, [memories, currentPage]);

  // Page animation triggers
  const [pageChangeTrigger, setPageChangeTrigger] = useState(0);
  const [isNextDirection, setIsNextDirection] = useState(true);

  // Image preloading state
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const [imagesReady, setImagesReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect Mobile width
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Preload images for current page
  useEffect(() => {
    let active = true;
    setImagesReady(false);

    const imageUrls = currentPageMemories
      .filter((m) => m.imageUrl)
      .map((m) => m.imageUrl!);

    if (imageUrls.length === 0) {
      setImagesReady(true);
      return;
    }

    Promise.all(
      imageUrls.map(
        (url) =>
          new Promise<[string, HTMLImageElement]>((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve([url, img]);
            img.onerror = () => resolve([url, img]); // Fallback to empty/unrendered on load error
            img.src = url;
          })
      )
    ).then((results) => {
      if (!active) return;
      const cache = Object.fromEntries(results);
      setLoadedImages((prev) => ({ ...prev, ...cache }));
      setImagesReady(true);
    });

    return () => {
      active = false;
    };
  }, [currentPage, currentPageMemories]);

  // Generate THREE texture
  const texture = useMemo(() => {
    if (!imagesReady) return null;
    try {
      const canvas = generateScrollTexture(currentPageMemories, loadedImages);
      const next = new THREE.CanvasTexture(canvas);
      next.colorSpace = THREE.SRGBColorSpace;
      next.minFilter = THREE.LinearFilter;
      next.needsUpdate = true;
      return next;
    } catch (e) {
      console.error("Canvas texture update failed:", e);
      return null;
    }
  }, [currentPageMemories, loadedImages, imagesReady]);

  // Escape key close handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Reset page position on open
  useEffect(() => {
    setCurrentPage(0);
  }, [memories]);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setIsNextDirection(true);
      setPageChangeTrigger((prev) => prev + 1);
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setIsNextDirection(false);
      setPageChangeTrigger((prev) => prev + 1);
      setCurrentPage((prev) => prev - 1);
    }
  };



  const overlayJSX = (
    <div className="fixed inset-0 bg-[#1a0b2e] flex flex-col items-center justify-center z-[9999] overflow-hidden select-none select-none select-none">
      {/* Top Left Chapter Title Header */}
      <div className="absolute top-6 left-6 pointer-events-none z-10">
        <span className="font-display text-xs text-gold/60 uppercase tracking-widest block mb-0.5">
          Chapter Overview
        </span>
        <h2 className="font-display text-2xl md:text-3xl text-gold-bright font-extrabold uppercase tracking-wide">
          CHAPTER: {chapterTitle}
        </h2>
      </div>

      {/* Top Right Exit Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 p-2.5 rounded-full border-2 border-gold/45 bg-[#250942] text-gold-bright hover:brightness-110 active:scale-95 transition-all z-20 shadow-[0_0_15px_rgba(212,175,55,0.35)]"
        aria-label="Exit Living Scroll Overlay"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Main 3D Viewport or Mobile Fallback Content Container */}
      <div className="w-[95vw] h-[85vh] flex items-center justify-center relative">
        {isMobile ? (
          // Mobile Fallback Renders Stacked Memories
          <div className="w-full h-full max-w-md bg-[#FDFBF7] rounded-xl border border-[#b37c2d] p-6 overflow-y-auto text-ink flex flex-col gap-6 shadow-2xl relative">
            {/* Top and Bottom Cylindrical Roller Accents */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#b8860b] via-[#d4af37] to-[#b8860b] border-b border-gold-bright/30" />
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-[#b8860b] via-[#d4af37] to-[#b8860b] border-t border-gold-bright/30" />

            <div className="py-4 flex flex-col gap-6">
              {currentPageMemories.length === 0 ? (
                <p className="italic text-center text-slate-500 font-sans mt-20">
                  Your story awaits its first inscription...
                </p>
              ) : (
                currentPageMemories.map((m) => {
                  const text = m.activeVariant === "original" ? m.originalText : m.polishedCaption;
                  const hasImage = !!m.imageUrl;
                  const firstLetter = text ? text.charAt(0) : "";
                  const restOfText = text ? text.slice(1) : "";
                  return (
                    <div key={m.id} className="flex flex-col gap-4 border-b border-[#b37c2d]/10 pb-4">
                      {hasImage && (
                        <div className="w-full bg-white p-3 shadow-md border border-slate-200/50 rounded transform rotate-1 select-none pointer-events-none">
                          <img
                            src={m.imageUrl}
                            alt=" keepsake"
                            className="w-full aspect-[4/3] object-cover"
                          />
                        </div>
                      )}
                      {text && (
                        <div className="text-left font-serif leading-relaxed text-[#2c1e16]">
                          <span className="font-display font-extrabold text-4xl float-left mr-2 text-[#d4af37]">
                            {firstLetter}
                          </span>
                          <span>{restOfText}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          // R3F 3D Scroll Visualization
          <div className="w-full h-full relative">
            {!imagesReady && (
              <div className="absolute inset-0 flex items-center justify-center text-gold-bright font-serif text-lg animate-pulse z-30">
                Inscribing parchment with memories…
              </div>
            )}
            <Canvas shadows camera={{ fov: 45, position: [0, 0, 8.2] }} dpr={[1, 2]}>
              <ambientLight intensity={1.3} color="#ffeaa7" />
              <directionalLight position={[2, 4, 3]} intensity={1.8} castShadow />
              <Suspense fallback={null}>
                <StarryVoid />
                {texture && (
                  <ThreeScroll
                    texture={texture}
                    pageChangeTrigger={pageChangeTrigger}
                    isNextDirection={isNextDirection}
                  />
                )}
              </Suspense>
            </Canvas>
          </div>
        )}
      </div>

      {/* Ornate Pagination Controls */}
      <div className="absolute bottom-8 w-full max-w-2xl px-6 flex flex-col items-center gap-4 z-10">
        {/* Navigation Arrows & Dot Indicators */}
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="p-3 rounded-full border border-gold/30 bg-[#250942] text-gold-bright hover:scale-110 disabled:opacity-30 disabled:pointer-events-none hover:shadow-[0_0_15px_rgba(212,175,55,0.6)] transition duration-150"
            aria-label="Previous Page"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2.5">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <span
                key={idx}
                className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                  idx === currentPage
                    ? "bg-[#d4af37] scale-125 shadow-[0_0_8px_#ffe59a]"
                    : "bg-[#d4af37]/35"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="p-3 rounded-full border border-gold/30 bg-[#250942] text-gold-bright hover:scale-110 disabled:opacity-30 disabled:pointer-events-none hover:shadow-[0_0_15px_rgba(212,175,55,0.6)] transition duration-150"
            aria-label="Next Page"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        <p className="text-[10px] text-center text-gold/50 uppercase tracking-widest">
          PAGE {currentPage + 1} OF {totalPages}
        </p>
      </div>
    </div>
  );

  return overlayJSX;
}
