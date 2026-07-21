"use client";

import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { generateBiographyTexture } from "../../lib/textureGenerator";
import { useBiographyStore } from "../../store/biographyStore";
import type { NarrativeChapter } from "../../types/scroll";

/** Create and dispose a canvas-backed texture whenever written content or uploaded images change. */
export function useBiographyTexture(chapters: NarrativeChapter[]): { texture: THREE.CanvasTexture | null; loading: boolean } {
  const narratives = useBiographyStore((state) => state.narrativeByChapter);
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({});
  const content = useMemo(() => chapters.map((chapter) => ({ ...chapter, text: narratives[chapter.id]?.narrativeText ?? chapter.text })), [chapters, narratives]);
  const imageUrls = useMemo(() => Array.from(new Set(content.flatMap((chapter) => chapter.images?.map((image) => image.url) ?? []))), [content]);

  useEffect(() => {
    let active = true;
    const fallbackImage = new Image();
    fallbackImage.crossOrigin = "anonymous";
    fallbackImage.src = "/images/polaroid-memories.png";

    fallbackImage.onload = () => {
      const missing = imageUrls.filter((url) => !loadedImages[url]);
      if (!missing.length) return;

      Promise.all(
        missing.map((url) => new Promise<[string, HTMLImageElement]>((resolve) => {
          const image = new Image();
          image.crossOrigin = "anonymous";
          image.onload = () => resolve([url, image]);
          image.onerror = () => resolve([url, fallbackImage]); // Fallback on load error
          image.src = url;
        }))
      ).then((results) => {
        if (!active) return;
        const additions = Object.fromEntries(results);
        if (Object.keys(additions).length) {
          setLoadedImages((current) => ({ ...current, ...additions }));
        }
      });
    };
    return () => {
      active = false;
    };
  }, [imageUrls, loadedImages]);

  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useEffect(() => {
    let active = true;
    try {
      const canvas = generateBiographyTexture(content, loadedImages);
      const next = new THREE.CanvasTexture(canvas);
      next.colorSpace = THREE.SRGBColorSpace;
      next.minFilter = THREE.LinearFilter;
      next.magFilter = THREE.LinearFilter;
      next.wrapS = THREE.ClampToEdgeWrapping;
      next.needsUpdate = true;
      if (active) setTexture((previous) => { previous?.dispose(); return next; }); else next.dispose();
    } catch {
      if (active) setTexture(null);
    }
    return () => { active = false; };
  }, [content, loadedImages, fontsLoaded]);

  useEffect(() => () => texture?.dispose(), [texture]);
  return { texture, loading: !texture };
}
