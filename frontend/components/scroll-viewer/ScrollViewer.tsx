"use client";
import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import type { ScrollViewerProps } from "../../types/scroll";
import { FloatingParticles } from "./FloatingParticles";
import { GoldenBorder } from "./GoldenBorder";
import { MemoryKnots } from "./MemoryKnots";
import { ParchmentScroll } from "./ParchmentScroll";
import { ScrollControls } from "./ScrollControls";
import { useBiographyTexture } from "./useBiographyTexture";

const SCROLL_SIZE = { width: 4, height: 5.4 };

function Scene({
  texture,
  progress,
  memories,
  onMemoryClick,
}: {
  texture: NonNullable<ReturnType<typeof useBiographyTexture>["texture"]>;
  progress: number;
  memories: ScrollViewerProps["memories"];
  onMemoryClick: (memory: ScrollViewerProps["memories"][number]) => void;
}) {
  return (
    <>
      <ambientLight intensity={1.3} color="#f5cf70" />
      <directionalLight position={[3, 5, 4]} intensity={2} castShadow />
      <ParchmentScroll
        texture={texture}
        scrollProgress={progress}
        width={SCROLL_SIZE.width}
        height={SCROLL_SIZE.height}
      />
      <GoldenBorder width={SCROLL_SIZE.width} height={SCROLL_SIZE.height} />
      <MemoryKnots memories={memories} onMemoryClick={onMemoryClick} />
      <FloatingParticles />
    </>
  );
}

/** Responsive R3F living scroll with a graceful non-WebGL loading fallback. */
export function ScrollViewer({
  biographyId,
  chapters,
  memories,
  onMemoryClick = () => undefined,
  mode = "preview",
}: ScrollViewerProps) {
  const { texture, loading } = useBiographyTexture(chapters);
  const [progress, setProgress] = useState(0);
  const [full, setFull] = useState(mode === "fullscreen");

  const stableMemoryClick = useCallback(
    (memory: ScrollViewerProps["memories"][number]) => onMemoryClick(memory),
    [onMemoryClick]
  );

  useEffect(() => {
    if (!full) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [full]);

  if (loading || !texture) {
    return (
      <div className="living-scroll loading animate-pulse" aria-label="Preparing living scroll">
        Preparing your parchment…
      </div>
    );
  }

  return (
    <section className="living-scroll relative w-full h-full" data-biography-id={biographyId}>
      {/* Inline Preview Canvas */}
      <button
        type="button"
        className="living-scroll-fullscreen absolute top-4 right-4 p-2 rounded-lg bg-black/40 hover:bg-black/60 text-gold-bright border border-gold/30 z-30 transition"
        onClick={() => setFull(true)}
        aria-label="Toggle full screen"
      >
        <Maximize2 className="h-4 w-4" />
      </button>

      <Canvas shadows camera={{ fov: 45, position: [0, -.25, 7], rotation: [-.087, 0, 0] }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Scene
            texture={texture}
            progress={progress}
            memories={memories}
            onMemoryClick={stableMemoryClick}
          />
        </Suspense>
      </Canvas>

      <ScrollControls progress={progress} onScrollChange={setProgress} />

      {/* Fullscreen Portal Overlay */}
      {full && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-[#140624]/98 flex flex-col items-center justify-center z-[99999] animate-in fade-in duration-200">
          {/* Close button in top-right */}
          <button
            type="button"
            onClick={() => setFull(false)}
            className="absolute top-6 right-6 p-2.5 rounded-full border border-gold/45 bg-[#250942]/90 text-gold-bright hover:bg-white/10 transition z-[100000]"
            aria-label="Close full screen"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Heading */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
            <h2 className="font-script text-3xl text-gold-bright text-shadow-md">
              The Living Scroll
            </h2>
            <div className="ornament-line mx-auto mt-1 w-24" />
          </div>

          {/* Centered Scroll Viewport scaled to 80% viewport height */}
          <div className="w-[90vw] h-[80vh] relative mt-8 flex items-center justify-center">
            <Canvas shadows camera={{ fov: 45, position: [0, -.25, 7], rotation: [-.087, 0, 0] }} dpr={[1, 2]}>
              <Suspense fallback={null}>
                <Scene
                  texture={texture}
                  progress={progress}
                  memories={memories}
                  onMemoryClick={stableMemoryClick}
                />
              </Suspense>
            </Canvas>
          </div>

          {/* Bottom Scroll Controls bar */}
          <div className="w-[80vw] max-w-2xl px-6 py-4 rounded-2xl bg-black/45 border border-gold/20 backdrop-blur-md shadow-2xl mt-4">
            <ScrollControls progress={progress} onScrollChange={setProgress} />
            <p className="text-[10px] text-center text-gold/40 mt-1 uppercase tracking-widest">
              Drag the golden seal or use your mouse wheel to unroll the scroll
            </p>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
