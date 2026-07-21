"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBiography, createChapter, getChapters, toChapter } from "../lib/api";
import { useBiographyStore } from "../store/biographyStore";

const ARCHIVE_INTRO_KEY = "echoes_archive_intro_seen";

/** Hydrate chapters from FastAPI without repeatedly blocking the dashboard with an archive overlay. */
export function useBiographySync() {
  const store = useBiographyStore();
  const [isInitialLoading, setInitialLoading] = useState(false);
  const hydrated = useRef(false);

  const sync = useCallback(async (showArchiveOverlay = false) => {
    if (!store.currentUser.id) return;
    if (showArchiveOverlay) setInitialLoading(true);
    try {
      let bioId = store.currentBiographyId;
      if (!bioId) {
        const bio = await createBiography(store.currentUser.id, "Echoes of a Life");
        bioId = bio.id;
        store.setBiographyId(bioId);
      }
      let remoteChapters = await getChapters(bioId, store.currentUser.id);
      if (remoteChapters.length === 0) remoteChapters = [await createChapter(bioId, store.currentUser.id, "The First Pages")];
      store.setChapters(remoteChapters.map(toChapter));
    } catch {
      store.addToast({ title: "Attention Needed", message: "The magic connection flickered. Your local story is still safe.", variant: "error", duration: 5000 });
    } finally {
      if (showArchiveOverlay) setInitialLoading(false);
    }
  }, [store]);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const shouldShowIntro = !localStorage.getItem(ARCHIVE_INTRO_KEY);
    if (shouldShowIntro) localStorage.setItem(ARCHIVE_INTRO_KEY, "yes");
    void sync(shouldShowIntro);
  }, [sync]);

  useEffect(() => {
    if (!store.currentBiographyId) return;
    const poll = window.setInterval(() => { void sync(false); }, 30_000);
    return () => window.clearInterval(poll);
  }, [store.currentBiographyId, sync]);

  return { isInitialLoading, sync, bioId: store.currentBiographyId };
}
